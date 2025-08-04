import {
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  SectionList,
} from "react-native";
import { View, Text } from "@/components/Themed";
import Decimal from "decimal.js";
import { useQuery } from "@tanstack/react-query";
import { ApiTypes, useApiClient } from "@/components/useApiClient";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Notifier } from "react-native-notifier";
import { getErrorAlert } from "@/components/utils";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

// Types
type Pool = ApiTypes["stocks"]["tradable"]["pools"][number];
type StockItemProps = { item: Pool };
type SectionData = {
  title: string;
  data: Pool[];
};

/**
 * Discover screen showing all available stocks and ETFs
 */
export default function DiscoverScreen() {
  const router = useRouter();
  const client = useApiClient();

  // Query all tradable stocks
  const { data, isLoading, error } = useQuery({
    queryKey: ["stocks"],
    queryFn: () => client.stocks.tradable.query(),
  });

  // State for user favorites
  const [favorites, setFavorites] = useState<string[]>([]);

  /**
   * Load favorites on initial render
   */
  useEffect(() => {
    loadFavorites();
  }, []);

  /**
   * Reload favorites when screen is focused
   */
  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  /**
   * Handle API errors
   */
  useEffect(() => {
    if (error) {
      console.error("Error fetching stocks:", error);
      Notifier.showNotification(getErrorAlert(error, "Error loading stocks"));
    }
  }, [error]);

  /**
   * Load favorites from storage
   */
  const loadFavorites = async () => {
    const storedFavorites = await AsyncStorage.getItem("favorites");
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites));
    }
  };

  /**
   * Toggle stock favorite status
   */
  const toggleFavorite = async (stockId: string) => {
    const updatedFavorites = favorites.includes(stockId)
      ? favorites.filter((id) => id !== stockId)
      : [...favorites, stockId];

    setFavorites(updatedFavorites);
    await AsyncStorage.setItem("favorites", JSON.stringify(updatedFavorites));
  };

  /**
   * Check if stock is favorited
   */
  const isFavorite = useCallback(
    (stockId: string) => favorites.includes(stockId),
    [favorites]
  );

  /**
   * Format large numbers with abbreviations
   */
  const formatter = useMemo(() => {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      compactDisplay: "short",
    }).format;
  }, []);

  /**
   * Handle stock selection
   */
  const handleStockPress = useCallback(
    (stockId: string) => {
      router.push({
        pathname: "/(tabs)/swap",
        params: { stockId },
      });
    },
    [router]
  );

  /**
   * Render individual stock item
   */
  const renderStockItem = useCallback(
    ({ item }: StockItemProps) => {
      const asset = item.baseAsset;
      const priceChange = new Decimal(asset.stats24h?.priceChange ?? 0)
        .div(asset.usdPrice)
        .mul(100);

      const isStockFavorite = isFavorite(asset.id);

      return (
        <TouchableOpacity
          style={styles.stockItem}
          onPress={() => handleStockPress(asset.id)}
        >
          <Image source={{ uri: asset.icon }} style={styles.stockImage} />

          <View style={styles.stockInfo}>
            <Text style={styles.ticker}>{asset.symbol}</Text>
            <Text style={styles.name}>{asset.name}</Text>
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.price}>
              ${asset.stockData.price.toFixed(2)}
            </Text>
            <Text
              style={[
                styles.change,
                { color: priceChange.isPositive() ? "#4CAF50" : "#F44336" },
              ]}
            >
              {priceChange.toFixed(2)}%
            </Text>
          </View>

          <View style={styles.mcapInfo}>
            <Text style={styles.ticker}>{formatter(asset.stockData.mcap)}</Text>
            <Text style={styles.name}>{formatter(asset.mcap)}</Text>
          </View>

          <TouchableOpacity
            onPress={() => toggleFavorite(asset.id)}
            style={styles.favoriteButton}
          >
            <Ionicons
              name={isStockFavorite ? "star" : "star-outline"}
              size={20}
              color={isStockFavorite ? "#FFFFFF" : "#666"}
              style={styles.favoriteIcon}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      );
    },
    [isFavorite, handleStockPress, formatter, toggleFavorite]
  );

  /**
   * Sort and organize data into sections
   */
  const sectionData = useMemo(() => {
    if (!data?.pools) return [];

    // Extract and sort data by category
    const favoritesData = data.pools
      .filter((pool) => favorites.includes(pool.baseAsset.id))
      .sort((a, b) => b.baseAsset.stockData.mcap - a.baseAsset.stockData.mcap);

    const stocksData = data.pools
      .filter(
        (pool) =>
          pool.baseAsset.category === "stock" &&
          !favorites.includes(pool.baseAsset.id)
      )
      .sort((a, b) => b.baseAsset.stockData.mcap - a.baseAsset.stockData.mcap);

    const etfsData = data.pools
      .filter(
        (pool) =>
          pool.baseAsset.category === "etf" &&
          !favorites.includes(pool.baseAsset.id)
      )
      .sort((a, b) => b.baseAsset.stockData.mcap - a.baseAsset.stockData.mcap);

    // Create section list data structure
    return [
      { title: "Favorites", data: favoritesData },
      { title: "Stocks", data: stocksData },
      { title: "ETFs", data: etfsData },
    ];
  }, [data?.pools, favorites]);

  /**
   * Render section headers
   */
  const renderSectionHeader = useCallback(
    ({ section: { title } }: { section: SectionData }) => (
      <Text style={styles.sectionHeader}>{title}</Text>
    ),
    []
  );

  return (
    <View style={styles.container}>
      {isLoading && !error ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Loading stocks...</Text>
        </View>
      ) : (
        <SectionList
          sections={sectionData}
          keyExtractor={(item) => item.id}
          renderItem={renderStockItem}
          renderSectionHeader={renderSectionHeader}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

/**
 * Discover screen styles
 */
const styles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
    paddingLeft: 15,
    paddingRight: 15,
    backgroundColor: "black",
  },
  listContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Typography
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
  },

  // Stock Item
  stockItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  stockImage: {
    borderRadius: 20,
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

  // Price and Market Cap
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
  mcapInfo: {
    minWidth: 40,
  },

  // Favorites
  favoriteIcon: {
    marginLeft: 10,
  },
  favoriteButton: {
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
  },
});
