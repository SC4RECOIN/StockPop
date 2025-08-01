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
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Modal from "react-native-modal";
import { Notifier } from "react-native-notifier";
import { Text, View } from "@/components/Themed";
import { useApiClient } from "@/components/useApiClient";
import { useQuery } from "@tanstack/react-query";
import { getErrorAlert } from "@/components/utils";
import { Ionicons, Octicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { CandlestickChart, LineChart } from "react-native-wagmi-charts";
import {
  JupiterUltraOrderResponse,
  JupiterUltraService,
} from "@/services/tradeService";
import { useWallet } from "@/components/WalletContext";
import { useDebounce } from "use-debounce";

export default function SwapScreen() {
  const { stockId } = useLocalSearchParams<{ stockId: string }>();
  const client = useApiClient();
  const { pubkey } = useWallet();
  const { data, error } = useQuery({
    queryKey: ["stocks"],
    queryFn: () => client.stocks.tradable.query(),
  });
  const stocks: BaseAsset[] = data?.pools.map((p) => p.baseAsset) ?? [];

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStock, setSelectedStock] = useState<BaseAsset | null>(null);

  const [showResults, setShowResults] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [actionType, setActionType] = useState<"buy" | "sell" | null>(null);
  const [selectedTab, setSelectedTab] = useState("summary");
  const [tabAnimation] = useState(new Animated.Value(0));
  const [favorites, setFavorites] = useState<string[]>([]);

  // debounce amount
  const [amount, setAmount] = useState("");
  const [debouncedAmount] = useDebounce(amount, 1000);

  // Swap quote states
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [swapQuote, setSwapQuote] = useState<JupiterUltraOrderResponse | null>(
    null
  );
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const [chartType, setChartType] = useState<"line" | "candles">("line");
  const ticker = selectedStock?.symbol ?? "";
  const barData = useQuery({
    queryKey: ["stocks-bars", ticker],
    queryFn: () => client.stocks.bars.query({ ticker, barSize: 15 }),
    enabled: !!selectedStock,
  });
  const { width: screenWidth } = Dimensions.get("window");

  const tickerData = useQuery({
    queryKey: ["stocks-news", ticker],
    queryFn: () => client.stocks.news.query(ticker),
    enabled: !!selectedStock,
  });
  const news = tickerData.data?.news ?? [];

  // transform bars
  const [lineData, candles] = useMemo(() => {
    if (barData.failureReason) {
      console.error("Error fetching stocks:", barData.failureReason);
      Notifier.showNotification(
        getErrorAlert(barData.failureReason, "Error loading price data")
      );
    }

    const data = barData.data?.bars;
    if (!data || data.length === 0) {
      console.warn("No bar data available for the selected stock.");
      return [[], []];
    }

    const line = data.map((bar) => ({
      timestamp: bar.t,
      value: bar.c,
    }));

    const bar = data.map((bar) => ({
      timestamp: bar.t,
      open: bar.o,
      high: bar.h,
      low: bar.l,
      close: bar.c,
    }));
    return [line, bar];
  }, [barData.failureReason, barData.data]);

  // load favorites from AsyncStorage
  useEffect(() => {
    const loadFavorites = async () => {
      const storedFavorites = await AsyncStorage.getItem("favorites");
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    };
    loadFavorites();
  }, []);

  // load favorites on focus
  useFocusEffect(
    useCallback(() => {
      const loadFavorites = async () => {
        const storedFavorites = await AsyncStorage.getItem("favorites");
        if (storedFavorites) {
          setFavorites(JSON.parse(storedFavorites));
        }
      };
      loadFavorites();
    }, [])
  );

  // set selected stock based on URL parameter or first stock
  useEffect(() => {
    if (stocks.length > 0) {
      if (!selectedStock) {
        if (stockId) {
          // Find the stock with the matching ID from the URL parameters
          const stockFromParams = stocks.find((stock) => stock.id === stockId);
          if (stockFromParams) {
            setSelectedStock(stockFromParams);
          } else if (!selectedStock) {
            // Fallback to the first stock if the requested stock isn't found
            setSelectedStock(stocks[0]);
          }
        } else if (!selectedStock) {
          // If no stockId parameter, default to the first stock
          setSelectedStock(stocks[0]);
        }
      }
    }

    if (error) {
      console.error("Error fetching stocks:", error);
      Notifier.showNotification(getErrorAlert(error, "Error loading stocks"));
    }
  }, [stocks, stockId, error, selectedStock]);

  // Fetch quote when amount changes
  useEffect(() => {
    setQuoteError(null);
    setSwapQuote(null);
    fetchSwapQuote();
  }, [debouncedAmount]);

  const filteredStocks = stocks.filter((stock) => {
    const query = searchQuery.toLowerCase();
    return (
      stock.name.toLowerCase().includes(query) ||
      stock.symbol.toLowerCase().includes(query)
    );
  });

  const handleStockSelect = (stock: BaseAsset) => {
    Keyboard.dismiss();
    setSelectedStock(stock);
    setSearchQuery("");
    setShowResults(false);
  };

  const handleActionPress = (type: "buy" | "sell") => {
    setActionType(type);
    setActionModalVisible(true);
  };

  const closeActionModal = () => {
    setActionModalVisible(false);
    setAmount("");
    setSwapQuote(null);
    setQuoteError(null);
  };

  const fetchSwapQuote = async () => {
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
  };

  // Format price impact percentage for display
  const formatPriceImpact = (priceImpactPct: string | undefined) => {
    if (!priceImpactPct) return "0.00%";
    const impact = parseFloat(priceImpactPct);
    return `${impact > 0 ? "+" : ""}${(impact * 100).toFixed(2)}%`;
  };

  const handleAction = () => {
    if (!swapQuote || !selectedStock || !pubkey) {
      console.error("Cannot execute swap: missing required data");
      return;
    }

    console.log(`Executing swap: ${amount} ${selectedStock.symbol} -> USD`);
    console.log(
      `Quote details: Input: ${swapQuote.inAmount}, Output: ${swapQuote.outAmount}`
    );

    // Here you would implement the actual swap execution using JupiterUltraService.executeUltraSwap
    // For now, we'll just log the details and close the modal

    closeActionModal();

    // Show a success notification
    Notifier.showNotification({
      title: "Swap Initiated",
      description: `Swapping ${amount} ${selectedStock.symbol} to USD`,
      duration: 3000,
      showAnimationDuration: 300,
    });
  };

  const toggleFavorite = async (stockId: string) => {
    const updatedFavorites = favorites.includes(stockId)
      ? favorites.filter((id) => id !== stockId)
      : [...favorites, stockId];

    setFavorites(updatedFavorites);
    await AsyncStorage.setItem("favorites", JSON.stringify(updatedFavorites));
  };

  const isFavorite = (stockId: string) => favorites.includes(stockId);

  const renderStockItem = ({
    item,
    index,
  }: {
    item: BaseAsset;
    index: number;
  }) => (
    <TouchableOpacity
      style={[
        styles.stockItem,
        index === filteredStocks.length - 1 ? styles.lastStockItem : null,
      ]}
      onPress={() => handleStockSelect(item)}
    >
      <Image source={{ uri: item.icon }} style={styles.stockImage} />
      <View style={styles.stockTextContainer}>
        <Text style={styles.stockSymbol}>{item.symbol}</Text>
        <Text style={styles.stockFullName}>{item.name}</Text>
      </View>
    </TouchableOpacity>
  );

  const TabSection = ({ selectedTab }: { selectedTab: string }) => {
    if (selectedTab === "summary") {
      if (barData.isLoading) {
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ffffff" />
          </View>
        );
      }

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
                  (1 - selectedStock.stockData.price / selectedStock.usdPrice) *
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
            {selectedStock?.description || "No profile information available."}
          </Text>
        </View>
      );
    }
    return null;
  };

  const handleTabPress = (tab: string) => {
    setSelectedTab(tab);
    Animated.timing(tabAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      tabAnimation.setValue(0);
    });
  };

  const quoteOutput =
    swapQuote &&
    selectedStock &&
    JupiterUltraService.fromBaseUnits(
      swapQuote.outAmount,
      actionType === "buy" ? selectedStock.decimals : 6
    );

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
          <TextInput
            style={styles.modalInput}
            placeholder="Enter amount"
            placeholderTextColor="#888"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            autoFocus
          />

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
              disabled={!amount || isLoadingQuote || !!quoteError}
            >
              <Text style={styles.buyButtonText}>
                {actionType === "buy" ? "Buy" : "Sell"}
              </Text>
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
    marginBottom: 15,
    fontSize: 16,
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
});
