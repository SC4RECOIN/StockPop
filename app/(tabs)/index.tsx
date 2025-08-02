import {
  Pressable,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Text, View } from "@/components/Themed";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useCallback, useEffect, useMemo } from "react";
import { getErrorAlert, getInfoAlert } from "@/components/utils";
import { Notifier } from "react-native-notifier";
import { useWallet } from "@/components/WalletContext";
import { ApiTypes, useApiClient } from "@/components/useApiClient";
import { useQuery } from "@tanstack/react-query";
import Decimal from "decimal.js";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useLogin } from "@privy-io/expo/ui";
import Octicons from "@react-native-vector-icons/octicons";
import * as Clipboard from "expo-clipboard";

// Types
type Pool = ApiTypes["wallet"]["balances"]["pools"][number];
type PositionItemProps = { item: Pool };

/**
 * Home/Portfolio screen showing user positions and account info
 */
export default function PortfolioScreen() {
  const router = useRouter();
  const { balanceUpdate } = useLocalSearchParams<{ balanceUpdate?: string }>();
  const { pubkey } = useWallet();
  const client = useApiClient();

  // Query user balances
  const { data, isLoading, error } = useQuery({
    queryKey: ["balances", pubkey],
    queryFn: () => client.wallet.balances.query(pubkey!.toBase58()),
    enabled: !!pubkey,
    refetchInterval: balanceUpdate ? 1000 : 10000,
  });

  useEffect(() => {
    if (error) {
      console.error("Error fetching balances:", error);
      Notifier.showNotification(getErrorAlert(error, "Error loading balances"));
    }
  }, [error]);

  // Show login screen if not connected
  if (!pubkey) {
    return <LoginScreen />;
  }

  /**
   * Position item component - displays a single stock position
   */
  const PositionItem = useCallback(
    ({ item }: PositionItemProps) => {
      const asset = item.baseAsset;
      const priceChange = new Decimal(asset.stats24h.priceChange ?? 0)
        .div(asset.usdPrice)
        .mul(100);

      const positionValue = asset.usdPrice * (item.balance ?? 0);
      const isPositive = priceChange.isPositive();

      const handleStockPress = () => {
        router.push({
          pathname: "/(tabs)/swap",
          params: { stockId: asset.id },
        });
      };

      return (
        <TouchableOpacity style={styles.stockItem} onPress={handleStockPress}>
          <Image source={{ uri: asset.icon }} style={styles.stockImage} />

          <View style={styles.stockInfo}>
            <Text style={styles.ticker}>{asset.symbol}</Text>
            <Text style={styles.name}>{asset.name}</Text>
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.price}>${positionValue.toFixed(2)}</Text>
            <Text
              style={[
                styles.change,
                { color: isPositive ? "#4CAF50" : "#F44336" },
              ]}
            >
              {priceChange.toFixed(2)}%
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [router]
  );

  // Memoize derived data
  const portfolioData = useMemo(() => {
    const pools = data?.pools.filter((pool) => pool.balance ?? 0 > 0) || [];
    const noPositions = pools.length === 0;
    const usdCash =
      data?.other["EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"] ?? 0;

    return { pools, noPositions, usdCash };
  }, [data]);

  /**
   * Copy wallet address to clipboard
   */
  const handleCopyAddress = useCallback(async () => {
    if (pubkey) {
      await Clipboard.setStringAsync(pubkey.toBase58());
      Notifier.showNotification(
        getInfoAlert("Address Copied", pubkey.toBase58())
      );
    }
  }, [pubkey]);

  /**
   * Render the account deposit instructions section
   */
  const renderDepositInstructions = () => {
    if (portfolioData.usdCash > 0 || !pubkey) return null;

    return (
      <>
        <Text style={styles.noCashText}>
          Transfer USDC to your wallet to start trading. Tap the address below
          to copy it.
        </Text>
        <Pressable onPress={handleCopyAddress}>
          <Text style={styles.copyPubkey}>
            {pubkey.toBase58()} <Octicons name="copy" color="white" size={12} />
          </Text>
        </Pressable>
      </>
    );
  };

  /**
   * Render the upcoming features section
   */
  const renderUpcomingFeatures = () => (
    <>
      <Text style={styles.title}>Upcoming</Text>
      <Text style={styles.feature}>
        <Text style={{ fontWeight: "bold" }}>Feeless trades.</Text> Make trades
        without needing SOL to pay for transactions 🙌
      </Text>
      <Text style={styles.feature}>
        <Text style={{ fontWeight: "bold" }}>2x stocks and ETFs.</Text> Trade
        with leverage 💪
      </Text>
      <Text style={styles.feature}>
        <Text style={{ fontWeight: "bold" }}>
          Transfer USD directly to your wallet.
        </Text>{" "}
        Deposit USD from your bank account 💰
      </Text>
    </>
  );

  return (
    <View style={styles.container}>
      {/* Positions Section */}
      <Text style={styles.title}>Positions</Text>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      ) : portfolioData.noPositions ? (
        <Text style={styles.noPositionsText}>No Positions</Text>
      ) : (
        <FlatList
          data={portfolioData.pools}
          keyExtractor={(item) => item.id}
          renderItem={(props) => <PositionItem {...props} />}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Available Balance Section */}
      <Text style={styles.title}>Available to trade</Text>
      <View style={[styles.tradeRow, { marginBottom: 30 }]}>
        <Text style={styles.tradeLabel}>USD Cash</Text>
        <Text style={styles.tradeAmount}>
          ${portfolioData.usdCash.toFixed(2)}
        </Text>
      </View>

      {/* Deposit Instructions */}
      {renderDepositInstructions()}

      {/* Updates Section */}
      <Text
        style={[
          styles.title,
          { paddingTop: 30, borderTopWidth: 1, borderTopColor: "#1E1E1E" },
        ]}
      >
        Updates
      </Text>
      <Text style={styles.noPositionsText}>No updates</Text>

      {/* Upcoming Features */}
      {renderUpcomingFeatures()}
    </View>
  );
}

