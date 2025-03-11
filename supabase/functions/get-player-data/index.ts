
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Function to check if a time is after 5:00 AM UTC
function isAfterDailyReset(date: Date): boolean {
  return date.getUTCHours() >= 5;
}

// Function to get current UTC date in YYYY-MM-DD format
function getUtcDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Function to get the first day of the current season (last Monday of previous month)
function getCurrentSeasonStartDate(): Date {
  const now = new Date();
  
  // Get the current month and year
  const year = now.getFullYear();
  const month = now.getMonth();
  
  // Go back to the previous month
  const previousMonth = month === 0 ? 11 : month - 1;
  const yearOfPrevMonth = month === 0 ? year - 1 : year;
  
  // Find the last day of the previous month
  const lastDayOfPrevMonth = new Date(yearOfPrevMonth, previousMonth + 1, 0);
  
  // Find the last Monday of that month by going backwards
  const lastMonday = new Date(lastDayOfPrevMonth);
  while (lastMonday.getDay() !== 1) { // 1 is Monday
    lastMonday.setDate(lastMonday.getDate() - 1);
  }
  
  // Set the time to 5:00 AM UTC (season start time)
  lastMonday.setUTCHours(5, 0, 0, 0);
  
  return lastMonday;
}

// Function to get the last day of the previous season
function getPreviousSeasonEndDate(): Date {
  const currentSeasonStart = getCurrentSeasonStartDate();
  
  // The previous season ended right before the current one started
  const previousSeasonEnd = new Date(currentSeasonStart);
  previousSeasonEnd.setSeconds(previousSeasonEnd.getSeconds() - 1);
  
  return previousSeasonEnd;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Parse request body
  let playerTag: string | null = null;
  
  try {
    if (req.method === 'POST') {
      const body = await req.json();
      playerTag = body.playerTag;
      console.log("Extracted player tag from body:", playerTag);
    }
  } catch (e) {
    console.error("Error parsing request body:", e);
  }
  
  // If not in body, try URL params
  if (!playerTag) {
    const url = new URL(req.url);
    playerTag = url.searchParams.get('playerTag');
    console.log("Extracted player tag from URL params:", playerTag);
  }

  console.log('Get-player-data function called with tag:', playerTag);

  if (!playerTag) {
    return new Response(
      JSON.stringify({ error: 'Player tag is required' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    // Format the player tag (handle with or without #)
    const formattedTag = playerTag.startsWith('#') ? playerTag.substring(1) : playerTag;
    console.log('Getting data for player tag:', formattedTag);
    
    // Fetch player data
    const { data: player, error: playerError } = await supabase
      .from('tracked_players')
      .select('*')
      .eq('player_tag', formattedTag)
      .maybeSingle();
      
    if (playerError) {
      console.error('Database error fetching player:', playerError);
      return new Response(
        JSON.stringify({ error: 'Database error', details: playerError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    if (!player) {
      console.log('Player not found in database:', formattedTag);
      return new Response(
        JSON.stringify({ error: 'Player not found in tracking database' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Player found:', player.name, 'with ID:', player.id);
    
    // Fetch trophy history (most recent 50 entries)
    const { data: trophyHistory, error: historyError } = await supabase
      .from('trophy_history')
      .select('*')
      .eq('player_id', player.id)
      .order('recorded_at', { ascending: false })
      .limit(50);
      
    if (historyError) {
      console.error('Error fetching trophy history:', historyError);
    }
    
    // Get the current season start date
    const currentSeasonStart = getCurrentSeasonStartDate();
    const currentSeasonStartStr = getUtcDateString(currentSeasonStart);
    
    // Get the previous season end date
    const previousSeasonEnd = getPreviousSeasonEndDate();
    const previousSeasonEndStr = getUtcDateString(previousSeasonEnd);
    
    console.log('Current season started on:', currentSeasonStartStr);
    
    // Fetch daily stats for the current season
    const { data: currentSeasonStats, error: currentSeasonError } = await supabase
      .from('daily_stats')
      .select('*')
      .eq('player_id', player.id)
      .gte('date', currentSeasonStartStr)
      .order('date', { ascending: false });
      
    if (currentSeasonError) {
      console.error('Error fetching current season stats:', currentSeasonError);
    }
    
    // Fetch daily stats for the previous season
    const { data: previousSeasonStats, error: previousSeasonError } = await supabase
      .from('daily_stats')
      .select('*')
      .eq('player_id', player.id)
      .lt('date', currentSeasonStartStr)
      .order('date', { ascending: false });
      
    if (previousSeasonError) {
      console.error('Error fetching previous season stats:', previousSeasonError);
    }
    
    // Get current UTC time
    const now = new Date();
    const utcDate = getUtcDateString(now);

    // Determine today/yesterday based on UTC 5:00 AM reset time
    const isAfterReset = isAfterDailyReset(now);
    const todayDate = utcDate;
    const yesterdayDate = new Date(now);
    yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - (isAfterReset ? 1 : 2));
    const yesterdayDateString = getUtcDateString(yesterdayDate);
    
    console.log('Current UTC date:', todayDate, 'Is after reset:', isAfterReset, 'Yesterday date:', yesterdayDateString);
    
    // Filter trophy history for today (based on reset time)
    const todayHistory = (trophyHistory || []).filter(entry => {
      const entryDate = new Date(entry.recorded_at);
      
      // If we're after the reset, include only entries from after the reset today
      if (isAfterReset) {
        return getUtcDateString(entryDate) === todayDate && 
               entryDate.getUTCHours() >= 5;
      } 
      // If we're before the reset, include entries from yesterday after reset until now
      else {
        const yesterdayWithReset = new Date(todayDate);
        yesterdayWithReset.setUTCDate(yesterdayWithReset.getUTCDate() - 1);
        yesterdayWithReset.setUTCHours(5, 0, 0, 0);
        
        return entryDate >= yesterdayWithReset && entryDate <= now;
      }
    });
    
    // Process today's attacks and defenses
    const todayAttacks = todayHistory
      .filter(entry => entry.is_attack)
      .map((attack, index) => ({
        id: attack.id,
        time: new Date(attack.recorded_at).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        change: attack.trophy_change,
        count: index + 1
      }));
      
    const todayDefenses = todayHistory
      .filter(entry => !entry.is_attack)
      .map((defense, index) => ({
        id: defense.id,
        time: new Date(defense.recorded_at).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        change: defense.trophy_change,
        count: index + 1
      }));
    
    // Find today's stats from dailyStats if it exists or create one
    let todayStatsEntry = currentSeasonStats?.find(stat => stat.date === todayDate);
    
    // Calculate today's stats from battle history if needed
    if (!todayStatsEntry) {
      const todayAttackValues = todayAttacks.map(attack => attack.change);
      const todayDefenseValues = todayDefenses.map(defense => defense.change);
      
      todayStatsEntry = {
        date: todayDate,
        offense_count: todayAttacks.length,
        offense_total: todayAttackValues.reduce((sum, val) => sum + val, 0),
        defense_count: todayDefenses.length,
        defense_total: Math.abs(todayDefenseValues.reduce((sum, val) => sum + val, 0)),
        net_change: todayAttackValues.reduce((sum, val) => sum + val, 0) + 
                    todayDefenseValues.reduce((sum, val) => sum + val, 0)
      };
    }
    
    // Format season data for frontend
    const dailyHistory = (currentSeasonStats || []).map(day => ({
      date: day.date,
      offenseCount: day.offense_count || 0,
      defenseCount: day.defense_count || 0,
      offenseTotal: day.offense_total || 0,
      defenseTotal: day.defense_total || 0,
      netChange: day.net_change || 0
    }));
    
    // Format previous season data
    const previousSeasonHistory = (previousSeasonStats || []).map(day => ({
      date: day.date,
      offenseCount: day.offense_count || 0,
      defenseCount: day.defense_count || 0,
      offenseTotal: day.offense_total || 0,
      defenseTotal: day.defense_total || 0,
      netChange: day.net_change || 0
    }));
    
    // Calculate player stats from today's history
    const attackValues = todayHistory
      .filter(entry => entry.is_attack)
      .map(entry => entry.trophy_change);
      
    const defenseValues = todayHistory
      .filter(entry => !entry.is_attack)
      .map(entry => entry.trophy_change);
      
    const stats = {
      offenseTotal: attackValues.reduce((sum, val) => sum + val, 0),
      offenseAvg: attackValues.length 
        ? +(attackValues.reduce((sum, val) => sum + val, 0) / attackValues.length).toFixed(1)
        : 0,
      defenseTotal: Math.abs(defenseValues.reduce((sum, val) => sum + val, 0)),
      defenseAvg: defenseValues.length
        ? +(Math.abs(defenseValues.reduce((sum, val) => sum + val, 0)) / defenseValues.length).toFixed(1)
        : 0,
      netChange: attackValues.reduce((sum, val) => sum + val, 0) + defenseValues.reduce((sum, val) => sum + val, 0),
      bestAttack: attackValues.length ? Math.max(...attackValues) : 0,
      worstDefense: defenseValues.length ? Math.min(...defenseValues) : 0
    };
    
    // Get yesterday's stats
    const yesterdayStats = dailyHistory?.find(stat => stat.date === yesterdayDateString) || null;
    
    console.log('Successfully processed player data for:', player.name);
    
    // Return the compiled data
    return new Response(
      JSON.stringify({
        player: {
          id: player.id,
          name: player.name,
          tag: `#${player.player_tag}`,
          clan: player.clan_name,
          trophies: player.current_trophies,
          rank: null, // Placeholder - would need additional data to determine rank
          seasonHighest: trophyHistory?.length ? Math.max(player.current_trophies, ...trophyHistory.map(h => h.new_trophies)) : player.current_trophies,
          lastUpdated: player.last_updated
        },
        stats,
        todayAttacks,
        todayDefenses,
        historyData: trophyHistory || [],
        dailyHistory,
        previousSeasonHistory,
        lastUpdated: player.last_updated,
        seasonInfo: {
          currentSeasonStart: currentSeasonStartStr,
          previousSeasonEnd: previousSeasonEndStr
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Unexpected error in get-player-data:', error);
    return new Response(
      JSON.stringify({ error: 'Unexpected error occurred', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
