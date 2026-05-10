import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useStore, customerBalance, shortAddr } from "@/lib/store";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Bell, Download, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/merchant/customer/$id")({
  head: () => ({ meta: [{ title: "Customer Ledger — ArcLedger" }] }),
  component: CustomerLedger,
});

function CustomerLedger() {
  const { id } = Route.useParams();
  const user = useStore((s) => s.user);
  const navigate = useNavigate();
  const customer = useStore((s) => s.customers.find((c) => c.id === id));
  const allTxs = useStore((s) => s.transactions);
  const txs = allTxs.filter((t) => t.customerId === id);
  const addTransaction = useStore((s) => s.addTransaction);
  const pushNotification = useStore((s) => s.pushNotification);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [type, setType] = useState<"borrow" | "repayment">("borrow");

  useEffect(() => {
    if (!user || user.role !== "merchant") navigate({ to: "/login" });
  }, [user, navigate]);

  const balance = useMemo(() => customer ? customerBalance(customer.id, txs) : null, [customer, txs]);

  if (!customer) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">Customer not found.</p>
        <Button asChild variant="outline" className="mt-4"><Link to="/merchant">Back to dashboard</Link></Button>
      </div>
    );
  }

  const submit = () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    addTransaction({ customerId: customer.id, amount: amt, type, notes });
    toast.success(type === "borrow" ? "Borrow added" : "Repayment recorded");
    setAmount(""); setNotes("");
  };

  const remind = () => {
    if (!balance || balance.outstanding <= 0) return toast.info("Nothing due");
    pushNotification(customer.id, `Reminder: ${balance.outstanding.toFixed(2)} USDC due to your merchant`);
    toast.success("Reminder sent");
  };

  const exportCsv = () => {
    const rows = [["timestamp", "type", "amount_usdc", "status", "txHash", "notes"]];
    for (const t of txs) {
      rows.push([new Date(t.timestamp).toISOString(), t.type, String(t.amount), t.status, t.txHash || "", (t.notes || "").replace(/,/g, " ")]);
    }
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${customer.name}-ledger.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link to="/merchant" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Dashboard</Link>

      <Card className="mt-4 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 p-6" style={{ background: "var(--gradient-subtle)" }}>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-semibold uppercase shadow-elegant text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
              {customer.name.slice(0, 2)}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{customer.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono">{shortAddr(customer.walletAddress)}</span>
                {customer.phone && <span>· {customer.phone}</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={remind}><Bell className="mr-1 h-4 w-4" /> Send reminder</Button>
            <Button variant="outline" size="sm" onClick={exportCsv}><Download className="mr-1 h-4 w-4" /> Export</Button>
          </div>
        </div>

        {balance && (
          <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
            <Stat label="Borrowed" value={balance.borrowed} tone="default" />
            <Stat label="Repaid" value={balance.repaid} tone="success" />
            <Stat label="Outstanding" value={balance.outstanding} tone={balance.outstanding > 0 ? "warning" : "success"} />
          </div>
        )}
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="overflow-hidden">
          <div className="border-b border-border p-4 text-sm font-semibold">Transactions</div>
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
                      <div className="text-[11px] text-muted-foreground">
                        {new Date(t.timestamp).toLocaleString()}
                        {t.txHash && <> · <span className="font-mono">{shortAddr(t.txHash)}</span></>}
                      </div>
                      {t.notes && <div className="mt-0.5 text-xs text-muted-foreground">{t.notes}</div>}
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

        <Card className="h-fit p-4">
          <div className="text-sm font-semibold">Add entry</div>
          <Tabs value={type} onValueChange={(v) => setType(v as "borrow" | "repayment")} className="mt-3">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="borrow">Borrow</TabsTrigger>
              <TabsTrigger value="repayment">Repayment</TabsTrigger>
            </TabsList>
            <TabsContent value="borrow" className="mt-4 space-y-3">
              <FormFields amount={amount} setAmount={setAmount} notes={notes} setNotes={setNotes} />
              <Button onClick={submit} className="w-full" style={{ background: "var(--gradient-primary)" }}>
                <Plus className="mr-1 h-4 w-4" /> Record borrow
              </Button>
            </TabsContent>
            <TabsContent value="repayment" className="mt-4 space-y-3">
              <FormFields amount={amount} setAmount={setAmount} notes={notes} setNotes={setNotes} />
              <Button onClick={submit} variant="outline" className="w-full">
                <Plus className="mr-1 h-4 w-4" /> Record manual repayment
              </Button>
              <p className="text-[11px] text-muted-foreground">Customers can also repay themselves from their wallet.</p>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}

function FormFields({ amount, setAmount, notes, setNotes }: { amount: string; setAmount: (v: string) => void; notes: string; setNotes: (v: string) => void }) {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="amt">Amount (USDC)</Label>
        <Input id="amt" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="font-mono" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. groceries" />
      </div>
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "default" | "success" | "warning" }) {
  const cls = tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-foreground";
  return (
    <div className="p-5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 font-mono text-xl font-semibold ${cls}`}>
        {value.toFixed(2)} <span className="text-[10px] text-muted-foreground">USDC</span>
      </div>
    </div>
  );
}
