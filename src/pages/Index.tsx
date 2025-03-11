
import MainLayout from '@/layouts/MainLayout';
import PlayerSearch from '@/components/PlayerSearch';
import SeasonTimer from '@/components/SeasonTimer';
import { getCurrentSeasonInfo, getNextDailyReset, getNextSeasonReset } from '@/utils/dateUtils';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Users, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [trackedPlayersCount, setTrackedPlayersCount] = useState<number>(0);
  const seasonInfo = getCurrentSeasonInfo();

  useEffect(() => {
    // Fetch the count of tracked players
    const fetchPlayerCount = async () => {
      try {
        const { count, error } = await supabase
          .from('tracked_players')
          .select('*', { count: 'exact', head: true });
          
        if (!error && count !== null) {
          setTrackedPlayersCount(count);
        }
      } catch (error) {
        console.error('Error fetching player count:', error);
      }
    };

    fetchPlayerCount();
  }, []);

  return (
    <MainLayout>
      <div className="hero-gradient py-16 md:py-24">
        <div className="container px-4 mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-12 animate-slide-down">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Legend League Tracker</h1>
            <p className="text-xl text-muted-foreground">
              Track your Clash of Clans Legend League progress with precision
            </p>
          </div>
          
          <div className="mb-12">
            <PlayerSearch />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="glass-morphism animate-fade-in">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Current Season</h3>
                  <p className="text-muted-foreground">{seasonInfo.name}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass-morphism animate-fade-in [animation-delay:100ms]">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Season Day</h3>
                  <p className="text-muted-foreground">Day {seasonInfo.day}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass-morphism animate-fade-in [animation-delay:200ms]">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Tracked Players</h3>
                  <p className="text-muted-foreground">{trackedPlayersCount} active players</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <SeasonTimer nextReset={getNextDailyReset()} isDaily={true} />
            <SeasonTimer nextReset={getNextSeasonReset()} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
