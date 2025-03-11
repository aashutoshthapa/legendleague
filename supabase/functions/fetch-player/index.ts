
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

const legendLeagueId = 29000022; // Legend League ID in Clash of Clans API

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Parse request body
    let reqBody;
    try {
      reqBody = await req.json();
    } catch (e) {
      console.error('Failed to parse request body:', e);
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const { playerTag } = reqBody;
    
    console.log('Request received with player tag:', playerTag);
    
    if (!playerTag) {
      return new Response(
        JSON.stringify({ error: 'Player tag is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Format player tag for API request (ensure it starts with # for the API)
    const formattedTag = playerTag.startsWith('#') ? playerTag : `#${playerTag}`;
    const encodedTag = encodeURIComponent(formattedTag);
    
    // Make request to Clash of Clans API through RoyaleAPI proxy
    console.log(`Fetching player data for tag: ${formattedTag}`);
    console.log(`API key length: ${clashApiKey.length}`);
    
    const apiUrl = `https://cocproxy.royaleapi.dev/v1/players/${encodedTag}`;
    console.log(`Making request to: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${clashApiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Log response status for debugging
    console.log(`API response status: ${response.status}`);
    
    // Handle API response errors
    if (!response.ok) {
      const status = response.status;
      let responseText = '';
      
      try {
        responseText = await response.text();
        console.error(`API error (${status}): ${responseText}`);
      } catch (e) {
        console.error(`Failed to read response text: ${e}`);
      }
      
      if (status === 404) {
        return new Response(
          JSON.stringify({ error: 'Player not found' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      if (status === 403) {
        return new Response(
          JSON.stringify({ error: 'API access denied. Check your API key and IP restrictions.' }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      return new Response(
        JSON.stringify({ error: `API error (${status}): ${responseText}` }),
        { 
          status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Parse player data
    let playerData;
    try {
      playerData = await response.json();
      console.log(`Successfully fetched player data for: ${playerData.name}`);
    } catch (e) {
      console.error('Failed to parse player data:', e);
      return new Response(
        JSON.stringify({ error: 'Failed to parse player data from API' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Check if player is in Legend League
    const isInLegendLeague = playerData.league && playerData.league.id === legendLeagueId;
    
    if (!isInLegendLeague) {
      return new Response(
        JSON.stringify({ 
          error: 'Player is not in Legend League', 
          league: playerData.league ? playerData.league.name : 'Unknown' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Clean the tag for database storage (remove # if present)
    const cleanTag = formattedTag.startsWith('#') ? formattedTag.substring(1) : formattedTag;
    
    // Check if player is already being tracked
    const { data: existingPlayer, error: queryError } = await supabase
      .from('tracked_players')
      .select('*')
      .eq('player_tag', cleanTag)
      .maybeSingle();
      
    let isNewPlayer = false;
    let playerId = null;
    
    if (queryError) {
      console.error('Error querying database:', queryError);
      return new Response(
        JSON.stringify({ error: 'Database error', details: queryError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // If player not found, add to database
    if (!existingPlayer) {
      isNewPlayer = true;
      
      const { data: insertedPlayer, error: insertError } = await supabase
        .from('tracked_players')
        .insert({
          player_tag: cleanTag,
          name: playerData.name,
          clan_name: playerData.clan?.name || 'No Clan',
          current_trophies: playerData.trophies || 0,
          is_tracking: true,
          last_updated: new Date().toISOString()
        })
        .select()
        .single();
        
      if (insertError) {
        console.error('Error inserting player:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to add player to database', details: insertError.message }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      playerId = insertedPlayer.id;
    } else {
      // Update existing player
      playerId = existingPlayer.id;
      
      const { error: updateError } = await supabase
        .from('tracked_players')
        .update({
          name: playerData.name,
          clan_name: playerData.clan?.name || 'No Clan',
          current_trophies: playerData.trophies || 0,
          is_tracking: true,
          last_updated: new Date().toISOString()
        })
        .eq('id', playerId);
        
      if (updateError) {
        console.error('Error updating player:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update player', details: updateError.message }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }
    
    // Return player data
    return new Response(
      JSON.stringify({
        isNewPlayer,
        player: {
          id: playerId,
          player_tag: cleanTag,
          name: playerData.name,
          clan_name: playerData.clan?.name || 'No Clan',
          current_trophies: playerData.trophies || 0,
          last_updated: new Date().toISOString()
        }
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
