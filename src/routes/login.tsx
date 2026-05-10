import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { usePrivy } from "@/lib/privy";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Wallet, Store, User, Mail, Phone, Chrome } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — ArcLedger" }] }),
  component: LoginPage,
});

function LoginPage() {
  const loginMerchantWithPrivy = useStore((s) => s.loginMerchantWithPrivy);
  const loginAsCustomerWallet = useStore((s) => s.loginAsCustomerWallet);
  const sessionUser = useStore((s) => s.user);
  const privy = usePrivy();
  const navigate = useNavigate();
  const [walletInput, setWalletInput] = useState("");
  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Auto-resume: if Privy session is already persisted, finish merchant login.
  useEffect(() => {
    // Only auto-login if Privy is ready, we have a user, and we're NOT already logged into a local session.
    // Also check that we didn't just come here from a logout action.
    if (!privy.ready || !privy.user || sessionUser) return;
    
    console.log("Auto-login triggered for", privy.user.id);
    const profile = shopName.trim() ? { ...privy.user, displayName: shopName.trim() } : privy.user;
    const { merchant, created } = loginMerchantWithPrivy(profile);
    
    if (created) {
      toast.success(`Welcome to ArcLedger, ${merchant.businessName}`, {
        description: `Wallet ${merchant.walletAddress.slice(0, 10)}…`,
      });
    } else {
      toast.success(`Welcome back, ${merchant.businessName}`);
    }
    
    navigate({ to: "/merchant" });
  }, [privy.ready, privy.user, sessionUser, loginMerchantWithPrivy, navigate, shopName]);

  const handleLogin = () => {
    console.log("Login button clicked");
    console.log("Privy state:", { ready: privy.ready, authenticated: privy.authenticated });
    if (privy.ready) {
      privy.login();
    } else {
      console.warn("Privy is not ready yet");
    }
  };

  const connectCustomer = () => {
    if (!walletInput.startsWith("0x") || walletInput.length < 10) {
      toast.error("Enter the wallet your merchant assigned to you");
      return;
    }
    const u = loginAsCustomerWallet(walletInput.trim());
    if (!u) {
      toast.error("Wallet not found", { description: "Ask your merchant to add this wallet first." });
      return;
    }
    toast.success(`Welcome back, ${u.displayName}`);
    navigate({ to: "/customer" });
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-subtle)" }} />
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-2 md:py-20">
        <Card className="p-6 shadow-elegant">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Merchant Portal</h2>
              <p className="text-xs text-muted-foreground">Manage your business ledger securely</p>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="shop">Business name (optional)</Label>
              <Input id="shop" placeholder="e.g. Sharma General Store" value={shopName} onChange={(e) => setShopName(e.target.value)} />
              <p className="text-[10px] text-muted-foreground">This will be shown to your customers.</p>
            </div>

            <Button 
              onClick={handleLogin} 
              className="w-full py-6 text-base font-semibold shadow-elegant transition-all hover:scale-[1.02] active:scale-[0.98]" 
              style={{ background: "var(--gradient-primary)" }}
            >
              <Store className="mr-2 h-5 w-5" />
              Sign in with Privy
            </Button>

            <div className="space-y-2 pt-2">
              <p className="text-center text-[11px] text-muted-foreground">
                Secure login with Email, Google, or your favorite Wallet (MetaMask, Rabby, etc.)
              </p>
              <div className="flex justify-center gap-4 text-muted-foreground/40">
                <Mail className="h-4 w-4" />
                <Chrome className="h-4 w-4" />
                <Wallet className="h-4 w-4" />
              </div>
            </div>

            <p className="pt-2 text-[11px] text-muted-foreground">
              An embedded USDC wallet on Arc L1 is created the first time you sign in and reused on every future login.
            </p>
          </div>
        </Card>


        <Card className="p-6 shadow-elegant">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl text-accent-foreground" style={{ background: "color-mix(in oklab, var(--accent) 80%, transparent)" }}>
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">I'm a customer</h2>
              <p className="text-xs text-muted-foreground">View dues & repay in USDC</p>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="wallet">Your wallet address</Label>
              <Input id="wallet" placeholder="0x…" value={walletInput} onChange={(e) => setWalletInput(e.target.value)} className="font-mono text-xs" />
              <p className="text-[11px] text-muted-foreground">Use the wallet address your merchant added for you.</p>
            </div>
            <Button onClick={connectCustomer} variant="outline" className="w-full">
              <Wallet className="mr-2 h-4 w-4" /> Connect & View Ledger
            </Button>
          </div>
        </Card>
      </div>
      <p className="pb-10 text-center text-xs text-muted-foreground">
        New here? <Link to="/" className="text-primary underline-offset-4 hover:underline">Read about ArcLedger</Link>
      </p>
    </div>
  );
}