
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get today's date in UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Get all tracked players
    const { data: players, error: playersError } = await supabase
      .from('tracked_players')
      .select('*')
      .order('current_trophies', { ascending: false });
      
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
    
    // If no players are found, return an empty leaderboard
    if (!players || players.length === 0) {
      return new Response(
        JSON.stringify({
          leaderboard: [],
          lastUpdated: new Date().toISOString()
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Get daily stats for today
    const { data: todayStats, error: statsError } = await supabase
      .from('daily_stats')
      .select('*')
      .eq('date', todayStr);
      
    if (statsError) {
      console.error('Error fetching daily stats:', statsError);
    }

    // Combine player data with their stats
    const leaderboardData = players.map((player, index) => {
      const playerStats = todayStats?.find(stat => stat.player_id === player.id) || {
        offense_total: 0,
        offense_count: 0,
        defense_total: 0,
        defense_count: 0,
        net_change: 0
      };
      
      return {
        rank: index + 1,
        id: player.id,
        playerTag: player.player_tag,
        name: player.name,
        clan: player.clan_name,
        trophies: player.current_trophies,
        offenseWins: playerStats.offense_count,
        defenseCount: playerStats.defense_count,
        netChange: playerStats.net_change
      };
    });

    return new Response(
      JSON.stringify({
        leaderboard: leaderboardData,
        lastUpdated: new Date().toISOString()
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
