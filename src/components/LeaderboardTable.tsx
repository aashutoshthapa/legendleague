
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  ChevronUp, 
  ChevronDown,
  ArrowUpDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';

interface Player {
  id: string;
  rank: number;
  name: string;
  clan: string;
  trophies: number;
  offenseAvg: number;
  defenseAvg: number;
  netChange: number;
}

type SortKey = 'rank' | 'trophies' | 'offenseAvg' | 'defenseAvg' | 'netChange';

interface LeaderboardTableProps {
  players: Player[];
  title?: string;
}

const LeaderboardTable = ({ players: initialPlayers, title = "Top Legend League Players" }: LeaderboardTableProps) => {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: SortKey) => {
    const isAsc = sortKey === key && sortDirection === 'asc';
    setSortDirection(isAsc ? 'desc' : 'asc');
    setSortKey(key);
    
    const sortedPlayers = [...players].sort((a, b) => {
      if (isAsc) {
        return b[key] - a[key];
      } else {
        return a[key] - b[key];
      }
    });
    
    setPlayers(sortedPlayers);
  };
  
  const SortableHeader = ({ title, sortId }: { title: string, sortId: SortKey }) => (
    <Button
      variant="ghost"
      onClick={() => handleSort(sortId)}
      className="hover:bg-transparent p-0 h-auto font-medium"
    >
      {title}
      {sortKey === sortId ? (
        sortDirection === 'asc' ? (
          <ChevronUp className="ml-1 h-4 w-4" />
        ) : (
          <ChevronDown className="ml-1 h-4 w-4" />
        )
      ) : (
        <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />
      )}
    </Button>
  );

  return (
    <Card className="glass-morphism w-full animate-fade-in">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"><SortableHeader title="Rank" sortId="rank" /></TableHead>
                <TableHead>Player</TableHead>
                <TableHead className="text-center"><SortableHeader title="Trophies" sortId="trophies" /></TableHead>
                <TableHead className="text-center"><SortableHeader title="Offense" sortId="offenseAvg" /></TableHead>
                <TableHead className="text-center"><SortableHeader title="Defense" sortId="defenseAvg" /></TableHead>
                <TableHead className="text-right"><SortableHeader title="Net" sortId="netChange" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map((player) => (
                <TableRow key={player.id} className="transition-colors hover:bg-muted/30">
                  <TableCell className="w-12 font-medium">{player.rank}</TableCell>
                  <TableCell>
                    <Link 
                      to={`/player/${player.id}`} 
                      className="hover:text-primary transition-colors"
                    >
                      <div className="font-medium">{player.name}</div>
                      <div className="text-xs text-muted-foreground">{player.clan}</div>
                    </Link>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <Trophy className="h-3.5 w-3.5 text-amber-500" />
                      <span>{player.trophies}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-green-600">+{player.offenseAvg}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-red-500">-{player.defenseAvg}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className={cn(
                      "inline-flex items-center space-x-1 rounded px-2 py-0.5",
                      player.netChange >= 0 
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    )}>
                      {player.netChange >= 0 ? (
                        <TrendingUp className="h-3.5 w-3.5" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5" />
                      )}
                      <span>{player.netChange >= 0 ? `+${player.netChange}` : player.netChange}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeaderboardTable;
