import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useState, useCallback, useMemo } from "react";
import { Text, View } from "@/components/Themed";
import { Ionicons } from "@expo/vector-icons";
import { BaseAsset } from "@/api/src/models";

interface SearchBarProps {
  stocks: BaseAsset[];
  onSelectStock: (stock: BaseAsset) => void;
  favorites: string[];
  toggleFavorite: (stockId: string) => void;
  selectedStock: BaseAsset | null;
}

export default function SearchBar({
  stocks,
  onSelectStock,
  favorites,
  toggleFavorite,
  selectedStock,
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);

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
  const handleStockSelect = useCallback(
    (stock: BaseAsset) => {
      Keyboard.dismiss();
      onSelectStock(stock);
      setSearchQuery("");
      setShowResults(false);
    },
    [onSelectStock]
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

  return (
    <>
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
    </>
  );
}

const styles = StyleSheet.create({
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
  searchBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
    backgroundColor: "rgba(0,0,0,0.1)",
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
  stockSymbol: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  stockFullName: {
    color: "#999",
    fontSize: 14,
  },
  favoriteIcon: {
    marginLeft: 10,
  },
});
