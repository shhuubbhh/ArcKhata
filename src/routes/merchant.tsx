import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useStore, customerBalance, shortAddr, type Customer, type Transaction } from "@/lib/store";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, TrendingUp, Users, Wallet, ArrowUpRight, Trash2, IndianRupee } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/merchant")({
  head: () => ({ meta: [{ title: "Merchant Dashboard — ArcLedger" }] }),
  component: MerchantPage,
});

function MerchantPage() {
  const user = useStore((s) => s.user);
  const navigate = useNavigate();
  const customers = useStore((s) => s.customers);
  const transactions = useStore((s) => s.transactions);
  const addCustomer = useStore((s) => s.addCustomer);
  const deleteCustomer = useStore((s) => s.deleteCustomer);
  const addTransaction = useStore((s) => s.addTransaction);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [wallet, setWallet] = useState("");
  const [phone, setPhone] = useState("");
  const [initialDue, setInitialDue] = useState("");

  useEffect(() => {
    if (!user) navigate({ to: "/login" });
    else if (user.role !== "merchant") navigate({ to: "/customer" });
  }, [user, navigate]);

  const myCustomers = useMemo(
    () => customers.filter((c) => c.merchantId === user?.id),
    [customers, user],
  );
  const myTxs = useMemo(
    () => transactions.filter((t) => t.merchantId === user?.id),
    [transactions, user],
  );

  const totals = useMemo(() => {
    let outstanding = 0, repaid = 0, monthly = 0;
    const monthAgo = Date.now() - 30 * 86400000;
    for (const c of myCustomers) {
      const b = customerBalance(c.id, myTxs);
      outstanding += b.outstanding;
      repaid += b.repaid;
    }
    for (const t of myTxs) {
      if (t.type === "repayment" && t.timestamp > monthAgo) monthly += t.amount;
    }
    return { outstanding, repaid, monthly, customers: myCustomers.length };
  }, [myCustomers, myTxs]);

  const filtered = myCustomers.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.walletAddress.toLowerCase().includes(query.toLowerCase()),
  );

  const submit = async () => {
    if (!name.trim()) return toast.error("Customer name is required");
    const due = parseFloat(initialDue);
    const customer = await addCustomer({ name: name.trim(), walletAddress: wallet.trim(), phone: phone.trim() || undefined });
    if (due > 0) {
      await addTransaction({ customerId: customer.id, amount: due, type: "borrow", notes: "Initial due" });
      toast.success(`${name} added with ₹${due.toFixed(2)} initial due`);
    } else {
      toast.success(`${name} added to your ledger`);
    }
    setName(""); setWallet(""); setPhone(""); setInitialDue(""); setOpen(false);
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{user.displayName}</h1>
          <p className="text-sm text-muted-foreground">Merchant ledger · USDC on Arc L1</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-elegant" style={{ background: "var(--gradient-primary)" }}>
              <Plus className="mr-1 h-4 w-4" /> Add customer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add customer</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="cname">Name</Label>
                <Input id="cname" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Riya Patel" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cwallet">Wallet address (optional)</Label>
                <Input id="cwallet" value={wallet} onChange={(e) => setWallet(e.target.value)} placeholder="0x… (auto-generated if empty)" className="font-mono text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cphone">Phone (optional)</Label>
                <Input id="cphone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cinitialdue">Initial due amount (USDC)</Label>
                <Input
                  id="cinitialdue"
                  type="number"
                  min="0"
                  step="0.01"
                  value={initialDue}
                  onChange={(e) => setInitialDue(e.target.value)}
                  placeholder="0.00 — leave blank if no opening balance"
                  className="font-mono"
                />
                <p className="text-[10px] text-muted-foreground">This will be recorded as the customer's opening borrow.</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit} style={{ background: "var(--gradient-primary)" }}>Add to ledger</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Customers" value={String(totals.customers)} icon={<Users className="h-4 w-4" />} />
        <StatCard label="Outstanding" value={`${totals.outstanding.toFixed(2)}`} suffix="USDC" tone="warning" icon={<Wallet className="h-4 w-4" />} />
        <StatCard label="Repaid (all-time)" value={`${totals.repaid.toFixed(2)}`} suffix="USDC" tone="success" icon={<ArrowUpRight className="h-4 w-4" />} />
        <StatCard label="Last 30 days" value={`${totals.monthly.toFixed(2)}`} suffix="USDC" icon={<TrendingUp className="h-4 w-4" />} />
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-border p-4">
          <h2 className="text-sm font-semibold">Customers</h2>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or wallet" className="pl-8" />
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-muted-foreground">No customers yet. Add your first one to start tracking dues.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((c) => (
              <CustomerRow key={c.id} customer={c} txs={myTxs} onDelete={() => { deleteCustomer(c.id); toast.success("Customer removed"); }} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function StatCard({ label, value, suffix, icon, tone }: { label: string; value: string; suffix?: string; icon: React.ReactNode; tone?: "success" | "warning" }) {
  const toneClass = tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-foreground";
  return (
    <Card className="p-4 shadow-soft">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs uppercase tracking-wider">{label}</span>
        <span className="rounded-md bg-secondary p-1.5">{icon}</span>
      </div>
      <div className={`mt-2 font-mono text-2xl font-semibold ${toneClass}`}>
        {value}
        {suffix && <span className="ml-1 text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </Card>
  );
}

function CustomerRow({ customer, txs, onDelete }: { customer: Customer; txs: Transaction[]; onDelete: () => void }) {
  const b = customerBalance(customer.id, txs);
  const addTransaction = useStore((s) => s.addTransaction);
  const [dueOpen, setDueOpen] = useState(false);
  const [dueAmount, setDueAmount] = useState("");
  const [dueNotes, setDueNotes] = useState("");
  const [dueType, setDueType] = useState<"borrow" | "repayment">("borrow");

  const submitDue = async () => {
    const amt = parseFloat(dueAmount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    await addTransaction({ customerId: customer.id, amount: amt, type: dueType, notes: dueNotes || undefined });
    toast.success(dueType === "borrow" ? `Due of ${amt.toFixed(2)} USDC added for ${customer.name}` : `Repayment of ${amt.toFixed(2)} USDC recorded`);
    setDueAmount(""); setDueNotes(""); setDueOpen(false);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-secondary/40 transition">
      <Link to="/merchant/customer/$id" params={{ id: customer.id }} className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-semibold uppercase">
          {customer.name.slice(0, 2)}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{customer.name}</div>
          <div className="truncate font-mono text-[11px] text-muted-foreground">{shortAddr(customer.walletAddress)}</div>
        </div>
      </Link>
      <div className="flex items-center gap-2">
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Outstanding</div>
          <div className={`font-mono text-sm font-semibold ${b.outstanding > 0 ? "text-warning" : "text-success"}`}>
            {b.outstanding.toFixed(2)} <span className="text-[10px] text-muted-foreground">USDC</span>
          </div>
        </div>
        {b.outstanding === 0 ? (
          <Badge variant="secondary" className="text-success">Settled</Badge>
        ) : (
          <Badge variant="outline">Due</Badge>
        )}

        {/* Quick Add Due Dialog */}
        <Dialog open={dueOpen} onOpenChange={setDueOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1 text-xs">
              <IndianRupee className="h-3.5 w-3.5" /> Add Due
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Add entry — {customer.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  variant={dueType === "borrow" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  style={dueType === "borrow" ? { background: "var(--gradient-primary)" } : {}}
                  onClick={() => setDueType("borrow")}
                >
                  Borrow (Due)
                </Button>
                <Button
                  variant={dueType === "repayment" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setDueType("repayment")}
                >
                  Repayment
                </Button>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`due-amt-${customer.id}`}>Amount (USDC)</Label>
                <Input
                  id={`due-amt-${customer.id}`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={dueAmount}
                  onChange={(e) => setDueAmount(e.target.value)}
                  placeholder="0.00"
                  className="font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`due-notes-${customer.id}`}>Notes (optional)</Label>
                <Input
                  id={`due-notes-${customer.id}`}
                  value={dueNotes}
                  onChange={(e) => setDueNotes(e.target.value)}
                  placeholder="e.g. groceries, rent…"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDueOpen(false)}>Cancel</Button>
              <Button onClick={submitDue} style={{ background: "var(--gradient-primary)" }}>
                {dueType === "borrow" ? "Record Due" : "Record Repayment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button variant="ghost" size="icon" onClick={onDelete}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
      </div>
    </div>
  );
}
