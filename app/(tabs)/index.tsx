import { Pressable, StyleSheet, Image } from 'react-native';
import { Text, View } from '@/components/Themed';
import { usePrivy } from '@privy-io/expo';
import { useLoginWithOAuth } from '@privy-io/expo';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useCallback, useEffect, useState } from 'react';
import { getErrorAlert } from '@/components/utils';
import { Notifier } from 'react-native-notifier';
import { Web3MobileWallet, transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWallet } from '@/components/useWallet';

export default function TabOneScreen() {
  const { pubkey } = useWallet();

  if (!pubkey) {
    return <LoginScreen />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});

function LoginScreen() {
  const oauth = useLoginWithOAuth();
  const { connectWallet } = useWallet();

  useEffect(() => {
    if (oauth.state.status === 'error') {
      console.error('Auth error:', oauth.state.error);
      Notifier.showNotification(getErrorAlert(oauth.state.error!, 'Error logging in'));
    }
  }, [oauth.state]);

  const handleConnectWallet = useCallback(async () => {
    await connectWallet().catch(error => {
      console.error('Error connecting wallet:', error);
      Notifier.showNotification(getErrorAlert(error, 'Error connecting wallet'));
    })
  }, []);

  return (
    <View style={loginStyles.loginContainer}>
      <Text style={loginStyles.loginTitle}>StockPop</Text>
      <Image source={require('../../pop.png')} style={loginStyles.logo} />
      <Text style={loginStyles.loginSubtitle}>Please sign in to start trading stocks</Text>

      <Pressable
        style={({ pressed }) => [loginStyles.loginButton, { opacity: pressed ? 0.8 : 1 }]}
        onPress={() => oauth.login({ provider: 'google' })}
        disabled={oauth.state.status === 'loading'}
      >
        <FontAwesome name="google" size={20} color="#fff" style={loginStyles.buttonIcon} />
        <Text style={loginStyles.buttonText}>Login with Google</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [loginStyles.loginButton, loginStyles.walletButton, { opacity: pressed ? 0.8 : 1 }]}
        onPress={handleConnectWallet}
      >
        <Text style={loginStyles.buttonText}>Connect Wallet</Text>
      </Pressable>
    </View>
  );
}

const loginStyles = StyleSheet.create({
  loginContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  loginSubtitle: {
    fontSize: 16,
    marginBottom: 40,
    opacity: 0.7,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285F4',
    borderRadius: 8,
    width: '80%',
    padding: 15,
    marginBottom: 20,
  },
  walletButton: {
    backgroundColor: '#6F4BD1',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 10,
  },
});
