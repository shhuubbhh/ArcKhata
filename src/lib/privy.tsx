import { PrivyProvider as RealPrivyProvider, usePrivy as useRealPrivy } from "@privy-io/react-auth";
import { useMemo } from "react";
import type { PrivyProfile } from "./store";

// Use an environment variable for the App ID, with a fallback for local development.
const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || "cmoy4iag0006i0cjv1s0rxjcv";

export function PrivyProvider({ children }: { children: React.ReactNode }) {
  return (
    <RealPrivyProvider
      appId={PRIVY_APP_ID}
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

  return useMemo(
    () => ({
      ready,
      authenticated,
      user: mappedUser,
      login,
      logout,
    }),
    [ready, authenticated, mappedUser, login, logout],
  );
}