import { BaseAsset } from "@/api/src/models";
import { Text } from "@/components/Themed";
import { StyleSheet, TouchableOpacity, View as RNView } from "react-native";

interface ActionButtonsProps {
  onBuyPress: () => void;
  onSellPress: () => void;
}

export default function ActionButtons({
  onBuyPress,
  onSellPress,
}: ActionButtonsProps) {
  return (
    <RNView style={styles.buttonContainer}>
      <TouchableOpacity
        style={[styles.actionButton, styles.buyButton]}
        onPress={onBuyPress}
      >
        <Text style={styles.buyButtonText}>Buy</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionButton, styles.sellButton]}
        onPress={onSellPress}
      >
        <Text style={styles.actionButtonText}>Sell</Text>
      </TouchableOpacity>
    </RNView>
  );
}

const styles = StyleSheet.create({
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
});
