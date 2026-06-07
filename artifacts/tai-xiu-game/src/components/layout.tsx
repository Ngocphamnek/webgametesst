import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useGetMe, useGetBalance } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, History, Trophy, Gamepad2, Coins } from "lucide-react";
import { DepositModal } from "./deposit-modal";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { logout } = useAuth();
  const { data: user } = useGetMe();
  const { data: balanceData } = useGetBalance();
  const [depositOpen, setDepositOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/game" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
                TX
              </div>
              <span className="text-xl font-bold tracking-tight text-primary">TÀI XỈU VIP</span>
            </Link>

            <nav className="hidden md:flex gap-4">
              <Link href="/game" className={`text-sm font-medium transition-colors hover:text-primary ${location === '/game' ? 'text-primary' : 'text-muted-foreground'}`}>
                <span className="flex items-center gap-1.5"><Gamepad2 className="h-4 w-4"/> Play</span>
              </Link>
              <Link href="/history" className={`text-sm font-medium transition-colors hover:text-primary ${location === '/history' ? 'text-primary' : 'text-muted-foreground'}`}>
                <span className="flex items-center gap-1.5"><History className="h-4 w-4"/> History</span>
              </Link>
              <Link href="/leaderboard" className={`text-sm font-medium transition-colors hover:text-primary ${location === '/leaderboard' ? 'text-primary' : 'text-muted-foreground'}`}>
                <span className="flex items-center gap-1.5"><Trophy className="h-4 w-4"/> Top Winners</span>
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <>
                <div className="flex items-center gap-3 bg-secondary/50 px-3 py-1.5 rounded-full border border-secondary-border">
                  <div className="flex items-center gap-1.5 text-primary font-mono font-bold">
                    <Coins className="h-4 w-4 text-primary" />
                    {balanceData?.balance?.toLocaleString() || user.balance?.toLocaleString() || "0"}
                  </div>
                  <div className="h-4 w-px bg-border"></div>
                  <button
                    onClick={() => setDepositOpen(true)}
                    className="text-xs font-bold uppercase tracking-wider bg-primary/20 text-primary hover:bg-primary/30 px-2 py-0.5 rounded transition-colors"
                  >
                    Nạp Tiền
                  </button>
                </div>

                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-bold">{user.username}</span>
                </div>

                <button
                  onClick={handleLogout}
                  className="h-9 w-9 flex items-center justify-center rounded-md border border-border bg-background hover:bg-muted hover:text-foreground transition-colors"
                  aria-label="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur flex justify-around p-2 pb-safe">
        <Link href="/game" className={`flex flex-col items-center p-2 rounded-lg flex-1 ${location === '/game' ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}>
          <Gamepad2 className="h-5 w-5 mb-1" />
          <span className="text-[10px] font-bold uppercase">Play</span>
        </Link>
        <Link href="/history" className={`flex flex-col items-center p-2 rounded-lg flex-1 ${location === '/history' ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}>
          <History className="h-5 w-5 mb-1" />
          <span className="text-[10px] font-bold uppercase">History</span>
        </Link>
        <Link href="/leaderboard" className={`flex flex-col items-center p-2 rounded-lg flex-1 ${location === '/leaderboard' ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}>
          <Trophy className="h-5 w-5 mb-1" />
          <span className="text-[10px] font-bold uppercase">Top</span>
        </Link>
      </div>

      <main className="flex-1 flex flex-col container mx-auto max-w-5xl p-4 md:p-6 mb-16 md:mb-0">
        {children}
      </main>

      <DepositModal open={depositOpen} onOpenChange={setDepositOpen} />
    </div>
  );
}
