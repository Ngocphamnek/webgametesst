import { useGetLeaderboard, useGetGameStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Star, TrendingUp, Activity, Coins } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Leaderboard() {
  const { data: leaderboard, isLoading: loadingBoard } = useGetLeaderboard();
  const { data: stats, isLoading: loadingStats } = useGetGameStats();

  return (
    <div className="w-full py-6 space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
          <Trophy className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-serif font-bold tracking-tight">VIP Leaderboard</h1>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-card-border">
          <CardContent className="p-4 flex flex-col justify-center items-center text-center">
            <Activity className="w-5 h-5 text-muted-foreground mb-2" />
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Total Bets</div>
            {loadingStats ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold font-mono">{stats?.totalBets?.toLocaleString() || 0}</div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card border-card-border">
          <CardContent className="p-4 flex flex-col justify-center items-center text-center">
            <Coins className="w-5 h-5 text-primary mb-2" />
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Total Won</div>
            {loadingStats ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-2xl font-bold font-mono text-primary">{stats?.totalWon?.toLocaleString() || 0}</div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card border-card-border">
          <CardContent className="p-4 flex flex-col justify-center items-center text-center">
            <TrendingUp className="w-5 h-5 text-green-500 mb-2" />
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Win Rate</div>
            {loadingStats ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold font-mono text-green-500">{(stats?.winRate || 0).toFixed(1)}%</div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card border-card-border">
          <CardContent className="p-4 flex flex-col justify-center items-center text-center">
            <Star className="w-5 h-5 text-yellow-500 mb-2" />
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Biggest Win</div>
            {loadingStats ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-2xl font-bold font-mono text-yellow-500">{stats?.biggestWin?.toLocaleString() || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-card-border bg-card shadow-lg">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Medal className="w-4 h-4" /> Top 10 High Rollers
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingBoard ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex gap-4 items-center">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
          ) : !leaderboard || leaderboard.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No rankings yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {leaderboard.map((entry, idx) => (
                <div key={entry.username} className="flex items-center p-4 hover:bg-muted/30 transition-colors">
                  <div className="w-12 h-12 flex items-center justify-center font-serif font-bold text-xl">
                    {idx === 0 ? <span className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]">1</span> :
                     idx === 1 ? <span className="text-gray-300">2</span> :
                     idx === 2 ? <span className="text-amber-700">3</span> :
                     <span className="text-muted-foreground text-base">{idx + 1}</span>}
                  </div>
                  
                  <div className="flex-1 px-4">
                    <div className="font-bold text-lg">{entry.displayName ?? entry.username}</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {entry.totalBets} bets placed
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-mono font-bold text-primary">
                      {entry.totalWon.toLocaleString()}
                    </div>
                    <div className="text-xs text-green-500 font-mono">
                      WR: {entry.winRate.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
