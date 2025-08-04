import { Image, StyleSheet } from "react-native";
import { Text, View } from "@/components/Themed";
import { BaseAsset } from "@/api/src/models";

interface StockHeaderProps {
  selectedStock: BaseAsset | null;
}

export default function StockHeader({ selectedStock }: StockHeaderProps) {
  if (!selectedStock) return null;

  return (
    <View style={styles.stockDetails}>
      <View style={styles.stockHeader}>
        <View style={styles.stockHeaderLeft}>
          <Image
            source={{ uri: selectedStock.icon }}
            style={styles.stockImageLarge}
          />
          <View>
            <Text>{selectedStock.name.replace("xStock", "")}</Text>
            <Text style={styles.stockSymbolLarge}>{selectedStock.symbol}</Text>
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
  );
}

const styles = StyleSheet.create({
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
});
