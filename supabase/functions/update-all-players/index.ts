
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const clashApiKey = Deno.env.get('CLASH_OF_CLANS_API_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Function to check if it's after the daily reset (5:00 AM UTC)
function isAfterDailyReset(date: Date): boolean {
  return date.getUTCHours() >= 5;
}

// Function to get current UTC date in YYYY-MM-DD format
function getUtcDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    console.log('Starting update of all tracked players');
    
    // Get all players being tracked
    const { data: players, error: playersError } = await supabase
      .from('tracked_players')
      .select('*')
      .eq('is_tracking', true);
      
    if (playersError) {
      console.error('Error fetching players:', playersError);
      return new Response(
        JSON.stringify({ error: 'Error fetching players', details: playersError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    if (!players || players.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No players to update' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    console.log(`Found ${players.length} players to update`);
    
    // Get current date and determine if we're after the daily reset
    const now = new Date();
    const currentUtcDate = getUtcDateString(now);
    const isAfterReset = isAfterDailyReset(now);
    
    console.log(`Current UTC date: ${currentUtcDate}, After reset: ${isAfterReset}`);
    
    // Process players in batches to avoid hitting Clash API rate limits
    const batchSize = 5;
    const results = [];
    
    for (let i = 0; i < players.length; i += batchSize) {
      const batch = players.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (player) => {
        try {
          // Fetch player data from Clash of Clans API
          const encodedTag = encodeURIComponent(`#${player.player_tag}`);
          const apiUrl = `https://cocproxy.royaleapi.dev/v1/players/${encodedTag}`;
          
          console.log(`Making request to: ${apiUrl} for player ${player.player_tag}`);
          
          const response = await fetch(apiUrl, {
            headers: {
              'Authorization': `Bearer ${clashApiKey}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            console.error(`API error for player ${player.player_tag}:`, response.status);
            return {
              player_tag: player.player_tag,
              status: 'error',
              error: `API returned ${response.status}`
            };
          }
          
          const playerData = await response.json();
          
          // Check if player is still in Legend League
          const isInLegendLeague = playerData.league && 
                                 playerData.league.name && 
                                 playerData.league.name.includes('Legend');
          
          if (!isInLegendLeague) {
            console.log(`Player ${player.player_tag} is no longer in Legend League`);
            return {
              player_tag: player.player_tag,
              status: 'skipped',
              reason: 'Not in Legend League'
            };
          }
          
          // Check if there's been a trophy change
          const previousTrophies = player.current_trophies;
          const currentTrophies = playerData.trophies || 0;
          const trophyDifference = currentTrophies - previousTrophies;
          
          // Check if we need to initialize or update daily stats
          let dailyStatsRecord = null;
          
          // Get the relevant date for daily stats
          const statsDate = currentUtcDate;
          
          const { data: dailyStats, error: statsQueryError } = await supabase
            .from('daily_stats')
            .select('*')
            .eq('player_id', player.id)
            .eq('date', statsDate)
            .maybeSingle();
            
          if (statsQueryError && statsQueryError.code !== 'PGRST116') {
            console.error(`Error fetching daily stats for ${player.player_tag}:`, statsQueryError);
          }
          
          // Only process if there's an actual trophy change
          if (trophyDifference !== 0) {
            // Determine if it's an attack or defense
            const isAttack = trophyDifference > 0;
            
            // Record trophy change in history
            const { error: historyError } = await supabase
              .from('trophy_history')
              .insert({
                player_id: player.id,
                trophy_change: trophyDifference,
                is_attack: isAttack,
                previous_trophies: previousTrophies,
                new_trophies: currentTrophies
              });
              
            if (historyError) {
              console.error(`Error recording trophy history for ${player.player_tag}:`, historyError);
            }
            
            // Update or create daily stats
            if (dailyStats) {
              // Update existing stats
              const { error: updateError } = await supabase
                .from('daily_stats')
                .update({
                  offense_total: isAttack ? dailyStats.offense_total + trophyDifference : dailyStats.offense_total,
                  offense_count: isAttack ? dailyStats.offense_count + 1 : dailyStats.offense_count,
                  defense_total: !isAttack ? dailyStats.defense_total + Math.abs(trophyDifference) : dailyStats.defense_total,
                  defense_count: !isAttack ? dailyStats.defense_count + 1 : dailyStats.defense_count,
                  net_change: dailyStats.net_change + trophyDifference
                })
                .eq('id', dailyStats.id);
                
              if (updateError) {
                console.error(`Error updating daily stats for ${player.player_tag}:`, updateError);
              }
            } else {
              // Create new daily stats record
              const { error: insertError } = await supabase
                .from('daily_stats')
                .insert({
                  player_id: player.id,
                  date: statsDate,
                  offense_total: isAttack ? trophyDifference : 0,
                  offense_count: isAttack ? 1 : 0,
                  defense_total: !isAttack ? Math.abs(trophyDifference) : 0,
                  defense_count: !isAttack ? 1 : 0,
                  net_change: trophyDifference
                });
                
              if (insertError) {
                console.error(`Error creating daily stats for ${player.player_tag}:`, insertError);
              }
            }
          } else if (!dailyStats) {
            // Initialize today's stats record with zeros even if there's no trophy change
            const { error: insertError } = await supabase
              .from('daily_stats')
              .insert({
                player_id: player.id,
                date: statsDate,
                offense_total: 0,
                offense_count: 0,
                defense_total: 0,
                defense_count: 0,
                net_change: 0
              });
              
            if (insertError) {
              console.error(`Error initializing daily stats for ${player.player_tag}:`, insertError);
            }
          }
          
          // Update player information regardless of trophy change
          const { error: updateError } = await supabase
            .from('tracked_players')
            .update({
              name: playerData.name,
              clan_name: playerData.clan?.name || null,
              current_trophies: currentTrophies,
              last_updated: new Date().toISOString()
            })
            .eq('id', player.id);
            
          if (updateError) {
            console.error(`Error updating player ${player.player_tag}:`, updateError);
            return {
              player_tag: player.player_tag,
              status: 'error',
              error: updateError.message
            };
          }
          
          return {
            player_tag: player.player_tag,
            status: 'updated',
            trophy_change: trophyDifference
          };
        } catch (error) {
          console.error(`Error processing player ${player.player_tag}:`, error);
          return {
            player_tag: player.player_tag,
            status: 'error',
            error: error.message
          };
        }
      });
      
      // Wait for batch to complete before moving to next batch
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Add a small delay between batches to avoid API rate limits
      if (i + batchSize < players.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Cleanup old data (keep only last 2 months)
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    const cutoffDate = twoMonthsAgo.toISOString().split('T')[0];
    
    const { error: deleteStatsError } = await supabase
      .from('daily_stats')
      .delete()
      .lt('date', cutoffDate);
      
    if (deleteStatsError) {
      console.error('Error deleting old daily stats:', deleteStatsError);
    }
    
    const { error: deleteHistoryError } = await supabase
      .from('trophy_history')
      .delete()
      .lt('recorded_at', twoMonthsAgo.toISOString());
      
    if (deleteHistoryError) {
      console.error('Error deleting old trophy history:', deleteHistoryError);
    }
    
    return new Response(
      JSON.stringify({
        message: `Updated ${results.length} players`,
        results: results,
        cleanup: { cutoffDate: cutoffDate }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Unexpected error occurred', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
