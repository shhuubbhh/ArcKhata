import React from "react";
import { PrivyProvider as RealPrivyProvider, usePrivy as useRealPrivy } from "@privy-io/react-auth";
import { useMemo } from "react";
import type { PrivyProfile } from "./store";

// Default fallback ID for testing if VITE_PRIVY_APP_ID is missing
const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || "cmoy4iag0006i0cjv1s0rxjcv";

export function PrivyProvider({ children }: { children: React.ReactNode }) {
  // If App ID is missing, provide a clear console warning
  if (!import.meta.env.VITE_PRIVY_APP_ID) {
    console.warn("Using fallback Privy App ID. Set VITE_PRIVY_APP_ID in your .env for production.");
  }

  return (
    <RealPrivyProvider
      appId={PRIVY_APP_ID || "missing-app-id"}
      config={{
        loginMethods: ["email", "wallet", "google"],
        appearance: {
          theme: "light",
          accentColor: "#676FFF",
          showWalletLoginFirst: false,
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: "all-users",
          },
        },
      }}
    >
      {children}
    </RealPrivyProvider>
  );
}

export function usePrivy() {
  const { ready, authenticated, user, login, logout } = useRealPrivy();

  const mappedUser = useMemo(() => {
    if (!user) return null;

    // Map Privy user to our internal PrivyProfile format
    const profile: PrivyProfile = {
      privyUserId: user.id,
      method: (user.linkedAccounts[0]?.type as any) || "email", // Fallback
      walletAddress: user.wallet?.address || "",
      email: user.email?.address,
      phone: user.phone?.number,
      displayName: user.email?.address?.split("@")[0] || "User",
    };

    // Refine method based on linked accounts
    if (user.google) profile.method = "google";
    else if (user.wallet) profile.method = "wallet";
    else if (user.email) profile.method = "email";
    else if (user.phone) profile.method = "phone";

    return profile;
  }, [user]);

  return {
    ready,
    authenticated,
    user: mappedUser,
    login,
    logout,
  };
}