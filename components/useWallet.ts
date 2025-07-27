import { useEmbeddedSolanaWallet, usePrivy } from "@privy-io/expo";
import { Connection, PublicKey, VersionedTransaction } from "@solana/web3.js";
import {
  transact,
  Web3MobileWallet,
} from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import { useEffect, useState } from "react";
import { toUint8Array } from 'js-base64';
import AsyncStorage from "@react-native-async-storage/async-storage";

const APP_IDENTITY = {
  name: 'StockPop',
}

export function useWallet() {
  // privy
  const { user, logout } = usePrivy();
  const solanaWallet = useEmbeddedSolanaWallet()
  const privyWallet = solanaWallet?.wallets?.[0];
  const privyPubkey = privyWallet?.publicKey ? new PublicKey(privyWallet.publicKey) : null;

  // local wallet
  const [pubkey, setPubkey] = useState<PublicKey | null>(null);

  const connection = new Connection(process.env.EXPO_PUBLIC_SOLANA_RPC_URL!, 'confirmed');

  // sign with local or privy wallet
  const signAndSendTransaction = async (transaction: VersionedTransaction) => {
    let signature: string;
    if (privyWallet) {
      const provider = await privyWallet.getProvider()

      const result = await provider.request({
        method: 'signAndSendTransaction',
        params: {
          connection,
          transaction,
        }
      })
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
      throw new Error("Transaction confirmation failed: " + confirmationResult.value.err);
    }

    return signature
  };

  const signOut = async () => {
    // privy
    if (user) {
      await logout();
    }

    // device wallet
    if (pubkey) {
      const token = await AsyncStorage.getItem('wallet-token');

      await transact(async (wallet) => {
        if (!token) {
          return;
        }

        // Pass in the prior auth token to invalidate it.
        await wallet.deauthorize({ auth_token: token });
      });

      await AsyncStorage.removeItem('wallet-token');
      setPubkey(null);
    }
  }

  // connect device wallet
  const connectWallet = async () => {
    const authorizationResult = await transact(async (wallet: Web3MobileWallet) => {
      const authorizationResult = await wallet.authorize({
        cluster: "mainnet-beta",
        identity: APP_IDENTITY,
      });

      return authorizationResult;
    });

    console.log("Connected to: " + authorizationResult.accounts[0].address);
    setPubkey(getPublicKeyFromAddress(authorizationResult.accounts[0].address));
    await AsyncStorage.setItem('wallet-token', authorizationResult.auth_token);
  }

  // re-connect device wallet
  useEffect(() => {
    const reconnect = async () => {
      if (pubkey) {
        return;
      }

      const token = await AsyncStorage.getItem('wallet-token');
      if (!token) {
        console.info('No wallet token found, skipping reconnect');
        return;
      }

      await transact(async (wallet: Web3MobileWallet) => {
        const result = await wallet.reauthorize({
          identity: APP_IDENTITY,
          auth_token: token,
        });

        const pubkey = getPublicKeyFromAddress(result.accounts[0].address)
        console.log("Reconnected to: " + pubkey);
        setPubkey(pubkey);
      });
    }
    reconnect().catch(error => {
      console.error('Error reconnecting wallet:', error);
    });
  }, []);


  return {
    connected: !!user || !!pubkey,
    pubkey: pubkey ?? privyPubkey,
    signOut,
    signAndSendTransaction,
    connectWallet,
  };
}

function getPublicKeyFromAddress(address: string): PublicKey {
  const publicKeyByteArray = toUint8Array(address);
  return new PublicKey(publicKeyByteArray);
}
