import { useGetBetHistory } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History as HistoryIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function History() {
  const { data: history, isLoading } = useGetBetHistory();

  return (
    <div className="w-full py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
          <HistoryIcon className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-serif font-bold tracking-tight">Bet History</h1>
      </div>

      <Card className="border-card-border bg-card shadow-lg">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          ) : !history || history.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <HistoryIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No bets placed yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[180px] font-mono text-xs uppercase">Time</TableHead>
                    <TableHead className="font-mono text-xs uppercase">Choice</TableHead>
                    <TableHead className="font-mono text-xs uppercase">Result</TableHead>
                    <TableHead className="text-right font-mono text-xs uppercase">Amount</TableHead>
                    <TableHead className="text-right font-mono text-xs uppercase">Payout</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((record) => (
                    <TableRow key={record.id} className="border-border/50 hover:bg-muted/30">
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {format(new Date(record.createdAt), "MMM dd, HH:mm:ss")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={record.choice === 'tai' ? 'border-primary text-primary' : 'border-destructive text-destructive'}>
                          {record.choice.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {record.dice1 && record.dice2 && record.dice3 ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono bg-black/30 px-2 py-0.5 rounded text-xs">
                              {record.dice1}-{record.dice2}-{record.dice3}
                            </span>
                            <span className="font-bold text-sm">
                              ({record.dice1 + record.dice2 + record.dice3})
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {record.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`flex items-center justify-end gap-1 font-mono font-bold ${record.won ? 'text-green-500' : 'text-red-500/70'}`}>
                          {record.won ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                          {record.won ? `+${record.payout.toLocaleString()}` : `-${record.amount.toLocaleString()}`}
                        </span>
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
  );
}
