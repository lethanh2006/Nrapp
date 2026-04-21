/**
 * TAB LAYOUT - Layout cho nhóm màn hình có tab bar
 *
 * Thư mục (tabs) = nhóm route dùng tab bar ở dưới màn hình
 * - index.tsx  → Tab "Home"   (route: /)
 * - explore.tsx → Tab "Explore" (route: /explore)
 *
 * Tạo tab mới: thêm file .tsx trong (tabs)/ rồi thêm <Tabs.Screen> bên dưới
 */
import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      {/* index = file index.tsx, route / */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
