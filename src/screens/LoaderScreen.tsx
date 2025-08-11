import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  ImageBackground,
  Image,
  Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App'; 

const { width, height } = Dimensions.get('window');

const LoaderScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    const timer = setTimeout(() => {
  navigation.replace('Onboarding');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  const spinnerHTML = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
        <style>
          html, body {
            margin: 0;
            padding: 0;
            background-color: transparent;
            overflow: visible;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100%;
            transform: scale(0.3);
          }
          .spinner {
            position: relative;
            width: 160px;
            height: 160px;
          }
          .spinner div {
            position: absolute;
            width: 50%;
            height: 150%;
            background: linear-gradient(#980909, #320303);
            transform-origin: center bottom;
            transform: rotate(calc(var(--rotation) * 1deg)) translateY(-40%);
            animation: spinner-fzua35 1s calc(var(--delay) * 1s) infinite ease;
          }
          .spinner div:nth-child(1) { --delay: 0.1; --rotation: 36; }
          .spinner div:nth-child(2) { --delay: 0.2; --rotation: 72; }
          .spinner div:nth-child(3) { --delay: 0.3; --rotation: 108; }
          .spinner div:nth-child(4) { --delay: 0.4; --rotation: 144; }
          .spinner div:nth-child(5) { --delay: 0.5; --rotation: 180; }
          .spinner div:nth-child(6) { --delay: 0.6; --rotation: 216; }
          .spinner div:nth-child(7) { --delay: 0.7; --rotation: 252; }
          .spinner div:nth-child(8) { --delay: 0.8; --rotation: 288; }
          .spinner div:nth-child(9) { --delay: 0.9; --rotation: 324; }
          .spinner div:nth-child(10) { --delay: 1; --rotation: 360; }

          @keyframes spinner-fzua35 {
            0%, 10%, 20%, 30%, 60%, 70%, 80%, 90%, 100% {
              transform: rotate(calc(var(--rotation) * 1deg)) translateY(-40%);
            }
            50% {
              transform: rotate(calc(var(--rotation) * 1deg)) translateY(-60%);
            }
          }
        </style>
      </head>
      <body>
        <div class="spinner">
          <div></div><div></div><div></div><div></div><div></div>
          <div></div><div></div><div></div><div></div><div></div>
        </div>
      </body>
    </html>
  `;

  return (
    <ImageBackground
      source={require('../assets/background.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.iconContainer}>
        <Image
          source={require('../assets/image_icon.png')}
          style={styles.icon}
          resizeMode="cover"
        />
      </View>

      <View style={styles.webviewContainer}>
        <WebView
          originWhitelist={['*']}
          source={{ html: spinnerHTML }}
          style={styles.webview}
          backgroundColor="transparent"
          scrollEnabled={false}
        />
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width,
    height,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 40,
  },
  iconContainer: {
    marginTop: 80,
  },
  icon: {
    width: 327,
    height: 327,
    borderRadius: 20,
    overflow: 'hidden',
  },
  webviewContainer: {
    width: 160,
    height: 160,
    marginBottom: 50,
    backgroundColor: 'transparent',
  },
  webview: {
    width: 160,
    height: 160,
    backgroundColor: 'transparent',
  },
});

export default LoaderScreen;
