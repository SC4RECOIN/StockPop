import React from "react";
import { Octicons } from "@react-native-vector-icons/octicons";
import { Link, Tabs } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  View,
  Text,
  StyleSheet,
} from "react-native";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { PlatformPressable } from "@react-navigation/elements";
import { usePrivy } from "@privy-io/expo";

export default function TabLayout() {
  const { isReady } = usePrivy();

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#fff",
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
        headerStyle: {
          backgroundColor: "#000",
        },
        headerTitleAlign: "center",
        tabBarStyle: {
          backgroundColor: "#0f0f0f",
          borderTopWidth: 1,
          borderTopColor: "#ccc",
          paddingTop: 5,
        },
        tabBarShowLabel: false,
        tabBarButton: (props) => (
          <PlatformPressable
            {...props}
            android_ripple={{ color: "transparent" }} // Disables the ripple effect for Android
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Octicons name="home" color={color} size={20} />
          ),
          headerShown: useClientOnlyValue(false, true),
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable>
                <Octicons
                  name="info"
                  color="white"
                  size={20}
                  style={{ marginRight: 15 }}
                />
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: "Discover",
          tabBarIcon: ({ color }) => (
            <Octicons name="search" color={color} size={20} />
          ),
        }}
      />
      <Tabs.Screen
        name="swap"
        options={{
          tabBarIcon: ({ color }) => (
            <Octicons name="arrow-switch" color={color} size={20} />
          ),
          headerShown: false,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
});
