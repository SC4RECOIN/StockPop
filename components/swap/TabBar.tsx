import { StyleSheet, TouchableOpacity, Animated } from "react-native";
import { useState, useCallback } from "react";

interface TabBarProps {
  onTabChange: (tab: string) => void;
  selectedTab: string;
}

export default function TabBar({ onTabChange, selectedTab }: TabBarProps) {
  const [tabAnimation] = useState(new Animated.Value(0));
  const tabs = ["summary", "news", "profile"];

  /**
   * Handle tab selection with animation
   */
  const handleTabPress = useCallback(
    (tab: string) => {
      onTabChange(tab);

      // Animate tab transition
      Animated.timing(tabAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start(() => {
        tabAnimation.setValue(0);
      });
    },
    [tabAnimation, onTabChange]
  );

  return (
    <Animated.View style={styles.tabContainer}>
      {tabs.map((tab) => (
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
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
});
