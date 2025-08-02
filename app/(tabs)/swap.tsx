import { BaseAsset } from "@/api/src/models";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ScrollView,
  Animated,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useState, useEffect, useCallback, useMemo, useRef, use } from "react";
import Modal from "react-native-modal";
import { Notifier } from "react-native-notifier";
import { Text, View } from "@/components/Themed";
import { useApiClient } from "@/components/useApiClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getErrorAlert, getInfoAlert } from "@/components/utils";
import { Ionicons, Octicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { CandlestickChart, LineChart } from "react-native-wagmi-charts";
import {
  JupiterUltraOrderResponse,
  JupiterUltraService,
} from "@/services/tradeService";
import { useWallet } from "@/components/WalletContext";
import { useDebounce } from "use-debounce";
import { VersionedTransaction } from "@solana/web3.js";

/**
 * Swap screen for trading stocks and ETFs
 */
export default function SwapScreen() {
  const router = useRouter();
  const { stockId } = useLocalSearchParams<{ stockId: string }>();
  const client = useApiClient();
  const queryClient = useQueryClient();
  const { pubkey, signTransaction, solBalance } = useWallet();

  // Fetch all tradable stocks
  const { data, error } = useQuery({
    queryKey: ["stocks"],
    queryFn: () => client.stocks.tradable.query(),
  });

  // Extract available stocks from pools
  const stocks: BaseAsset[] = useMemo(
    () => data?.pools.map((p) => p.baseAsset) ?? [],
    [data?.pools]
  );

  // Search and selection state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStock, setSelectedStock] = useState<BaseAsset | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Action states
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [actionType, setActionType] = useState<"buy" | "sell" | null>(null);

  // UI states
  const [selectedTab, setSelectedTab] = useState("summary");
  const [tabAnimation] = useState(new Animated.Value(0));
  const [favorites, setFavorites] = useState<string[]>([]);

  /**
   * Trade amount states with debounce to prevent excessive API calls
   */
  const [amount, setAmount] = useState("");
  const [debouncedAmount] = useDebounce(amount, 1000);

  /**
   * Swap quote states for trading
   */
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [swapQuote, setSwapQuote] = useState<JupiterUltraOrderResponse | null>(
    null
  );
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [signingLoading, setSigningLoading] = useState(false);

  /**
   * Chart visualization states
   */
  const [chartType, setChartType] = useState<"line" | "candles">("line");
  const ticker = useMemo(
    () => selectedStock?.symbol ?? "",
    [selectedStock?.symbol]
  );
  const { width: screenWidth } = Dimensions.get("window");

  /**
   * Chart data query
   */
  const barData = useQuery({
    queryKey: ["stocks-bars", ticker],
    queryFn: () => client.stocks.bars.query({ ticker, barSize: 15 }),
    enabled: !!selectedStock,
  });

  /**
   * User balance data
   */
  const { data: balanceData } = useQuery({
    queryKey: ["balances", pubkey],
    queryFn: () => client.wallet.balances.query(pubkey!.toBase58()),
    enabled: !!pubkey,
    refetchInterval: 10_000,
  });

  /**
   * Computed balance values
   */
  const usdCash = useMemo(
    () =>
      balanceData?.other["EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"] ?? 0,
    [balanceData?.other]
  );

  const stockBalance = useMemo(
    () =>
      balanceData?.pools.find((pool) => pool.baseAsset.id === selectedStock?.id)
        ?.balance ?? 0,
    [balanceData?.pools, selectedStock?.id]
  );

  /**
   * Stock news data
   */
  const tickerData = useQuery({
    queryKey: ["stocks-news", ticker],
    queryFn: () => client.stocks.news.query(ticker),
    enabled: !!selectedStock,
  });

  const news = useMemo(
    () => tickerData.data?.news ?? [],
    [tickerData.data?.news]
  );

  /**
   * Transform stock price data for chart visualization
   * Returns [lineChartData, candlestickData]
   */
  const [lineData, candles] = useMemo(() => {
    // Handle error state
    if (barData.failureReason) {
      console.error("Error fetching stock price data:", barData.failureReason);
      Notifier.showNotification(
        getErrorAlert(barData.failureReason, "Error loading price data")
      );
    }

    // Handle empty data
    const data = barData.data?.bars;
    if (!data || data.length === 0) {
      console.warn("No price data available for the selected stock");
      return [[], []];
    }

    // Transform to line chart format
    const line = data.map((bar) => ({
      timestamp: bar.t,
      value: bar.c,
    }));

    // Transform to candlestick format
    const candlesticks = data.map((bar) => ({
      timestamp: bar.t,
      open: bar.o,
      high: bar.h,
      low: bar.l,
      close: bar.c,
    }));

    return [line, candlesticks];
  }, [barData.failureReason, barData.data]);

  /**
   * Load favorites from AsyncStorage
   */
  const loadFavorites = useCallback(async () => {
    try {
      const storedFavorites = await AsyncStorage.getItem("favorites");
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
  }, []);

  // Initial favorites load
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // Reload favorites when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [loadFavorites])
  );

  /**
   * Set selected stock based on URL parameter or default to first stock
   * This handles initial load and fallback options
   */
  useEffect(() => {
    if (stocks.length === 0) return;

    // If no stock is selected yet
    if (!selectedStock) {
      // Try to find stock from URL parameters
      if (stockId) {
        const stockFromParams = stocks.find((stock) => stock.id === stockId);

        if (stockFromParams) {
          setSelectedStock(stockFromParams);
        } else {
          // Fallback if requested stock not found
          setSelectedStock(stocks[0]);
        }
      } else {
        // Default to first stock if no specific request
        setSelectedStock(stocks[0]);
      }
    }

    // Handle any API errors
    if (error) {
      console.error("Error fetching stocks:", error);
      Notifier.showNotification(getErrorAlert(error, "Error loading stocks"));
    }
  }, [stocks, stockId, error, selectedStock]);

  /**
   * Update selected stock when URL parameter changes
   * This handles navigation between different stocks
   */
  useEffect(() => {
    if (!stockId || stocks.length === 0) return;

    const stockFromParams = stocks.find((stock) => stock.id === stockId);
    if (stockFromParams) {
      setSelectedStock(stockFromParams);
    }
  }, [stockId, stocks]);

  /**
   * Fetch swap quote whenever amount changes
   * This uses a debounced amount to prevent excessive API calls
   */
  useEffect(() => {
    // Reset previous state
    setQuoteError(null);
    setSwapQuote(null);

    // Only fetch if we have an amount
    if (debouncedAmount) {
      fetchSwapQuote();
    }
  }, [debouncedAmount]);

  /**
   * Filter stocks based on search query
   */
  const filteredStocks = useMemo(() => {
    if (!searchQuery.trim()) return stocks;

    const query = searchQuery.toLowerCase().trim();
    return stocks.filter(
      (stock) =>
        stock.name.toLowerCase().includes(query) ||
        stock.symbol.toLowerCase().includes(query)
    );
  }, [stocks, searchQuery]);

  /**
   * Handle stock selection from search results
   */
  const handleStockSelect = useCallback((stock: BaseAsset) => {
    Keyboard.dismiss();
    setSelectedStock(stock);
    setSearchQuery("");
    setShowResults(false);
  }, []);

  /**
   * Handle buy/sell action button press
   */
  const handleActionPress = useCallback((type: "buy" | "sell") => {
    setActionType(type);
    setActionModalVisible(true);
  }, []);

  /**
   * Close the action modal and reset state
   */
  const closeActionModal = useCallback(() => {
    setActionModalVisible(false);
    setAmount("");
    setSwapQuote(null);
    setQuoteError(null);
  }, []);

  /**
   * Fetch swap quote from Jupiter Ultra for the current trade
   */
  const fetchSwapQuote = useCallback(async () => {
    // Validate required data
    if (
      !selectedStock ||
      !pubkey ||
      !debouncedAmount ||
      parseFloat(debouncedAmount) <= 0
    ) {
      setSwapQuote(null);
      return;
    }

    try {
      setIsLoadingQuote(true);
      setQuoteError(null);

      const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
      let [input, output] = [USDC, selectedStock.id];
      let decimals = 6;

      if (actionType === "sell") {
        [input, output] = [selectedStock.id, USDC];
        decimals = selectedStock.decimals;
      }

      // Convert input amount to the correct unit based on token decimals
      const inputAmountBase = JupiterUltraService.toBaseUnits(
        debouncedAmount,
        decimals
      );

      console.log(
        `Getting swap quote for ${debouncedAmount} ${selectedStock.symbol} (${inputAmountBase} base units)`
      );

      const order = await JupiterUltraService.getSwapOrder(
        input,
        output,
        inputAmountBase.toString(),
        pubkey.toString()
      );

      console.log(
        `Received swap quote: ${order.inAmount} -> ${order.outAmount}`
      );
      setSwapQuote(order);

      if (order.errorMessage) {
        setQuoteError(order.errorMessage);
      }
    } catch (error) {
      console.error("Error fetching swap quote:", error);
      setQuoteError(
        error instanceof Error ? error.message : "Failed to get swap quote"
      );
    } finally {
      setIsLoadingQuote(false);
    }
  }, [selectedStock, pubkey, debouncedAmount, actionType]);

  /**
   * Format price impact percentage for display
   * Adds + sign for positive values and formats to 2 decimal places
   */
  const formatPriceImpact = useCallback(
    (priceImpactPct: string | undefined) => {
      if (!priceImpactPct) return "0.00%";
      const impact = parseFloat(priceImpactPct);
      return `${impact > 0 ? "+" : ""}${(impact * 100).toFixed(2)}%`;
    },
    []
  );

  /**
   * Execute the swap action (buy/sell)
   */
  const handleAction = useCallback(async () => {
    // Validate all required data is present
    if (!swapQuote || !selectedStock || !pubkey || !swapQuote.transaction) {
      console.error("Cannot execute swap: missing required data", {
        noQuote: !swapQuote,
        noStock: !selectedStock,
        noPubkey: !pubkey,
        noTransaction: !swapQuote?.transaction,
      });
      return;
    }

    try {
      // Prepare UI for transaction
      Keyboard.dismiss();
      setSigningLoading(true);

      // Deserialize and sign transaction
      const unSignedTransaction = VersionedTransaction.deserialize(
        Buffer.from(swapQuote.transaction, "base64")
      );
      const transaction = await signTransaction(unSignedTransaction);

      // Send the transaction
      await JupiterUltraService.executeSwapOrder(
        transaction,
        swapQuote.requestId
      );

      // Wait for transaction to be confirmed
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Refresh balances and close modal
      await queryClient.invalidateQueries({ queryKey: ["balances", pubkey] });
      closeActionModal();

      // Navigate to portfolio with refresh parameter
      router.push({
        pathname: "/(tabs)",
        params: { balanceUpdate: selectedStock.id },
      });

      // Show success notification
      Notifier.showNotification(
        getInfoAlert(
          "Swap Success",
          `${actionType === "buy" ? "Bought" : "Sold"} ${amount} ${
            selectedStock.symbol
          }`
        )
      );
    } catch (error) {
      console.error("Error executing swap:", error);
      Notifier.showNotification(
        getErrorAlert(error as Error, "Error executing swap")
      );
    } finally {
      setSigningLoading(false);
    }
  }, [
    swapQuote,
    selectedStock,
    pubkey,
    actionType,
    amount,
    signTransaction,
    queryClient,
    closeActionModal,
    router,
  ]);

  /**
   * Toggle favorite status for a stock
   */
  const toggleFavorite = useCallback(
    async (stockId: string) => {
      try {
        // Update favorites array
        const updatedFavorites = favorites.includes(stockId)
          ? favorites.filter((id) => id !== stockId)
          : [...favorites, stockId];

        // Update state and persist to storage
        setFavorites(updatedFavorites);
        await AsyncStorage.setItem(
          "favorites",
          JSON.stringify(updatedFavorites)
        );
      } catch (error) {
        console.error("Error toggling favorite:", error);
      }
    },
    [favorites]
  );

  /**
   * Check if a stock is in favorites
   */
  const isFavorite = useCallback(
    (stockId: string) => favorites.includes(stockId),
    [favorites]
  );

  /**
   * Render a stock item in the search results list
   */
  const renderStockItem = useCallback(
    ({ item, index }: { item: BaseAsset; index: number }) => (
      <TouchableOpacity
        style={[
          styles.stockItem,
          index === filteredStocks.length - 1 ? styles.lastStockItem : null,
        ]}
        onPress={() => handleStockSelect(item)}
        accessibilityLabel={`Select ${item.symbol}`}
      >
        <Image source={{ uri: item.icon }} style={styles.stockImage} />
        <View style={styles.stockTextContainer}>
          <Text style={styles.stockSymbol}>{item.symbol}</Text>
          <Text style={styles.stockFullName}>{item.name}</Text>
        </View>
      </TouchableOpacity>
    ),
    [filteredStocks.length, handleStockSelect]
  );

  /**
   * Render different tab content based on the selected tab
   */
  const TabSection = useCallback(
    ({ selectedTab }: { selectedTab: string }) => {
      // Summary tab - displays price chart and basic info
      if (selectedTab === "summary") {
        // Show loading indicator while chart data is loading
        if (barData.isLoading) {
          return (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#ffffff" />
            </View>
          );
        }

        // Don't render if no data available
        if (lineData.length === 0 && candles.length === 0) {
          return null;
        }

        return (
          <View style={styles.tabContentContainer}>
            <View style={styles.chartTypeToggle}>
              <TouchableOpacity
                style={[
                  styles.chartTypeButton,
                  chartType === "line" && styles.chartTypeButtonActive,
                ]}
                onPress={() => setChartType("line")}
              >
                <Text
                  style={[
                    styles.chartTypeText,
                    chartType === "line" && styles.chartTypeTextActive,
                  ]}
                >
                  Line
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.chartTypeButton,
                  chartType === "candles" && styles.chartTypeButtonActive,
                ]}
                onPress={() => setChartType("candles")}
              >
                <Text
                  style={[
                    styles.chartTypeText,
                    chartType === "candles" && styles.chartTypeTextActive,
                  ]}
                >
                  Candles
                </Text>
              </TouchableOpacity>
            </View>
            {chartType === "line" ? (
              <LineChart.Provider data={lineData}>
                <LineChart width={screenWidth - 20} height={250}>
                  <LineChart.Path color={"#9D00FF"}>
                    <LineChart.Gradient />
                  </LineChart.Path>
                  <LineChart.CursorCrosshair color="white">
                    <LineChart.Tooltip
                      textStyle={{
                        color: "white",
                        fontSize: 14,
                      }}
                    />
                  </LineChart.CursorCrosshair>
                </LineChart>
              </LineChart.Provider>
            ) : (
              <CandlestickChart.Provider data={candles}>
                <CandlestickChart width={screenWidth - 20} height={250}>
                  <CandlestickChart.Candles />
                  <CandlestickChart.Crosshair>
                    <CandlestickChart.Tooltip
                      style={{ backgroundColor: "black" }}
                      textStyle={{ color: "white", fontSize: 12 }}
                    />
                  </CandlestickChart.Crosshair>
                </CandlestickChart>
                <CandlestickChart.DatetimeText
                  style={{ color: "white", fontSize: 12 }}
                />
              </CandlestickChart.Provider>
            )}
            {selectedStock && (
              <View
                style={[
                  styles.discountAlert,
                  {
                    backgroundColor:
                      selectedStock.stockData.price < selectedStock.usdPrice
                        ? "rgba(255, 0, 0, 0.2)"
                        : "rgba(0, 255, 0, 0.2)",
                  },
                ]}
              >
                <Octicons
                  name="info"
                  color="white"
                  size={20}
                  style={{ marginRight: 10 }}
                />
                <Text style={{ flex: 1, flexWrap: "wrap", color: "white" }}>
                  This stock is trading{" "}
                  {Math.abs(
                    (1 -
                      selectedStock.stockData.price / selectedStock.usdPrice) *
                      100
                  ).toFixed(2)}
                  %{" "}
                  {selectedStock.stockData.price > selectedStock.usdPrice
                    ? "lower"
                    : "higher"}{" "}
                  on chain than it is on the stock market.
                </Text>
              </View>
            )}
          </View>
        );
      } else if (selectedTab === "news") {
        return (
          <View style={styles.tabContentContainer}>
            {news.length === 0 ? (
              <Text style={styles.tabContent}>No news available.</Text>
            ) : (
              news.map((item) => (
                <View key={item.id} style={styles.newsTile}>
                  <View style={styles.newsContent}>
                    <View style={styles.newsTitleRow}>
                      {item.image_url && (
                        <Image
                          source={{ uri: item.image_url }}
                          style={styles.newsImage}
                          resizeMode="cover"
                        />
                      )}
                      <Text style={[styles.newsText, styles.newsTitle]}>
                        {item.title}
                      </Text>
                    </View>
                    <Text style={[styles.newsText, styles.newsDescription]}>
                      {item.description}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        );
      } else if (selectedTab === "profile") {
        return (
          <View style={styles.tabContentContainer}>
            <View style={styles.pillContainer}>
              {selectedStock?.sector && (
                <Text style={styles.pill}>{selectedStock?.sector}</Text>
              )}
              {selectedStock?.industry && (
                <Text style={styles.pill}>{selectedStock?.industry}</Text>
              )}
            </View>
            <Text style={[styles.tabContent, styles.profileDescription]}>
              {selectedStock?.description ||
                "No profile information available."}
            </Text>
          </View>
        );
      }
      return null;
    },
    [
      selectedTab,
      barData.isLoading,
      lineData,
      candles,
      screenWidth,
      chartType,
      selectedStock,
      news,
    ]
  );

  /**
   * Handle tab selection with animation
   */
  const handleTabPress = useCallback(
    (tab: string) => {
      setSelectedTab(tab);

      // Animate tab transition
      Animated.timing(tabAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start(() => {
        tabAnimation.setValue(0);
      });
    },
    [tabAnimation]
  );

  const quoteOutput =
    swapQuote &&
    selectedStock &&
    JupiterUltraService.fromBaseUnits(
      swapQuote.outAmount,
      actionType === "buy" ? selectedStock.decimals : 6
    );

  const solThreshold = 0.005;
  const solBelowThreshold = solBalance < solThreshold;

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback
        onPress={() => {
          setShowResults(false);
          Keyboard.dismiss();
        }}
      >
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#FFFFFF"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search stocks..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setShowResults(text.length > 0);
            }}
            onFocus={() => setShowResults(true)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                setShowResults(false);
              }}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#888" />
            </TouchableOpacity>
          )}
          {selectedStock && (
            <TouchableOpacity onPress={() => toggleFavorite(selectedStock.id)}>
              <Ionicons
                name={isFavorite(selectedStock.id) ? "star" : "star-outline"}
                size={24}
                color={isFavorite(selectedStock.id) ? "#FFFFFF" : "#666"}
                style={styles.favoriteIcon}
              />
            </TouchableOpacity>
          )}
        </View>
      </TouchableWithoutFeedback>

      {showResults && (
        <>
          <TouchableWithoutFeedback
            onPress={() => {
              setShowResults(false);
              Keyboard.dismiss();
            }}
          >
            <View style={styles.searchBackdrop} />
          </TouchableWithoutFeedback>
          <View style={styles.resultsContainer}>
            <FlatList
              data={filteredStocks}
              keyExtractor={(item) => item.id}
              renderItem={renderStockItem}
              style={styles.resultsList}
              keyboardShouldPersistTaps="always"
            />
          </View>
        </>
      )}

      {selectedStock && !showResults && (
        <View style={styles.stockDetails}>
          <View style={styles.stockHeader}>
            <View style={styles.stockHeaderLeft}>
              <Image
                source={{ uri: selectedStock.icon }}
                style={styles.stockImageLarge}
              />
              <View>
                <Text>{selectedStock.name.replace("xStock", "")}</Text>
                <Text style={styles.stockSymbolLarge}>
                  {selectedStock.symbol}
                </Text>
              </View>
            </View>
            <View style={styles.stockHeaderRight}>
              <Text style={styles.stockPriceLarge}>
                $ {selectedStock.stockData.price.toFixed(2)}{" "}
                <Text style={{ fontSize: 16 }}>USD</Text>
              </Text>
              <Text style={styles.stockChange24h}>+ {(0.44).toFixed(2)}%</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.tabContainer}>
        {["summary", "news", "profile"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabButton,
              selectedTab === tab && styles.activeTabButton,
            ]}
            onPress={() => handleTabPress(tab)}
          >
            <Animated.Text
              style={[
                styles.tabButtonText,
                selectedTab === tab && styles.activeTabButtonText,
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Animated.Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.tabContentScrollView}>
        <TabSection selectedTab={selectedTab} />
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.buyButton]}
          onPress={() => handleActionPress("buy")}
        >
          <Text style={styles.buyButtonText}>Buy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.sellButton]}
          onPress={() => handleActionPress("sell")}
        >
          <Text style={styles.actionButtonText}>Sell</Text>
        </TouchableOpacity>
      </View>

      <Modal isVisible={actionModalVisible} onBackdropPress={closeActionModal}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {actionType === "buy" ? "Buy" : "Sell"} {selectedStock?.symbol}
          </Text>
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>Available:</Text>
            <TouchableOpacity
              onPress={() => {
                if (actionType === "buy") {
                  setAmount(usdCash.toString());
                } else {
                  setAmount(stockBalance.toString());
                }
              }}
            >
              <Text style={[styles.balanceValue]}>
                {actionType === "buy"
                  ? `${usdCash.toFixed(2)} USD`
                  : `${stockBalance.toFixed(6)} ${selectedStock?.symbol}`}{" "}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter amount"
              placeholderTextColor="#888"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              autoFocus
            />
            <TouchableOpacity
              style={styles.maxButton}
              onPress={() => {
                if (actionType === "buy") {
                  setAmount(usdCash.toString());
                } else {
                  setAmount(stockBalance.toString());
                }
              }}
            >
              <Text style={styles.maxButtonText}>MAX</Text>
            </TouchableOpacity>
          </View>

          {isLoadingQuote && (
            <View style={styles.quoteLoadingContainer}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.quoteLoadingText}>Getting quote...</Text>
            </View>
          )}

          {quoteError && (
            <View style={styles.quoteErrorContainer}>
              <Text style={styles.quoteErrorText}>{quoteError}</Text>
            </View>
          )}

          {solBelowThreshold && (
            <View style={styles.quoteErrorContainer}>
              <Text style={styles.quoteErrorText}>
                SOL balance for transaction might be too low
              </Text>
            </View>
          )}

          {swapQuote && !isLoadingQuote && quoteOutput && (
            <View style={styles.quoteInfoContainer}>
              <View style={styles.quoteInfoRow}>
                <Text style={styles.quoteLabel}>You'll receive:</Text>
                <Text style={styles.quoteValue}>
                  {actionType === "buy"
                    ? `${quoteOutput.toFixed(6)} ${selectedStock?.symbol}`
                    : `${quoteOutput.toFixed(2)} USD`}
                </Text>
              </View>

              <View style={styles.quoteInfoRow}>
                <Text style={styles.quoteLabel}>Exchange Rate:</Text>
                <Text style={styles.quoteValue}>
                  1 {selectedStock?.symbol} ≈{" "}
                  {(actionType === "buy"
                    ? JupiterUltraService.fromBaseUnits(swapQuote.inAmount, 6) /
                      quoteOutput
                    : quoteOutput /
                      JupiterUltraService.fromBaseUnits(
                        swapQuote.inAmount,
                        selectedStock!.decimals
                      )
                  ).toFixed(2)}{" "}
                  USD
                </Text>
              </View>

              <View style={styles.quoteInfoRow}>
                <Text style={styles.quoteLabel}>Price Impact:</Text>
                <Text
                  style={[
                    styles.quoteValue,
                    parseFloat(swapQuote.priceImpactPct) > 1
                      ? styles.highImpact
                      : null,
                  ]}
                >
                  {formatPriceImpact(swapQuote.priceImpactPct)}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.modalButtonContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.sellButton]}
              onPress={closeActionModal}
            >
              <Text style={styles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.buyButton]}
              onPress={handleAction}
              disabled={
                !amount || isLoadingQuote || !!quoteError || signingLoading
              }
            >
              {isLoadingQuote || signingLoading ? (
                <View style={styles.loadingButtonContent}>
                  <ActivityIndicator size="small" color="#000000" />
                </View>
              ) : (
                <Text style={styles.buyButtonText}>
                  {actionType === "buy" ? "Buy" : "Sell"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingLeft: 10,
    paddingRight: 10,
    position: "relative",
    backgroundColor: "black",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    borderRadius: 8,
    padding: 10,
    marginBottom: 30,
    marginTop: 60,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
    padding: 5,
  },
  clearButton: {
    padding: 5,
  },
  resultsContainer: {
    backgroundColor: "#1E1E1E",
    borderRadius: 8,
    maxHeight: 300,
    marginBottom: 15,
    zIndex: 10,
    position: "relative",
    elevation: 3,
  },
  resultsList: {
    maxHeight: 300,
  },
  input: {
    padding: 15,
    backgroundColor: "#1E1E1E",
    borderRadius: 8,
    color: "#FFFFFF",
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 20,
  },
  actionButton: {
    flex: 1,
    padding: 15,
    borderRadius: 16,
    alignItems: "center",
    marginHorizontal: 5,
  },
  buyButton: {
    backgroundColor: "#FFFFFF",
  },
  sellButton: {
    borderColor: "#FFFFFF",
    borderWidth: 1,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  buyButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "bold",
  },
  stockItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  lastStockItem: {
    borderBottomWidth: 0,
  },
  stockImage: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  stockTextContainer: {
    flex: 1,
    backgroundColor: "#1E1E1E",
  },
  stockName: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  stockSymbol: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  stockFullName: {
    color: "#999",
    fontSize: 14,
  },
  stockDetails: {
    marginBottom: 15,
  },
  stockHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  stockHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  stockHeaderRight: {
    alignItems: "flex-end",
  },
  stockImageLarge: {
    width: 60,
    height: 60,
    marginRight: 10,
  },
  stockSymbolLarge: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  stockPriceLarge: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },
  stockChange24h: {
    color: "lightgreen",
    fontSize: 16,
  },
  modalContent: {
    backgroundColor: "#1E1E1E",
    padding: 20,
    borderRadius: 8,
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  modalInput: {
    padding: 15,
    backgroundColor: "#2E2E2E",
    borderRadius: 8,
    color: "#FFFFFF",
    fontSize: 16,
    flex: 1,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#1E1E1E",
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    backgroundColor: "transparent",
  },
  activeTabButton: {
    backgroundColor: "#FFFFFF",
  },
  tabButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  activeTabButtonText: {
    color: "#000000",
  },
  tabContentScrollView: {
    flex: 1,
  },
  tabContentContainer: {},
  tabTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  tabContent: {
    color: "#FFFFFF",
    fontSize: 16,
    marginBottom: 5,
  },
  newsTile: {
    padding: 15,
    borderRadius: 8,
    borderColor: "#333",
    borderWidth: 1,
    marginBottom: 15,
  },
  newsContent: {
    flexDirection: "column",
  },
  newsTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  newsImage: {
    width: 60,
    height: 60,
    borderRadius: 4,
    marginRight: 10,
  },
  newsText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  newsTitle: {
    fontWeight: "bold",
    flex: 1,
  },
  newsDescription: {
    marginTop: 4,
    fontSize: 14,
    color: "#CCC",
  },
  favoriteIcon: {
    marginLeft: 10,
  },
  profileDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 10,
  },
  pillContainer: {
    flexDirection: "row",
    marginBottom: 10,
  },
  pill: {
    backgroundColor: "#2E2E2E",
    color: "#FFFFFF",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginRight: 10,
  },
  chartTypeToggle: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 10,
    zIndex: 1,
  },
  chartTypeButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: "#666",
  },
  chartTypeButtonActive: {
    backgroundColor: "#FFFFFF",
    borderColor: "#FFFFFF",
  },
  chartTypeText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  chartTypeTextActive: {
    color: "#000000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: 150,
  },
  searchBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  discountAlert: {
    backgroundColor: "#2E2E2E",
    padding: 10,
    borderRadius: 5,
    flexDirection: "row",
    marginTop: 10,
  },
  // Swap Quote Styles
  quoteLoadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    flexDirection: "row",
    backgroundColor: "#1E1E1E",
    marginBottom: 15,
  },
  quoteLoadingText: {
    color: "#FFFFFF",
    marginLeft: 10,
    fontSize: 14,
  },
  quoteErrorContainer: {
    backgroundColor: "rgba(255, 0, 0, 0.1)",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  quoteErrorText: {
    color: "#FF6B6B",
    fontSize: 14,
  },
  quoteInfoContainer: {
    backgroundColor: "#2E2E2E",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  quoteInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    backgroundColor: "transparent",
  },
  quoteLabel: {
    color: "#AAAAAA",
    fontSize: 14,
  },
  quoteValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  highImpact: {
    color: "#FF6B6B",
  },
  loadingButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
  },
  loadingButtonText: {
    marginLeft: 8,
  },
  balanceInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    backgroundColor: "#1E1E1E",
    padding: 5,
  },
  balanceLabel: {
    color: "#AAAAAA",
    fontSize: 14,
  },
  balanceValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  maxButton: {
    position: "absolute",
    right: 10,
    backgroundColor: "#333",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  maxButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
});
