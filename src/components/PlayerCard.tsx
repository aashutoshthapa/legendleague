
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Shield, TrendingUp, TrendingDown } from "lucide-react";

interface PlayerCardProps {
  player: {
    name?: string;
    clan?: string;
    trophies?: number;
    tag?: string;
  };
}

const PlayerCard = ({ player }: PlayerCardProps) => {
  // Extract values with fallbacks
  const playerName = player?.name || "Unknown Player";
  const clan = player?.clan || "No Clan";
  const trophies = player?.trophies || 0;
  const tag = player?.tag || "";
  
  return (
    <Card className="glass-morphism overflow-hidden card-hover animate-scale-in">
      <div className="absolute top-0 h-1.5 w-full bg-gradient-to-r from-primary/80 to-primary"></div>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold">{playerName}</h2>
            <p className="text-sm text-muted-foreground">{clan}</p>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Trophy className="h-3 w-3" />
            {trophies}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-muted/30 p-3 rounded-lg mt-3">
          <p className="text-sm text-muted-foreground mb-1">Player Tag</p>
          <p className="font-mono text-sm font-medium">{tag}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerCard;
