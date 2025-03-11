
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";

const PlayerSearch = () => {
  const [playerTag, setPlayerTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearchPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!playerTag.trim()) {
      toast.error('Please enter a player tag');
      return;
    }
    
    // Format the tag (remove # if present)
    const formattedTag = playerTag.startsWith('#') ? playerTag.substring(1) : playerTag;
    
    setIsLoading(true);
    
    try {
      console.log('Calling edge function with player tag:', formattedTag);
      
      // Call our edge function to fetch player data
      const { data, error } = await supabase.functions.invoke('fetch-player', {
        body: { playerTag: formattedTag }
      });
      
      if (error) {
        console.error('Error from edge function:', error);
        toast.error('Connection error. Please try again later.');
        setIsLoading(false);
        return;
      }
      
      console.log('Response from edge function:', data);
      
      if (data && data.error) {
        console.error('API error:', data.error);
        
        if (data.error.includes('not in Legend League')) {
          toast.error(`Player must be in Legend League to track (Current: ${data.league || 'Unknown'})`);
        } else if (data.error.includes('not found')) {
          toast.error('Player not found. Please check the tag and try again.');
        } else if (data.error.includes('API access denied')) {
          toast.error('API access issue. Please contact the administrator.');
        } else {
          toast.error(data.error);
        }
        
        setIsLoading(false);
        return;
      }
      
      // Show a success toast based on whether player was newly added or just updated
      if (data.isNewPlayer) {
        toast.success(`Player ${data.player.name} added to tracking!`);
      } else {
        toast.success(`Player ${data.player.name} found and updated!`);
      }
      
      // Navigate to the player profile
      navigate(`/player/${formattedTag}`);
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto glass-morphism animate-fade-in">
      <CardContent className="pt-6">
        <form onSubmit={handleSearchPlayer} className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-xl font-medium text-center">Track Legend League Player</h2>
            <p className="text-sm text-muted-foreground text-center">
              Enter a player tag to start tracking their Legend League progress
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Input
              placeholder="#ABC123"
              value={playerTag}
              onChange={(e) => setPlayerTag(e.target.value)}
              className="flex-1"
            />
            
            <Button type="submit" disabled={isLoading} className="btn-primary">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Track
                </>
              )}
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            Player must be in Legend League to track their statistics
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default PlayerSearch;
