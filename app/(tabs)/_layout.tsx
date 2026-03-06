import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import HomeScreen from './index';
import SessionScreen from './session';
import StatsScreen from './stats';
import ProfileScreen from './profile';

const Tab = createMaterialTopTabNavigator();

const TAB_BAR_BASE_HEIGHT = 100;

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === 'dark';
  const tabBarBg = isDark ? BrandColors.slate900 : BrandColors.white;
  const tabBarBorder = isDark ? BrandColors.slate800 : BrandColors.border;
  const tabBarInactive = isDark ? BrandColors.slate400 : BrandColors.slate;
  const tabBarPaddingBottom = 24 + insets.bottom;
  const tabBarHeight = TAB_BAR_BASE_HEIGHT + insets.bottom;

  return (
    <Tab.Navigator
      tabBarPosition="bottom"
      screenOptions={{
        swipeEnabled: true,
        animationEnabled: true,
        tabBarActiveTintColor: BrandColors.performanceAccent,
        tabBarInactiveTintColor: tabBarInactive,
        tabBarStyle: {
          backgroundColor: tabBarBg,
          borderTopWidth: 1,
          borderTopColor: tabBarBorder,
          paddingTop: 16,
          paddingBottom: insets.bottom + 16,
          height: tabBarHeight,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginTop: 4,
        },
        tabBarIndicatorStyle: {
          backgroundColor: BrandColors.performanceAccent,
          height: 3,
          borderRadius: 1.5,
          position: 'absolute',
          top: 0,
        },
        tabBarShowIcon: true,
        tabBarShowLabel: true,
        tabBarItemStyle: {
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => <MaterialIcons name="home" size={26} color={color} />,
        }}
      />
      <Tab.Screen
        name="History"
        component={SessionScreen}
        options={{
          tabBarIcon: ({ color }) => <MaterialIcons name="history" size={26} color={color} />,
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          tabBarIcon: ({ color }) => <MaterialIcons name="bar-chart" size={26} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => <MaterialIcons name="person" size={26} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
