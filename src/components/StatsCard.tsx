
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Shield, Sword, Activity, Clock, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { format, isYesterday } from "date-fns";

interface StatsCardProps {
  playerStats: {
    offenseCount?: number;
    defenseCount?: number;
    offenseTotal?: number;
    defenseTotal?: number;
    netChange?: number;
  } | null;
  trophies: number;
  attackCount?: number;
  defenseCount?: number;
  netChange?: number;
  refreshInterval?: number; // in seconds
  yesterdayStats?: {
    date: string;
    offenseCount: number;
    defenseCount: number;
    offenseTotal: number;
    defenseTotal: number;
    netChange: number;
  } | null;
  lastUpdated?: string;
  seasonStats?: Array<{
    date: string;
    offenseCount: number;
    defenseCount: number;
    offenseTotal: number;
    defenseTotal: number;
    netChange: number;
  }> | null;
}

const StatsCard = ({ 
  playerStats, 
  trophies, 
  attackCount = 0, 
  defenseCount = 0, 
  netChange = 0,
  refreshInterval = 60, // default to 60 seconds (1 minute)
  yesterdayStats = null,
  lastUpdated,
  seasonStats = null
}: StatsCardProps) => {
  // Calculate trophy changes
  const attackTotal = playerStats?.offenseTotal || 0;
  const defenseTotal = playerStats?.defenseTotal || 0;
  const [activeTab, setActiveTab] = useState<string>("today");

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Player Stats</CardTitle>
        <div className="text-xs text-muted-foreground">
          Auto-refreshes every {refreshInterval} seconds
          {lastUpdated && (
            <span className="ml-2 inline-flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              Last updated: {format(new Date(lastUpdated), 'MMM d, h:mm a')}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="season" disabled={!seasonStats || seasonStats.length === 0}>This Season</TabsTrigger>
            <TabsTrigger value="lastseason">Last Season</TabsTrigger>
          </TabsList>
          
          <TabsContent value="today" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Trophies</CardTitle>
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <Trophy className="h-4 w-4 text-amber-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{trophies}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Attacks</CardTitle>
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <Sword className="h-4 w-4 text-green-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{attackCount}/8</div>
                  {attackTotal > 0 && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">+{attackTotal} trophies</p>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Defenses</CardTitle>
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <Shield className="h-4 w-4 text-blue-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{defenseCount}/8</div>
                  {defenseTotal > 0 && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">-{defenseTotal} trophies</p>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Net Change</CardTitle>
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <Activity className={`h-4 w-4 ${netChange >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${netChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                    {netChange > 0 ? '+' : ''}{netChange}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {yesterdayStats && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-3">Yesterday's Stats</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Date</CardTitle>
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-medium">{format(new Date(yesterdayStats.date), 'MMM d, yyyy')}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Attacks</CardTitle>
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <Sword className="h-4 w-4 text-green-500" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{yesterdayStats.offenseCount}/8</div>
                      {yesterdayStats.offenseTotal > 0 && (
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">+{yesterdayStats.offenseTotal} trophies</p>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Defenses</CardTitle>
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <Shield className="h-4 w-4 text-blue-500" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{yesterdayStats.defenseCount}/8</div>
                      {yesterdayStats.defenseTotal > 0 && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">-{yesterdayStats.defenseTotal} trophies</p>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Net Change</CardTitle>
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <Activity className={`h-4 w-4 ${yesterdayStats.netChange >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${yesterdayStats.netChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                        {yesterdayStats.netChange > 0 ? '+' : ''}{yesterdayStats.netChange}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="season" className="space-y-4">
            {seasonStats && seasonStats.length > 0 ? (
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Season Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="py-2 px-2 text-left">Date</th>
                            <th className="py-2 px-2 text-center">Attacks</th>
                            <th className="py-2 px-2 text-center">Attack Trophies</th>
                            <th className="py-2 px-2 text-center">Defenses</th>
                            <th className="py-2 px-2 text-center">Defense Trophies</th>
                            <th className="py-2 px-2 text-right">Net Change</th>
                          </tr>
                        </thead>
                        <tbody>
                          {seasonStats.map((day) => (
                            <tr key={day.date} className="border-b">
                              <td className="py-2 px-2 text-left">{format(new Date(day.date), 'MMM d')}</td>
                              <td className="py-2 px-2 text-center">{day.offenseCount}/8</td>
                              <td className="py-2 px-2 text-center text-green-600 dark:text-green-400">
                                +{day.offenseTotal}
                              </td>
                              <td className="py-2 px-2 text-center">{day.defenseCount}/8</td>
                              <td className="py-2 px-2 text-center text-red-600 dark:text-red-400">
                                -{day.defenseTotal}
                              </td>
                              <td className={`py-2 px-2 text-right font-medium ${day.netChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {day.netChange > 0 ? '+' : ''}{day.netChange}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs font-medium">Total Attacks</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-xl font-bold flex items-center">
                            <Sword className="h-4 w-4 text-green-500 mr-2" />
                            {seasonStats.reduce((sum, day) => sum + day.offenseCount, 0)}
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs font-medium">Total Defenses</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-xl font-bold flex items-center">
                            <Shield className="h-4 w-4 text-blue-500 mr-2" />
                            {seasonStats.reduce((sum, day) => sum + day.defenseCount, 0)}
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs font-medium">Season Net Change</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {(() => {
                            const totalNetChange = seasonStats.reduce((sum, day) => sum + day.netChange, 0);
                            return (
                              <div className={`text-xl font-bold flex items-center ${
                                totalNetChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                              }`}>
                                <Activity className="h-4 w-4 mr-2" />
                                {totalNetChange > 0 ? '+' : ''}{totalNetChange}
                              </div>
                            );
                          })()}
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No season data available yet
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="lastseason" className="space-y-4">
            <div className="text-center py-8 text-muted-foreground">
              Data from previous seasons will be available here once a new season begins
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
