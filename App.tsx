import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoaderScreen from './src/screens/LoaderScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';

export type RootStackParamList = {
  Loader: undefined;
  Onboarding: undefined;
  MainTabs: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function App(): React.JSX.Element {
  return (
    <NavigationContainer>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <Stack.Navigator initialRouteName="Loader" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Loader" component={LoaderScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
