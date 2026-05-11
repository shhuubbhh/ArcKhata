import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { supabase } from "./supabase";

export type Role = "merchant" | "customer";
export type TxType = "borrow" | "repayment";
export type TxStatus = "pending" | "confirmed";

export interface Customer {
  id: string;
  merchantId: string;
  name: string;
  walletAddress: string;
  phone?: string;
  createdAt: number;
}

export interface Transaction {
  id: string;
  customerId: string;
  merchantId: string;
  amount: number;
  type: TxType;
  status: TxStatus;
  notes?: string;
  txHash?: string;
  timestamp: number;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  createdAt: number;
}

export interface SessionUser {
  id: string;
  role: Role;
  walletAddress: string;
  email?: string;
  displayName?: string;
}

export interface Merchant {
  id: string;
  privyUserId: string;
  walletAddress: string;
  email?: string;
  businessName: string;
  createdAt: number;
}

export interface PrivyProfile {
  privyUserId: string;
  method: "email" | "google" | "phone" | "wallet";
  email?: string;
  phone?: string;
  displayName?: string;
  walletAddress: string;
}

interface State {
  user: SessionUser | null;
  merchants: Merchant[];
  customers: Customer[];
  transactions: Transaction[];
  notifications: Notification[];
  loginMerchantWithPrivy: (profile: PrivyProfile) => { user: SessionUser; merchant: Merchant; created: boolean };
  loginAsCustomerWallet: (walletAddress: string) => SessionUser | null;
  logout: () => void;
  addCustomer: (input: Omit<Customer, "id" | "createdAt" | "merchantId">) => Customer;
  updateCustomer: (id: string, patch: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  addTransaction: (input: Omit<Transaction, "id" | "timestamp" | "merchantId" | "status"> & { status?: TxStatus }) => Transaction;
  pushNotification: (userId: string, message: string) => void;
  markAllRead: (userId: string) => void;
  fetchInitialData: () => Promise<void>;
}

const rid = () => Math.random().toString(36).slice(2, 10);
const fakeWallet = () =>
  "0x" +
  Array.from({ length: 40 }, () =>
    "0123456789abcdef"[Math.floor(Math.random() * 16)],
  ).join("");
const fakeTxHash = () =>
  "0x" +
  Array.from({ length: 64 }, () =>
    "0123456789abcdef"[Math.floor(Math.random() * 16)],
  ).join("");

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      user: null,
      merchants: [],
      customers: [],
      transactions: [],
      notifications: [],
      loginMerchantWithPrivy: async (profile) => {
        try {
          // 1. Check local state
          let merchant = get().merchants.find((m) => m.privyUserId === profile.privyUserId);
          let created = false;

          // 2. Check/Sync with Supabase
          const { data: dbMerchant, error: fetchError } = await supabase
            .from("merchants")
            .select("*")
            .eq("privy_user_id", profile.privyUserId)
            .single();

          if (fetchError && fetchError.code !== 'PGRST116') {
            console.error("Supabase fetch error:", fetchError);
          }

          if (dbMerchant) {
            // Map DB snake_case to local camelCase
            merchant = {
              id: dbMerchant.id,
              privyUserId: dbMerchant.privy_user_id,
              walletAddress: dbMerchant.wallet_address,
              email: dbMerchant.email,
              businessName: dbMerchant.business_name,
              createdAt: new Date(dbMerchant.created_at).getTime(),
            };
            // Update local cache if different
            if (!get().merchants.find(m => m.id === merchant!.id)) {
              set({ merchants: [merchant, ...get().merchants] });
            }
          } else if (!merchant) {
            // Create new
            const newId = rid();
            const newMerchant: Merchant = {
              id: newId,
              privyUserId: profile.privyUserId,
              walletAddress: profile.walletAddress,
              email: profile.email,
              businessName: profile.displayName || profile.email?.split("@")[0] || "My Shop",
              createdAt: Date.now(),
            };

            const { error: insertError } = await supabase.from("merchants").insert({
              id: newId,
              privy_user_id: profile.privyUserId,
              wallet_address: profile.walletAddress,
              email: profile.email,
              business_name: newMerchant.businessName,
            });

            if (insertError) {
              console.error("Supabase insert error:", insertError);
            }

            merchant = newMerchant;
            created = true;
            set({ merchants: [merchant, ...get().merchants] });
          }

          const user: SessionUser = {
            id: merchant!.id,
            role: "merchant",
            walletAddress: merchant!.walletAddress,
            email: merchant!.email,
            displayName: merchant!.businessName,
          };
          set({ user });
          
          // Fetch data for this merchant
          await get().fetchInitialData();
          
          return { user, merchant: merchant!, created };
        } catch (error) {
          console.error("Login error:", error);
          // Still allow login to proceed with local state if possible, or throw a clearer error
          throw error;
        }
      },
      loginAsCustomerWallet: (walletAddress) => {
        const customer = get().customers.find(
          (c) => c.walletAddress.toLowerCase() === walletAddress.toLowerCase(),
        );
        if (!customer) return null;
        const user: SessionUser = {
          id: customer.id,
          role: "customer",
          walletAddress: customer.walletAddress,
          displayName: customer.name,
        };
        set({ user });
        return user;
      },
      logout: () => set({ user: null }),
      fetchInitialData: async () => {
        try {
          const user = get().user;
          if (!user) return;

          if (user.role === "merchant") {
            // Fetch customers for this merchant
            const { data: customers, error: customerError } = await supabase
              .from("customers")
              .select("*")
              .eq("merchant_id", user.id);
            
            if (customerError) console.error("Error fetching customers:", customerError);
            
            if (customers) {
              set({
                customers: customers.map((c) => ({
                  id: c.id,
                  merchantId: c.merchant_id,
                  name: c.name,
                  walletAddress: c.wallet_address,
                  phone: c.phone,
                  createdAt: new Date(c.created_at).getTime(),
                })),
              });
            }

            // Fetch transactions for these customers
            const { data: transactions, error: txError } = await supabase
              .from("transactions")
              .select("*")
              .eq("merchant_id", user.id);
            
            if (txError) console.error("Error fetching transactions:", txError);
            
            if (transactions) {
              set({
                transactions: transactions.map((t) => ({
                  id: t.id,
                  customerId: t.customer_id,
                  merchantId: t.merchant_id,
                  amount: Number(t.amount),
                  type: t.type,
                  status: t.status,
                  notes: t.notes,
                  txHash: t.tx_hash,
                  timestamp: new Date(t.timestamp).getTime(),
                })),
              });
            }
          } else {
            // Customer role: Fetch their specific data
            const { data: transactions, error: txError } = await supabase
              .from("transactions")
              .select("*")
              .eq("customer_id", user.id);
            
            if (txError) console.error("Error fetching transactions:", txError);
            
            if (transactions) {
              set({
                transactions: transactions.map((t) => ({
                  id: t.id,
                  customerId: t.customer_id,
                  merchantId: t.merchant_id,
                  amount: Number(t.amount),
                  type: t.type,
                  status: t.status,
                  notes: t.notes,
                  txHash: t.tx_hash,
                  timestamp: new Date(t.timestamp).getTime(),
                })),
              });
            }
          }
        } catch (error) {
          console.error("fetchInitialData error:", error);
        }
      },
      addCustomer: async (input) => {
        const user = get().user;
        if (!user || user.role !== "merchant") throw new Error("Not a merchant");
        
        const newId = rid();
        const customer: Customer = {
          id: newId,
          merchantId: user.id,
          createdAt: Date.now(),
          ...input,
          walletAddress: input.walletAddress || fakeWallet(),
        };

        // Optimistic update
        set({ customers: [customer, ...get().customers] });

        // Sync with Supabase
        await supabase.from("customers").insert({
          id: newId,
          merchant_id: user.id,
          name: customer.name,
          wallet_address: customer.walletAddress,
          phone: customer.phone,
        });

        get().pushNotification(user.id, `Customer ${customer.name} added`);
        return customer;
      },
      updateCustomer: async (id, patch) => {
        set({
          customers: get().customers.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        });
        
        await supabase.from("customers").update({
          name: patch.name,
          wallet_address: patch.walletAddress,
          phone: patch.phone,
        }).eq("id", id);
      },
      deleteCustomer: async (id) => {
        set({
          customers: get().customers.filter((c) => c.id !== id),
          transactions: get().transactions.filter((t) => t.customerId !== id),
        });
        
        await supabase.from("customers").delete().eq("id", id);
      },
      addTransaction: async ({ customerId, amount, type, notes, status, txHash }) => {
        const user = get().user;
        if (!user) throw new Error("Not logged in");
        const customer = get().customers.find((c) => c.id === customerId);
        if (!customer) throw new Error("Customer not found");
        
        const newId = rid();
        const tx: Transaction = {
          id: newId,
          merchantId: customer.merchantId,
          customerId,
          amount,
          type,
          notes,
          status: status || "confirmed",
          txHash: txHash || (type === "repayment" ? fakeTxHash() : undefined),
          timestamp: Date.now(),
        };

        // Optimistic update
        set({ transactions: [tx, ...get().transactions] });

        // Sync with Supabase
        await supabase.from("transactions").insert({
          id: newId,
          customer_id: customerId,
          merchant_id: customer.merchantId,
          amount,
          type,
          status: tx.status,
          notes,
          tx_hash: tx.txHash,
        });

        const verb = type === "borrow" ? "Borrow recorded" : "Repayment received";
        get().pushNotification(customer.merchantId, `${verb}: ${amount.toFixed(2)} USDC — ${customer.name}`);
        get().pushNotification(customer.id, `${type === "borrow" ? "New borrow on your ledger" : "Payment confirmed"}: ${amount.toFixed(2)} USDC`);
        return tx;
      },
      pushNotification: (userId, message) =>
        set({
          notifications: [
            { id: rid(), userId, message, read: false, createdAt: Date.now() },
            ...get().notifications,
          ].slice(0, 200),
        }),
      markAllRead: (userId) =>
        set({
          notifications: get().notifications.map((n) =>
            n.userId === userId ? { ...n, read: true } : n,
          ),
        }),
    }),
    {
      name: "arckhata-store-v2",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : (undefined as any),
      ),
      skipHydration: true,
    },
  ),
);

export function customerBalance(customerId: string, txs: Transaction[]) {
  let borrowed = 0;
  let repaid = 0;
  for (const t of txs) {
    if (t.customerId !== customerId) continue;
    if (t.type === "borrow") borrowed += t.amount;
    else repaid += t.amount;
  }
  return { borrowed, repaid, outstanding: Math.max(0, borrowed - repaid) };
}

export function shortAddr(addr: string) {
  if (!addr) return "";
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}