/**
 * Main screen styles
 */
const styles = StyleSheet.create({
  // Layout
  container: {
    padding: 15,
    backgroundColor: "black",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    marginTop: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },

  // Typography
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  noPositionsText: {
    textAlign: "center",
    fontSize: 16,
    color: "#888",
    marginVertical: 30,
  },

  // Stock Item
  stockItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  stockImage: {
    borderRadius: 8,
    marginRight: 15,
    width: 40,
    height: 40,
  },
  stockInfo: {
    flex: 1,
  },
  ticker: {
    fontSize: 16,
    fontWeight: "bold",
  },
  name: {
    fontSize: 14,
    opacity: 0.7,
  },
  priceContainer: {
    alignItems: "flex-end",
    marginRight: 30,
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
  },
  change: {
    fontSize: 14,
  },

  // Trade and Balance
  tradeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
  },
  tradeLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
  tradeAmount: {
    fontSize: 16,
  },
  noCashText: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 30,
    paddingVertical: 10,
    borderRadius: 8,
  },
  copyPubkey: {
    textAlign: "center",
    fontSize: 12,
    backgroundColor: "#5e42db3d",
    paddingVertical: 10,
    borderRadius: 8,
  },

  // Feature section
  feature: {
    fontSize: 16,
    backgroundColor: "#1E1E1E",
    marginVertical: 10,
    padding: 10,
    borderRadius: 8,
  },
});

/**
 * Login screen component for user authentication
 */
function LoginScreen() {
  const { login } = useLogin();
  const { connectWallet } = useWallet();

  /**
   * Handle login with Privy email
   */
  const handlePrivyLogin = useCallback(async () => {
    try {
      const result = await login({ loginMethods: ["email"] });
      console.log("User logged in", result.user);
    } catch (error) {
      console.error("Error logging in:", error);
    }
  }, [login]);

  /**
   * Handle connect with existing wallet
   */
  const handleConnectWallet = useCallback(async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error("Error connecting wallet:", error);
      Notifier.showNotification(
        getErrorAlert(error as Error, "Error connecting wallet")
      );
    }
  }, [connectWallet]);

  /**
   * Button opacity handler for press feedback
   */
  const getButtonStyle = useCallback(
    ({ pressed }: { pressed: boolean }) => [
      loginStyles.loginButton,
      { opacity: pressed ? 0.8 : 1 },
    ],
    []
  );

  /**
   * Wallet button style handler
   */
  const getWalletButtonStyle = useCallback(
    ({ pressed }: { pressed: boolean }) => [
      loginStyles.loginButton,
      loginStyles.walletButton,
      { opacity: pressed ? 0.8 : 1 },
    ],
    []
  );

  return (
    <View style={loginStyles.loginContainer}>
      {/* App title and logo */}
      <Text style={loginStyles.loginTitle}>StockPop</Text>
      <Image source={require("../../pop.png")} style={loginStyles.logo} />
      <Text style={loginStyles.loginSubtitle}>
        Please sign in to start trading stocks
      </Text>

      {/* Login buttons */}
      <Pressable style={getButtonStyle} onPress={handlePrivyLogin}>
        <FontAwesome
          name="envelope"
          size={20}
          color="#fff"
          style={loginStyles.buttonIcon}
        />
        <Text style={loginStyles.buttonText}>Login With Email</Text>
      </Pressable>

      <Pressable style={getWalletButtonStyle} onPress={handleConnectWallet}>
        <Text style={loginStyles.buttonText}>Connect Wallet</Text>
      </Pressable>
    </View>
  );
}

/**
 * Login screen styles
 */
const loginStyles = StyleSheet.create({
  // Layout
  loginContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "black",
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: "contain",
    marginBottom: 20,
  },

  // Typography
  loginTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
  },
  loginSubtitle: {
    fontSize: 16,
    marginBottom: 40,
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  // Buttons
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4285F4",
    borderRadius: 8,
    width: "80%",
    padding: 15,
    marginBottom: 20,
  },
  walletButton: {
    backgroundColor: "#6F4BD1",
  },
  buttonIcon: {
    marginRight: 10,
  },
});
