import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, ShieldCheck, Sparkles, Users, Wallet, Zap } from "lucide-react";
import heroImg from "@/assets/hero-usdc.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ArcLedger — Web3 Ledger for USDC on Circle Arc L1" },
      { name: "description", content: "A modern crypto ledger for merchants and customers. Track borrowings, send reminders, and settle dues in USDC on Circle Arc L1." },
      { property: "og:title", content: "ArcLedger — USDC Ledger on Arc L1" },
      { property: "og:description", content: "Crypto-native LedgerBook. USDC payments. Arc L1 settlement." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-subtle)" }} />
        <div className="absolute -top-40 right-0 -z-10 h-[600px] w-[600px] rounded-full opacity-30 blur-3xl" style={{ background: "var(--gradient-primary)" }} />

        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
          <div className="flex flex-col justify-center">
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
              <Sparkles className="h-3 w-3 text-primary" />
              Powered by USDC on Circle Arc L1
            </div>
            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              The crypto-native <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-primary)" }}>Ledger</span> for modern merchants.
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
              Track customer borrowings, send reminders, and settle dues in USDC — all on Circle's Arc L1. Built for merchants and the customers who pay them.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="shadow-elegant" style={{ background: "var(--gradient-primary)" }}>
                <Link to="/login">
                  Connect Wallet <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/login">Open Demo</Link>
              </Button>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-6 border-t border-border pt-6 max-w-md">
              <Stat label="Settlement" value="< 2s" />
              <Stat label="Tx Fee" value="~$0.001" />
              <Stat label="Currency" value="USDC" />
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-3xl blur-2xl" style={{ background: "var(--gradient-primary)", opacity: 0.25 }} />
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-elegant">
              <img src={heroImg} alt="USDC tokens on a blockchain network visualization" width={1536} height={1024} className="h-full w-full object-cover" />
            </div>
            <div className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-border bg-card p-4 shadow-elegant sm:block">
              <div className="text-xs text-muted-foreground">Outstanding</div>
              <div className="mt-1 font-mono text-2xl font-semibold">2,480.00 <span className="text-sm text-muted-foreground">USDC</span></div>
              <div className="mt-2 text-xs text-success">+ 320 USDC repaid today</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-card/40">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything a modern Ledger needs</h2>
            <p className="mt-3 text-muted-foreground">Familiar ledger workflow. On-chain settlement. Zero spreadsheet chaos.</p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Feature icon={<Users className="h-5 w-5" />} title="Customer ledgers" desc="Track borrowings and repayments per customer with a clean transaction history." />
            <Feature icon={<Wallet className="h-5 w-5" />} title="USDC payments" desc="Customers settle dues from any wallet. Funds land in your wallet instantly." />
            <Feature icon={<Zap className="h-5 w-5" />} title="Arc L1 speed" desc="Sub-second confirmations and near-zero fees on Circle's stablecoin chain." />
            <Feature icon={<BookOpen className="h-5 w-5" />} title="LedgerBook simplicity" desc="A workflow your customers already understand — borrow, owe, repay." />
            <Feature icon={<ShieldCheck className="h-5 w-5" />} title="Wallet auth" desc="Sign-in with embedded or external wallets. No passwords, no leaks." />
            <Feature icon={<Sparkles className="h-5 w-5" />} title="Real-time alerts" desc="Both sides get notified the moment a borrow or repayment is recorded." />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-90" style={{ background: "var(--gradient-hero)" }} />
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">Stop chasing payments. Start settling them.</h2>
          <p className="max-w-xl text-primary-foreground/80">Open ArcLedger in seconds. Add your first customer. Get paid in USDC.</p>
          <Button asChild size="lg" variant="secondary" className="shadow-elegant">
            <Link to="/login">Launch the app <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border bg-background">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} ArcLedger. Built on Circle Arc L1.</p>
          <p className="text-xs text-muted-foreground">USDC • Arc L1 • Web3</p>
        </div>
      </footer>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-lg font-semibold">{value}</div>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="group rounded-2xl border border-border bg-card p-6 shadow-soft transition hover:shadow-elegant">
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
        {icon}
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
