import { StyleSheet } from "react-native";
import { Text, View } from "@/components/Themed";
import { BaseAsset } from "@/api/src/models";

interface ProfileTabProps {
  selectedStock: BaseAsset | null;
}

export default function ProfileTab({ selectedStock }: ProfileTabProps) {
  if (!selectedStock) {
    return null;
  }

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

const styles = StyleSheet.create({
  tabContentContainer: {},
  tabContent: {
    color: "#FFFFFF",
    fontSize: 16,
    marginBottom: 5,
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
});
