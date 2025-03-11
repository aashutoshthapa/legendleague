
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TrophyIcon, Shield, ArrowUp, ArrowDown, Search, RefreshCcw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardPlayer {
  rank: number;
  id: string;
  playerTag: string;
  name: string;
  clan: string;
  trophies: number;
  offenseWins: number;
  defenseCount: number;
  netChange: number;
}

const Leaderboard = () => {
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [apiErrorCount, setApiErrorCount] = useState(0);
  const navigate = useNavigate();

  const fetchLeaderboard = async (skipUpdate = false) => {
    try {
      setLoading(true);
      
      if (!skipUpdate) {
        // Call the update-all-players function to refresh player data first
        console.log('Calling update-all-players to refresh data...');
        const updateResponse = await supabase.functions.invoke('update-all-players');
        
        if (updateResponse.error) {
          console.error('Error updating players:', updateResponse.error);
          toast.error('Failed to refresh player data');
        } else {
          console.log('Update response:', updateResponse.data);
          
          // Check if there were API errors
          const results = updateResponse.data?.results || [];
          const apiErrors = results.filter(r => r.status === 'error' && r.error?.includes('403')).length;
          
          if (apiErrors > 0) {
            setApiErrorCount(apiErrors);
            console.warn(`${apiErrors} API errors detected (403 Forbidden). API key may be invalid or expired.`);
            toast.error('API authentication errors detected', {
              description: 'Some player data could not be updated due to API restrictions'
            });
          } else {
            console.log('Players updated successfully');
            setApiErrorCount(0);
          }
        }
      }
      
      // Then get the latest leaderboard data
      console.log('Fetching latest leaderboard data...');
      const { data, error } = await supabase.functions.invoke('get-leaderboard');
      
      if (error) {
        console.error('Error fetching leaderboard:', error);
        toast.error('Failed to load leaderboard data');
        return;
      }
      
      if (data.leaderboard) {
        console.log('Leaderboard data received:', data.leaderboard.length, 'players');
        setPlayers(data.leaderboard);
        setLastUpdated(data.lastUpdated);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const refreshLeaderboard = async () => {
    try {
      setRefreshing(true);
      await fetchLeaderboard(false); // Force update player data
      toast.success('Leaderboard refreshed');
    } catch (error) {
      console.error('Error refreshing leaderboard:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    // Initial fetch
    fetchLeaderboard();
    
    // Set up polling to refresh data every 1 minute
    const intervalId = setInterval(() => {
      console.log('Auto-refreshing leaderboard data...');
      fetchLeaderboard(false); // Always update player data on auto-refresh
    }, 60 * 1000); // 60 seconds = 1 minute
    
    return () => clearInterval(intervalId);
  }, []);
  
  const filteredPlayers = searchTerm.trim() === '' 
    ? players 
    : players.filter(player => 
        player.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        player.clan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.playerTag.toLowerCase().includes(searchTerm.toLowerCase())
      );
  
  const goToPlayerProfile = (playerTag: string) => {
    navigate(`/player/${playerTag}`);
  };

  return (
    <MainLayout>
      <div className="container py-12 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Legend League Leaderboard</h1>
          <p className="text-muted-foreground">
            Top players currently being tracked in the Legend League
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search players or clans..."
                className="pl-9 pr-4 w-full sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={refreshLeaderboard}
              disabled={refreshing}
              title="Refresh leaderboard"
            >
              <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            {apiErrorCount > 0 && (
              <div className="flex items-center text-xs text-amber-500 dark:text-amber-400 mb-1">
                <AlertTriangle className="h-3 w-3 mr-1" />
                <span>API authentication issues detected</span>
              </div>
            )}
            {lastUpdated && (
              <div className="text-xs text-muted-foreground">
                Last updated: {new Date(lastUpdated).toLocaleString()}
              </div>
            )}
          </div>
        </div>
        
        <Card className="glass-morphism overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center items-center h-80">
                <div className="text-center space-y-4">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-muted-foreground">Loading leaderboard data...</p>
                </div>
              </div>
            ) : filteredPlayers.length === 0 ? (
              <div className="flex justify-center items-center h-80">
                <div className="text-center space-y-4">
                  <p className="text-xl font-medium">No players found</p>
                  <p className="text-muted-foreground">
                    {searchTerm.trim() !== '' 
                      ? 'Try a different search term' 
                      : 'No players are currently being tracked'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Player</TableHead>
                      <TableHead className="text-center">Trophies</TableHead>
                      <TableHead className="text-center">Attacks</TableHead>
                      <TableHead className="text-center">Defenses</TableHead>
                      <TableHead className="text-center">Today's Net</TableHead>
                      <TableHead className="w-24 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPlayers.map((player) => (
                      <TableRow key={player.id} className="cursor-pointer hover:bg-secondary/50">
                        <TableCell 
                          className="font-medium text-center"
                          onClick={() => goToPlayerProfile(player.playerTag)}
                        >
                          {player.rank <= 3 ? (
                            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                              <span className="text-primary font-bold">{player.rank}</span>
                            </div>
                          ) : (
                            player.rank
                          )}
                        </TableCell>
                        <TableCell onClick={() => goToPlayerProfile(player.playerTag)}>
                          <div>
                            <div className="font-medium">{player.name}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <span>#{player.playerTag}</span>
                              {player.clan && (
                                <>
                                  <span>•</span>
                                  <span>{player.clan}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell 
                          className="text-center font-medium"
                          onClick={() => goToPlayerProfile(player.playerTag)}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <TrophyIcon className="h-4 w-4 text-amber-500" />
                            {player.trophies}
                          </div>
                        </TableCell>
                        <TableCell 
                          className="text-center"
                          onClick={() => goToPlayerProfile(player.playerTag)}
                        >
                          <Badge variant="outline">
                            {player.offenseWins}/8
                          </Badge>
                        </TableCell>
                        <TableCell 
                          className="text-center"
                          onClick={() => goToPlayerProfile(player.playerTag)}
                        >
                          <Badge variant="outline">
                            {player.defenseCount}/8
                          </Badge>
                        </TableCell>
                        <TableCell 
                          className="text-center"
                          onClick={() => goToPlayerProfile(player.playerTag)}
                        >
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                            ${player.netChange > 0 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                              : player.netChange < 0 
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                : 'bg-secondary text-muted-foreground'}`
                          }>
                            {player.netChange > 0 ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : player.netChange < 0 ? (
                              <ArrowDown className="h-3 w-3" />
                            ) : null}
                            {player.netChange > 0 ? `+${player.netChange}` : player.netChange}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => goToPlayerProfile(player.playerTag)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Leaderboard;
