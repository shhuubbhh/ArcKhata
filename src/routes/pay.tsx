import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useStore, customerBalance, shortAddr } from "@/lib/store";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2, Wallet, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/pay")({
  head: () => ({ meta: [{ title: "Pay USDC — ArcLedger" }] }),
  component: PayPage,
});

function PayPage() {
  const user = useStore((s) => s.user);
  const navigate = useNavigate();
  const customer = useStore((s) => user ? s.customers.find((c) => c.id === user.id) : null);
  const txs = useStore((s) => user ? s.transactions.filter((t) => t.customerId === user.id) : []);
  const addTransaction = useStore((s) => s.addTransaction);

  useEffect(() => {
    if (!user || user.role !== "customer") navigate({ to: "/login" });
  }, [user, navigate]);

  const balance = useMemo(() => customer ? customerBalance(customer.id, txs) : null, [customer, txs]);
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<"idle" | "signing" | "broadcasting" | "done">("idle");
  const [hash, setHash] = useState<string | null>(null);

  useEffect(() => {
    if (balance && !amount) setAmount(balance.outstanding.toFixed(2));
  }, [balance, amount]);

  if (!user || !customer || !balance) return null;

  const pay = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    if (amt > balance.outstanding) return toast.error("Amount exceeds outstanding");
    setStatus("signing");
    await new Promise((r) => setTimeout(r, 900));
    setStatus("broadcasting");
    await new Promise((r) => setTimeout(r, 1200));
    const tx = addTransaction({ customerId: customer.id, amount: amt, type: "repayment", notes: "Customer-initiated USDC payment" });
    setHash(tx.txHash || null);
    setStatus("done");
    toast.success("Payment confirmed on Arc L1");
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6">
      <Link to="/customer" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back</Link>
      <Card className="mt-4 overflow-hidden">
        <div className="p-6 text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
          <div className="text-xs uppercase tracking-wider opacity-80">Pay your merchant</div>
          <div className="mt-2 font-mono text-3xl font-bold">{balance.outstanding.toFixed(2)} <span className="text-sm opacity-80">USDC due</span></div>
        </div>
        <div className="space-y-4 p-6">
          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount to pay (USDC)</Label>
            <Input id="amount" type="number" min="0" max={balance.outstanding} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="font-mono text-lg" disabled={status !== "idle" && status !== "done"} />
          </div>
          <div className="rounded-xl border border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
            <div className="flex justify-between"><span>From wallet</span><span className="font-mono">{shortAddr(customer.walletAddress)}</span></div>
            <div className="mt-1 flex justify-between"><span>Network</span><span>Circle Arc L1</span></div>
            <div className="mt-1 flex justify-between"><span>Estimated fee</span><span>~$0.001</span></div>
          </div>

          {status === "idle" && (
            <Button onClick={pay} className="w-full shadow-elegant" size="lg" style={{ background: "var(--gradient-primary)" }}>
              <Wallet className="mr-2 h-4 w-4" /> Sign & pay USDC
            </Button>
          )}
          {(status === "signing" || status === "broadcasting") && (
            <Button disabled className="w-full" size="lg">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {status === "signing" ? "Awaiting wallet signature…" : "Broadcasting on Arc L1…"}
            </Button>
          )}
          {status === "done" && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 p-4 text-success">
                <CheckCircle2 className="h-5 w-5" />
                <div>
                  <div className="text-sm font-semibold">Payment confirmed</div>
                  {hash && <div className="font-mono text-[10px] opacity-80">{shortAddr(hash)}</div>}
                </div>
              </div>
              <Button asChild className="w-full" variant="outline"><Link to="/customer">Back to my ledger</Link></Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
