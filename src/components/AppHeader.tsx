import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useStore, shortAddr } from "@/lib/store";
import { usePrivy } from "@/lib/privy";
import { Button } from "@/components/ui/button";
import { Bell, LogOut, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AppHeader() {
  const user = useStore((s) => s.user);
  const logout = useStore((s) => s.logout);
  const privy = usePrivy();
  const allNotifications = useStore((s) => s.notifications);
  const notifications = user ? allNotifications.filter((n) => n.userId === user.id && !n.read) : [];
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl shadow-elegant" style={{ background: "var(--gradient-primary)" }}>
            <span className="text-base font-bold text-primary-foreground">A</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">ArcLedger</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">USDC · Arc L1</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {user?.role === "merchant" && (
            <>
              <NavLink to="/merchant" current={path}>Dashboard</NavLink>
              <NavLink to="/notifications" current={path}>Activity</NavLink>
            </>
          )}
          {user?.role === "customer" && (
            <>
              <NavLink to="/customer" current={path}>My Ledger</NavLink>
              <NavLink to="/notifications" current={path}>Activity</NavLink>
            </>
          )}
          {!user && (
            <>
              <NavLink to="/" current={path}>Home</NavLink>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link to="/notifications" className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card hover:bg-secondary transition">
                <Bell className="h-4 w-4" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                    {notifications.length}
                  </span>
                )}
              </Link>
              <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 sm:flex">
                <Wallet className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono text-xs">{shortAddr(user.walletAddress)}</span>
                <Badge variant="secondary" className="text-[10px]">{user.role}</Badge>
              </div>
              <Button variant="ghost" size="icon" onClick={() => { logout(); privy.logout(); navigate({ to: "/" }); }}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button asChild size="sm" className="shadow-elegant" style={{ background: "var(--gradient-primary)" }}>
              <Link to="/login">Connect Wallet</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({ to, children, current }: { to: string; children: React.ReactNode; current: string }) {
  const active = current === to || (to !== "/" && current.startsWith(to));
  return (
    <Link
      to={to}
      className={`rounded-lg px-3 py-1.5 text-sm transition ${active ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"}`}
    >
      {children}
    </Link>
  );
}
