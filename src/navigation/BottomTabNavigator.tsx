import React from 'react';
import {
  View,
  Image,
  StyleSheet,
  Platform,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';


import BreathingPracticeScreen from '../screens/BreathingPracticeScreen';
import LotusProgressScreen from '../screens/LotusProgressScreen';
import CalendarPagodaScreen from '../screens/CalendarPagodaScreen';
import SettingsScreen from '../screens/SettingsScreen';

const { width } = Dimensions.get('window');
const isSmallDevice = width < 350;
const Tab = createBottomTabNavigator();

const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  return (
    <View style={styles.tabBarContainer}>

      <Image
        source={require('../assets/panel_background.png')}
        style={styles.tabBarBackground}
        resizeMode="stretch"
      />

      <View style={styles.tabItemsContainer}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const label = route.name;

          const isFocused = state.index === index;

          const icon = (() => {
            switch (label) {
              case 'Practice':
                return require('../assets/breath.png');
              case 'Progress':
                return require('../assets/lotus.png');
              case 'Calendar':
                return require('../assets/calendar.png');
              case 'Settings':
                return require('../assets/settings.png');
              default:
                return null;
            }
          })();

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={label}
              accessibilityRole="button"
              onPress={onPress}
              style={styles.tabItem}
            >
              <Image
                source={icon}
                style={[
                  styles.icon,
                  { tintColor: isFocused ? '#FFD700' : '#FFFFFF' },
                ]}
                resizeMode="contain"
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Practice" component={BreathingPracticeScreen} />
      <Tab.Screen name="Progress" component={LotusProgressScreen} />
      <Tab.Screen name="Calendar" component={CalendarPagodaScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    height: isSmallDevice ? 95 : 115,
    width: width,
    position: 'absolute',
    bottom: isSmallDevice ? 20 : 30,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  tabBarBackground: {
    position: 'absolute',
    bottom: 0,
    width: isSmallDevice ? width * 0.95 : 368,
    height: isSmallDevice ? 70 : 90,
  },
  tabItemsContainer: {
    flexDirection: 'row',
    width: isSmallDevice ? width * 0.95 : 368,
    justifyContent: 'space-around',
    alignItems: 'center',
    height: isSmallDevice ? 60 : 80,
    marginBottom: Platform.OS === 'ios' ? (isSmallDevice ? 5 : 10) : (isSmallDevice ? 2 : 5),
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  icon: {
    width: isSmallDevice ? 24 : 30,
    height: isSmallDevice ? 24 : 30,
  },
});