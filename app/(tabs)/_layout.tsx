import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import { Pressable } from 'react-native';
import Colors from '@/constants/Colors';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useWallet } from '@/components/useWallet';


// https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: 0 }} {...props} />;
}

export default function TabLayout() {
  const { connected } = useWallet();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors['dark'].tint,
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
        headerStyle: {
          backgroundColor: Colors['dark'].background,
        },
        headerTitleAlign: 'center',
        tabBarStyle: {
          backgroundColor: Colors['dark'].background,
          borderTopWidth: 1,
          borderTopColor: Colors['dark'].tabIconDefault,
        },
        tabBarShowLabel: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabBarIcon name="area-chart" color={color} />,
          headerShown: useClientOnlyValue(false, connected),
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable>
                {({ pressed }) => (
                  <FontAwesome
                    name="info-circle"
                    size={25}
                    color={Colors['dark'].text}
                    style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color }) => <TabBarIcon name="search" color={color} />,
        }}
      />
      <Tabs.Screen
        name="swap"
        options={{
          title: 'Swap',
          tabBarIcon: ({ color }) => <TabBarIcon name="retweet" color={color} />,
        }}
      />
    </Tabs>
  );
}
