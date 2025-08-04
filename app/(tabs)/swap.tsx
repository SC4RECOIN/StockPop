import { BaseAsset } from "@/api/src/models";
import { StyleSheet, ScrollView, Keyboard } from "react-native";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Notifier } from "react-native-notifier";
import { View } from "@/components/Themed";
import { useApiClient } from "@/components/useApiClient";
import { useQuery } from "@tanstack/react-query";
import { getErrorAlert } from "@/components/utils";
import { useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

// Import components
import SearchBar from "@/components/swap/SearchBar";
import StockHeader from "@/components/swap/StockHeader";
import TabBar from "@/components/swap/TabBar";
import ChartTab from "@/components/swap/ChartTab";
import NewsTab from "@/components/swap/NewsTab";
import ProfileTab from "@/components/swap/ProfileTab";
import ActionModal from "@/components/swap/ActionModal";
import ActionButtons from "@/components/swap/ActionButtons";

/**
 * Swap screen for trading stocks and ETFs
 */
export default function SwapScreen() {
  const { stockId } = useLocalSearchParams<{ stockId: string }>();
  const client = useApiClient();

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

  // State
  const [selectedStock, setSelectedStock] = useState<BaseAsset | null>(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [actionType, setActionType] = useState<"buy" | "sell" | null>(null);
  const [selectedTab, setSelectedTab] = useState("summary");
  const [favorites, setFavorites] = useState<string[]>([]);
  const ticker = selectedStock?.symbol ?? "";

  // Stock news
  const tickerData = useQuery({
    queryKey: ["stocks-news", ticker],
    queryFn: () => client.stocks.news.query(ticker),
    enabled: !!selectedStock,
  });

  // Load favorites from AsyncStorage
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

  // Set selected stock based on URL parameter or default to first stock
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

  // Update selected stock when URL parameter changes
  useEffect(() => {
    if (!stockId || stocks.length === 0) return;

    const stockFromParams = stocks.find((stock) => stock.id === stockId);
    if (stockFromParams) {
      setSelectedStock(stockFromParams);
    }
  }, [stockId, stocks]);

  const handleActionPress = useCallback((type: "buy" | "sell") => {
    setActionType(type);
    setActionModalVisible(true);
  }, []);

  // Handle stock selection from search results
  const handleStockSelect = useCallback((stock: BaseAsset) => {
    Keyboard.dismiss();
    setSelectedStock(stock);
  }, []);

  // Toggle favorite status for a stock
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

  return (
    <View style={styles.container}>
      <SearchBar
        stocks={stocks}
        onSelectStock={handleStockSelect}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
        selectedStock={selectedStock}
      />

      {selectedStock && <StockHeader selectedStock={selectedStock} />}

      <TabBar onTabChange={setSelectedTab} selectedTab={selectedTab} />

      <ScrollView style={styles.tabContentScrollView}>
        {selectedTab === "summary" && (
          <ChartTab selectedStock={selectedStock} />
        )}
        {selectedTab === "news" && (
          <NewsTab news={tickerData.data?.news ?? []} />
        )}
        {selectedTab === "profile" && (
          <ProfileTab selectedStock={selectedStock} />
        )}
      </ScrollView>

      <ActionButtons
        onBuyPress={() => handleActionPress("buy")}
        onSellPress={() => handleActionPress("sell")}
      />

      <ActionModal
        isVisible={actionModalVisible}
        onClose={() => setActionModalVisible(false)}
        actionType={actionType}
        selectedStock={selectedStock}
      />
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
  tabContentScrollView: {
    flex: 1,
  },
});
