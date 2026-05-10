import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useStore, customerBalance, shortAddr } from "@/lib/store";
import { useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/customer")({
  head: () => ({ meta: [{ title: "My Ledger — ArcLedger" }] }),
  component: CustomerPage,
});

function CustomerPage() {
  const user = useStore((s) => s.user);
  const navigate = useNavigate();
  const allCustomers = useStore((s) => s.customers);
  const customer = user ? allCustomers.find((c) => c.id === user.id) : null;
  const allTxs = useStore((s) => s.transactions);
  const txs = user ? allTxs.filter((t) => t.customerId === user.id) : [];

  useEffect(() => {
    if (!user) navigate({ to: "/login" });
    else if (user.role !== "customer") navigate({ to: "/merchant" });
  }, [user, navigate]);

  const balance = useMemo(() => customer ? customerBalance(customer.id, txs) : null, [customer, txs]);

  if (!user || !customer || !balance) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Card className="overflow-hidden p-0 shadow-elegant">
        <div className="p-6 text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
          <div className="text-xs uppercase tracking-wider opacity-80">Outstanding balance</div>
          <div className="mt-2 font-mono text-4xl font-bold">
            {balance.outstanding.toFixed(2)} <span className="text-base font-medium opacity-80">USDC</span>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" variant="secondary" className="shadow-elegant" disabled={balance.outstanding === 0}>
              <Link to="/pay">Pay Now <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
            <div className="inline-flex items-center gap-2 rounded-full bg-background/15 px-3 py-1.5 text-xs backdrop-blur">
              <Wallet className="h-3.5 w-3.5" />
              <span className="font-mono">{shortAddr(customer.walletAddress)}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-border">
          <div className="p-5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total borrowed</div>
            <div className="mt-1 font-mono text-xl font-semibold">{balance.borrowed.toFixed(2)} <span className="text-[10px] text-muted-foreground">USDC</span></div>
          </div>
          <div className="p-5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total repaid</div>
            <div className="mt-1 font-mono text-xl font-semibold text-success">{balance.repaid.toFixed(2)} <span className="text-[10px] text-muted-foreground">USDC</span></div>
          </div>
        </div>
      </Card>

      <h2 className="mt-8 text-sm font-semibold">Transaction history</h2>
      <Card className="mt-3 overflow-hidden">
        {txs.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">No transactions yet.</div>
        ) : (
          <div className="divide-y divide-border">
            {txs.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${t.type === "borrow" ? "bg-warning/15 text-warning" : "bg-success/15 text-success"}`}>
                    {t.type === "borrow" ? "−" : "+"}
                  </div>
                  <div>
                    <div className="text-sm font-medium capitalize">{t.type}</div>
                    <div className="text-[11px] text-muted-foreground">{new Date(t.timestamp).toLocaleString()}</div>
                    {t.notes && <div className="text-xs text-muted-foreground">{t.notes}</div>}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-mono text-sm font-semibold ${t.type === "borrow" ? "text-warning" : "text-success"}`}>
                    {t.type === "borrow" ? "−" : "+"}{t.amount.toFixed(2)} <span className="text-[10px] text-muted-foreground">USDC</span>
                  </div>
                  <Badge variant="secondary" className="mt-1 text-[10px]">{t.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
