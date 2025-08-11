import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 350;

const pages = [
  {
    image: require('../assets/onboarding1.png'),
    infoImage: require('../assets/info1.png'),
    button: 'Next',
  },
  {
    image: require('../assets/onboarding2.png'),
    infoImage: require('../assets/info2.png'),
    button: 'Continue',
  },
  {
    image: require('../assets/onboarding3.png'),
    infoImage: require('../assets/info3.png'),
    button: 'Go',
  },
  {
    image: require('../assets/onboarding4.png'),
    infoImage: require('../assets/info4.png'),
    button: 'Start',
  },
];

const OnboardingScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [page, setPage] = useState(0);

  const translateX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (page < pages.length - 1) {
      Animated.timing(translateX, {
        toValue: -width,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        translateX.setValue(width);
        setPage((prev) => prev + 1);
        Animated.timing(translateX, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    } else {
      navigation.replace('MainTabs');
    }
  };

  const current = pages[page];

  return (
    <ImageBackground
      source={require('../assets/reathing_practice.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <Animated.View style={[styles.contentContainer, { transform: [{ translateX }] }]}>
        <Image source={current.image} style={styles.image} resizeMode="contain" />
        <Image source={current.infoImage} style={styles.infoImage} resizeMode="contain" />
        <TouchableOpacity onPress={handleNext}>
          <LinearGradient
            colors={['#CB9920', '#FCCB00', '#FDF3C3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>{current.button}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </ImageBackground>
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'space-between',
    width: width,
    height: height * 0.85,
    paddingTop: height * 0.08,
    paddingBottom: height * 0.04,
  },
  image: {

    width: isSmallDevice ? width * 0.62 : width * 0.8,
    height: isSmallDevice ? width * 0.62 : width * 0.8,

    maxHeight: isSmallDevice ? height * 0.35 : height * 0.5,
  },
  infoImage: {
    width: isSmallDevice ? width * 0.85 : width * 0.9,
    height: isSmallDevice ? height * 0.18 : height * 0.22,
    marginTop: 10,
    marginBottom: 10,
  },
  button: {
    width: width * 0.85,
    height: isSmallDevice ? height * 0.08 : height * 0.09,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  buttonText: {
    fontSize: isSmallDevice ? 18 : 22,
    fontWeight: 'bold',
    color: '#320303',
  },
});