
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PlayerCard from '@/components/PlayerCard';
import StatsCard from '@/components/StatsCard';
import { Line } from 'recharts';
import { Trophy, Sword, Shield, Activity, Clock, TrendingUp, TrendingDown, CircleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';

const PlayerProfile = () => {
  const { playerTag } = useParams<{ playerTag: string }>();
  const [loading, setLoading] = useState(true);
  const [playerData, setPlayerData] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [playerStats, setPlayerStats] = useState<any>(null);
  const [todayAttacks, setTodayAttacks] = useState<any[]>([]);
  const [todayDefenses, setTodayDefenses] = useState<any[]>([]);
  const [yesterdayStats, setYesterdayStats] = useState<any>(null);
  const [seasonStats, setSeasonStats] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  
  const fetchPlayerData = async () => {
    if (!playerTag) return;
    
    try {
      setLoading(true);
      
      console.log('Fetching detailed player data for tag:', playerTag);
      
      // Call the get-player-data edge function with fixed invoke options
      const { data, error } = await supabase.functions.invoke('get-player-data', {
        body: { playerTag }
      });
      
      if (error) {
        console.error('Error fetching player data:', error);
        toast.error(`Error: ${error.message || 'Could not fetch player data'}`);
        setLoading(false);
        return;
      }
      
      if (!data || !data.player) {
        console.error('No player data returned from the function');
        toast.error('Could not fetch player data');
        setLoading(false);
        return;
      }
      
      console.log('Got player data:', data);
      
      // Set all the data
      setPlayerData(data.player);
      setHistoryData(data.historyData || []);
      setPlayerStats(data.stats || null);
      setTodayAttacks(data.todayAttacks || []);
      setTodayDefenses(data.todayDefenses || []);
      
      // Get yesterday's stats from dailyHistory if available
      if (data.dailyHistory && data.dailyHistory.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = data.dailyHistory.find((day: any) => day.date !== today);
        setYesterdayStats(yesterday || null);
        
        // Set season stats (all daily stats excluding today)
        const seasonData = data.dailyHistory
          .filter((day: any) => day.date !== today)
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setSeasonStats(seasonData);
      }
    } catch (error: any) {
      console.error('Unexpected error in fetchPlayerData:', error);
      toast.error(`Error: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchPlayerData();
    
    // Set up interval to refresh data every minute
    const refreshInterval = setInterval(fetchPlayerData, 60000);
    
    return () => clearInterval(refreshInterval);
  }, [playerTag]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-pulse text-lg">Loading player data...</div>
      </div>
    );
  }
  
  if (!playerData) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold mb-4">Player Not Found</h2>
        <p>Could not find player with tag: {playerTag}</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Player Info Card */}
        <div className="md:col-span-1">
          <PlayerCard player={playerData} />
        </div>
        
        {/* Today's Stats */}
        <div className="md:col-span-2">
          <StatsCard 
            playerStats={playerStats} 
            trophies={playerData.trophies}
            attackCount={todayAttacks.length}
            defenseCount={todayDefenses.length}
            netChange={playerStats?.netChange || 0}
            yesterdayStats={yesterdayStats}
            seasonStats={seasonStats.length > 0 ? seasonStats : null}
            lastUpdated={playerData.lastUpdated}
          />
        </div>
      </div>
      
      <div className="mt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="attacks">Today's Attacks</TabsTrigger>
            <TabsTrigger value="history">Battle History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Player Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-3">Details</h3>
                    <ul className="space-y-3">
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Player Tag</span>
                        <Badge variant="outline">{playerData.tag}</Badge>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Clan</span>
                        <span>{playerData.clan || 'No Clan'}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Current Trophies</span>
                        <div className="flex items-center">
                          <Trophy className="h-4 w-4 text-yellow-500 mr-1" />
                          <span>{playerData.trophies}</span>
                        </div>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Season Highest</span>
                        <div className="flex items-center">
                          <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                          <span>{playerData.seasonHighest || playerData.trophies}</span>
                        </div>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Last Updated</span>
                        <span>{playerData.lastUpdated ? format(new Date(playerData.lastUpdated), 'MMM d, h:mm a') : 'Unknown'}</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3">Legend Stats</h3>
                    <ul className="space-y-3">
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Attacks Done</span>
                        <div className="flex items-center">
                          <Sword className="h-4 w-4 text-green-500 mr-1" />
                          <span>{todayAttacks.length}/8</span>
                        </div>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Defenses</span>
                        <div className="flex items-center">
                          <Shield className="h-4 w-4 text-red-500 mr-1" />
                          <span>{todayDefenses.length}/8</span>
                        </div>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Average Attack</span>
                        <div className="flex items-center text-green-500">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          <span>+{playerStats?.offenseAvg || 0}</span>
                        </div>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Average Defense</span>
                        <div className="flex items-center text-red-500">
                          <TrendingDown className="h-4 w-4 mr-1" />
                          <span>-{playerStats?.defenseAvg || 0}</span>
                        </div>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Net Trophy Change</span>
                        <div className={`flex items-center ${
                          (playerStats?.netChange || 0) > 0 
                            ? 'text-green-500' 
                            : (playerStats?.netChange || 0) < 0
                              ? 'text-red-500'
                              : ''
                        }`}>
                          <Activity className="h-4 w-4 mr-1" />
                          <span>{playerStats?.netChange > 0 ? '+' : ''}{playerStats?.netChange || 0}</span>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="attacks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Today's Battles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Attacks Table */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center">
                        <Sword className="h-4 w-4 text-green-500 mr-2" />
                        Attacks ({todayAttacks.length}/8)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {todayAttacks.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>#</TableHead>
                              <TableHead>Time</TableHead>
                              <TableHead className="text-right">Trophies</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {todayAttacks.map((attack) => (
                              <TableRow key={attack.id}>
                                <TableCell>{attack.count}</TableCell>
                                <TableCell>{attack.time}</TableCell>
                                <TableCell className="text-right font-medium text-green-600">
                                  +{attack.change}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                          <CircleAlert className="h-12 w-12 text-muted mb-2" />
                          <p>No attacks recorded today</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Defenses Table */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center">
                        <Shield className="h-4 w-4 text-red-500 mr-2" />
                        Defenses ({todayDefenses.length}/8)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {todayDefenses.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>#</TableHead>
                              <TableHead>Time</TableHead>
                              <TableHead className="text-right">Trophies</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {todayDefenses.map((defense) => (
                              <TableRow key={defense.id}>
                                <TableCell>{defense.count}</TableCell>
                                <TableCell>{defense.time}</TableCell>
                                <TableCell className={`text-right font-medium ${defense.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {defense.change >= 0 ? '+' : ''}{defense.change}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                          <CircleAlert className="h-12 w-12 text-muted mb-2" />
                          <p>No defenses recorded today</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                
                  {/* Stats Summary */}
                  <Card className="md:col-span-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Today's Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="flex flex-col p-4 bg-muted/30 rounded-lg">
                          <span className="text-muted-foreground text-sm">Attack Trophies</span>
                          <span className="text-xl font-bold text-green-600">
                            +{playerStats?.offenseTotal || 0}
                          </span>
                        </div>
                        <div className="flex flex-col p-4 bg-muted/30 rounded-lg">
                          <span className="text-muted-foreground text-sm">Defense Trophies</span>
                          <span className="text-xl font-bold text-red-600">
                            -{playerStats?.defenseTotal || 0}
                          </span>
                        </div>
                        <div className="flex flex-col p-4 bg-muted/30 rounded-lg">
                          <span className="text-muted-foreground text-sm">Net Change</span>
                          <span className={`text-xl font-bold ${(playerStats?.netChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {(playerStats?.netChange || 0) > 0 ? '+' : ''}{playerStats?.netChange || 0}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Battles</CardTitle>
              </CardHeader>
              <CardContent>
                {historyData.length > 0 ? (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {historyData.map((battle) => (
                      <div key={battle.id} className="flex items-center p-3 border rounded-lg">
                        <div className={`rounded-full p-2 mr-4 ${
                          battle.is_attack 
                            ? battle.trophy_change > 0 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            : battle.trophy_change < 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {battle.is_attack ? <Sword className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">
                              {battle.is_attack ? 'Attack' : 'Defense'}
                            </span>
                            <span className={`font-medium ${
                              (battle.is_attack && battle.trophy_change > 0) || (!battle.is_attack && battle.trophy_change >= 0)
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}>
                              {battle.trophy_change > 0 ? '+' : ''}{battle.trophy_change}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>
                              {battle.previous_trophies} → {battle.new_trophies}
                            </span>
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{format(new Date(battle.recorded_at), 'MMM d, h:mm a')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No battle history available yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PlayerProfile;
