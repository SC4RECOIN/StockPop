import { usePrivy } from "@privy-io/expo";
import { useAuthorization } from "./AuthorizationProvider";

export function useWallet() {
  const { user } = usePrivy();
  const { selectedAccount } = useAuthorization();

  if (!user && !selectedAccount) {
    return { connected: false };
  }

  return {
    connected: !!user || !!selectedAccount,
    privyUser: user,
    pubkey: selectedAccount?.publicKey,
  };
} 