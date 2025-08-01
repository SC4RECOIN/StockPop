import React, { createContext, useContext, useEffect, useState } from "react";
import { useEmbeddedSolanaWallet, usePrivy } from "@privy-io/expo";
import { Connection, PublicKey, VersionedTransaction } from "@solana/web3.js";
import {
  transact,
  Web3MobileWallet,
} from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import { toUint8Array } from "js-base64";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { SolanaSignTransactions } from "@solana-mobile/mobile-wallet-adapter-protocol";

const APP_IDENTITY = {
  name: "StockPop",
  url: "https://stockpop-production.up.railway.app",
  icon: "favicon.ico",
};

type WalletContextType = {
  connected: boolean;
  pubkey: PublicKey | null;
  signOut: () => Promise<void>;
  signAndSendTransaction: (
    transaction: VersionedTransaction
  ) => Promise<string>;
  signTransaction: (
    transaction: VersionedTransaction
  ) => Promise<VersionedTransaction>;
  connectWallet: () => Promise<void>;
  connecting: boolean;
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [connecting, setConnecting] = useState(false);

  // privy
  const { user, logout } = usePrivy();
  const solanaWallet = useEmbeddedSolanaWallet();
  const privyWallet = solanaWallet?.wallets?.[0];
  const privyPubkey = privyWallet?.publicKey
    ? new PublicKey(privyWallet.publicKey)
    : null;

  // local wallet
  const [pubkey, setPubkey] = useState<PublicKey | null>(null);

  const connection = new Connection(
    process.env.EXPO_PUBLIC_SOLANA_RPC_URL!,
    "confirmed"
  );

  // sign and send with local or privy wallet
  const signAndSendTransaction = async (transaction: VersionedTransaction) => {
    let signature: string;
    if (privyWallet) {
      const provider = await privyWallet.getProvider();

      const result = await provider.request({
        method: "signAndSendTransaction",
        params: {
          connection,
          transaction,
        },
      });
      signature = result.signature;
    } else if (pubkey) {
      signature = await transact(async (wallet: Web3MobileWallet) => {
        const transactionSignatures = await wallet.signAndSendTransactions({
          transactions: [transaction],
        });

        return transactionSignatures[0];
      });
    } else {
      throw new Error("No wallet connected to sign transaction");
    }

    console.log("Transaction signature:", signature);

    const confirmationResult = await connection.confirmTransaction(
      signature,
      "confirmed"
    );
    if (confirmationResult.value.err) {
      throw new Error(
        "Transaction confirmation failed: " + confirmationResult.value.err
      );
    }

    return signature;
  };

  // just sign with local or privy wallet
  const signTransaction = async (transaction: VersionedTransaction) => {
    let signedTransaction: VersionedTransaction;

    try {
      if (privyWallet) {
        const provider = await privyWallet.getProvider();

        const result = await provider.request({
          method: "signTransaction",
          params: { transaction },
        });
        signedTransaction = result.signedTransaction;
      } else if (pubkey) {
        signedTransaction = await transact(async (wallet: Web3MobileWallet) => {
          const txns = await wallet.signTransactions({
            transactions: [transaction],
          });

          return txns[0];
        });
      } else {
        throw new Error("No wallet connected to sign transaction");
      }
    } catch (error) {
      console.error("Error signing transaction:", error);
      throw new Error("Failed to sign transaction");
    }

    return signedTransaction;
  };

  const signOut = async () => {
    // privy
    if (user) {
      await logout();
    }

    // device wallet
    if (pubkey) {
      const token = await AsyncStorage.getItem("wallet-token");

      await transact(async (wallet) => {
        if (!token) {
          return;
        }

        // Pass in the prior auth token to invalidate it.
        await wallet.deauthorize({ auth_token: token });
      });

      await AsyncStorage.removeItem("wallet-token");
      setPubkey(null);
    }

    router.push({
      pathname: "/(tabs)",
    });
  };

  // connect device wallet
  const connectWallet = async () => {
    if (connecting) {
      return;
    }
    setConnecting(true);

    try {
      const authorizationResult = await transact(
        async (wallet: Web3MobileWallet) => {
          const authorizationResult = await wallet.authorize({
            identity: APP_IDENTITY,
            chain: "solana:mainnet-beta",
            features: [SolanaSignTransactions],
          });

          return authorizationResult;
        }
      );

      const pubkey = getPublicKeyFromAddress(
        authorizationResult.accounts[0].address
      );
      console.log("Connected to: " + pubkey);
      setPubkey(pubkey);

      await AsyncStorage.setItem(
        "wallet-token",
        authorizationResult.auth_token
      );
    } catch (error) {
      console.error("Error connecting wallet:", error);
    } finally {
      setConnecting(false);
    }
  };

  // re-connect device wallet
  useEffect(() => {
    const reconnect = async () => {
      if (pubkey) {
        return;
      }

      const token = await AsyncStorage.getItem("wallet-token");
      if (!token) {
        console.info("No wallet token found, skipping reconnect");
        return;
      }

      try {
        await transact(async (wallet: Web3MobileWallet) => {
          const result = await wallet.reauthorize({
            identity: APP_IDENTITY,
            auth_token: token,
          });

          const pubkey = getPublicKeyFromAddress(result.accounts[0].address);
          console.log("Reconnected to: " + pubkey);
          setPubkey(pubkey);
        });
      } catch (error) {
        console.error("Error reconnecting wallet:", error);
        // If reconnect fails, clear the token
        await AsyncStorage.removeItem("wallet-token");
      }
    };

    if (connecting) {
      return;
    }
    setConnecting(true);
    reconnect().finally(() => {
      setConnecting(false);
    });
  }, []);

  const value = {
    connected: !!user || !!pubkey,
    pubkey: pubkey ?? privyPubkey,
    signOut,
    signAndSendTransaction,
    signTransaction,
    connectWallet,
    connecting,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);

  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }

  return context;
}

function getPublicKeyFromAddress(address: string): PublicKey {
  const publicKeyByteArray = toUint8Array(address);
  return new PublicKey(publicKeyByteArray);
}
