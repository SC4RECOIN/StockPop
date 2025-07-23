import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Octicons } from '@react-native-vector-icons/octicons';
import { Link, Tabs } from 'expo-router';
import { Pressable } from 'react-native';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useWallet } from '@/components/useWallet';
import { PlatformPressable } from '@react-navigation/elements';


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
        tabBarActiveTintColor: '#fff',
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
        headerStyle: {
          backgroundColor: '#000',
        },
        headerTitleAlign: 'center',
        tabBarStyle: {
          backgroundColor: '#0f0f0f',
          borderTopWidth: 1,
          borderTopColor: '#ccc',
          paddingTop: 5,
        },
        tabBarShowLabel: false,
        tabBarButton: (props) => (
          <PlatformPressable
            {...props}
            android_ripple={{ color: 'transparent' }}  // Disables the ripple effect for Android
          />
        ),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Octicons name="home" color={color} size={20} />,
          headerShown: useClientOnlyValue(false, connected),
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable>
                {({ pressed }) => (
                  <FontAwesome
                    name="info-circle"
                    size={25}
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
          tabBarIcon: ({ color }) => <Octicons name="search" color={color} size={20} />,
        }}
      />
      <Tabs.Screen
        name="swap"
        options={{
          tabBarIcon: ({ color }) => <Octicons name="arrow-switch" color={color} size={20} />,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
