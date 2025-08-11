import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Image,
  ImageBackground,
  TouchableOpacity,
  Dimensions,
  Text,
  Animated,
  Share,
  Alert,
  ScrollView,
  Easing,
  Platform,
  DeviceEventEmitter,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Sound from 'react-native-sound';

Sound.setCategory('Playback', true); 
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const INITIAL_SECONDS = 300; 

type Category = 'calm' | 'energy' | 'focus';

const CATEGORY_CARDS = [
  require('../assets/calm.png'),
  require('../assets/energy.png'),
  require('../assets/focus.png'),
];

const categoryLabels: Category[] = ['calm', 'energy', 'focus'];

const phrases: Record<Category, string[]> = {
  energy: [
    'Breathe as if you are lighting a fire.',
    'Feel the strength in your chest.',
    'Each breath brings energy.',
    'Exhale fatigue, let in strength.',
    'Your body is waking up.',
    'Breath by breath, you are becoming stronger.',
    'The fire within you shines brighter.',
  ],
  focus: [
    'Focus on your breath.',
    'All thoughts converge to one point.',
    'Every inhale is clarity, every exhale is peace.',
    'Your mind is bright and clear.',
    'You are in control of every breath.',
    'Feel the ray of light within you.',
    'Your attention becomes unwavering.',
  ],
  calm: [
    'Release the tension from your shoulders.',
    'Your breath is like a wave.',
    'Inhale peace, exhale fatigue.',
    'Allow your body to relax.',
    'Each breath makes you lighter.',
    'Feel your mind becoming quiet.',
    'You are in a safe place.',
  ],
};

const stepTexts: Record<
  Category,
  { step1: string; step2: string; title: string }
> = {
  calm: {
    title: 'Breath of Peace',
    step1:
      'Breath of Peace\nSit comfortably. Release the tension in your shoulders… Close your eyes.\nBreathe in slowly through your nose… One… two… three… four.\nHold your breath… one… two.\nNow breathe out slowly through your mouth… let go of everything… one… two… three… four… five… six.',
    step2:
      'Imagine a gentle wave rising on your inhale… and slowly falling on your exhale.\nFeel your heart become calm and your thoughts quiet. Repeat this for a few minutes…',
  },
  energy: {
    title: 'Breath of Energy',
    step1:
      'Breath of Energy\nSit or stand up straight. Ready to awaken your power?\nTake a quick deep breath through your nose—one… two…\nNow exhale sharply through your mouth—one… two.\nThe rhythm of inhale-exhale, inhale-exhale… Like lighting a fire in your heart.\nFeel the energy awakening throughout your body with each breath.',
    step2:
      'Do 20 of these rhythms, then take a deep breath… hold for five seconds… and exhale slowly.\nYou are filled with strength.',
  },
  focus: {
    title: 'Focus Breathing',
    step1:
      'Focus Breathing\nSit straight. Focus your gaze on one point in front of you.\nTake a deep breath through your nose—one… two… three… four… five.\nHold your breath—one… two… three… four… five.\nImagine a beam of light gathering in the center of your forehead, making your mind clear.\nExhale slowly through your mouth—one… two… three… four… five.',
    step2:
      'With each cycle, the beam becomes brighter and your mind sharper.\nRepeat several times and feel complete clarity',
  },
};

type DayActivities = Partial<Record<Category, string>>;

const todayKey = () => {
  const d = new Date();
  return `activities:${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};
const hmsToSec = (t: string) => {
  const [h = '0', m = '0', s = '0'] = t.split(':');
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
};
const secToHMS = (sec: number) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

async function savePracticeToStorage(category: Category, seconds: number) {
  const key = todayKey();
  const prevStr = await AsyncStorage.getItem(key);
  const prev: DayActivities = prevStr ? JSON.parse(prevStr) : {};
  const existed = prev[category] ? hmsToSec(prev[category] as string) : 0;
  const merged: DayActivities = { ...prev, [category]: secToHMS(existed + seconds) };
  await AsyncStorage.setItem(key, JSON.stringify(merged));
}

const ASSETS = {
  confetti: require('../assets/image22.png'),
  back_home: require('../assets/back_home.png'),
  share: require('../assets/share.png'),
};

const BreathingPracticeScreen = () => {

  const [page, setPage] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [currentIndex, setCurrentIndex] = useState(1);
  const [practiceStep, setPracticeStep] = useState<1 | 2 | 3>(1);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [timeLeft, setTimeLeft] = useState(INITIAL_SECONDS);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [randomPhrase, setRandomPhrase] = useState('');
  const [soundLoaded, setSoundLoaded] = useState(false);
  const [lastResultSec, setLastResultSec] = useState<number>(INITIAL_SECONDS);
  const [musicAllowed, setMusicAllowed] = useState(true); 


  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const spinValue = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);
  const bgmRef = useRef<Sound | null>(null);
  const savedRef = useRef(false); 
  const confettiSpin = useRef(new Animated.Value(0)).current;

  const isFocused = useIsFocused();

  const getImageAt = useCallback(
    (offset: number) => {
      const idx = (currentIndex + offset + CATEGORY_CARDS.length) % CATEGORY_CARDS.length;
      return CATEGORY_CARDS[idx];
    },
    [currentIndex]
  );

  const getTopImageForCategory = useCallback(() => {
    if (selectedCategory === 'calm') return require('../assets/im_ener3.png');
    if (selectedCategory === 'focus') return require('../assets/im_ener2.png');
    return require('../assets/im_ener.png');
  }, [selectedCategory]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const animateContent = useCallback(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const startSpin = useCallback(() => {
    spinValue.setValue(0);
    loopRef.current = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1600,
        easing: Easing.linear,
        useNativeDriver: true,
        isInteraction: false,
      })
    );
    loopRef.current.start();
  }, [spinValue]);

  const stopSpin = useCallback(() => {
    loopRef.current?.stop();
    loopRef.current = null;
    spinValue.stopAnimation();
  }, [spinValue]);

  const startConfettiSpin = useCallback(() => {
    confettiSpin.setValue(0);
    Animated.loop(
      Animated.timing(confettiSpin, {
        toValue: 1,
        duration: 5000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [confettiSpin]);
  
  const playBgm = useCallback(() => {
    if (bgmRef.current) {
      bgmRef.current.play((success) => {
        if (!success) {
          console.log('Playback failed due to audio decoding errors.');
          bgmRef.current?.reset();
        }
      });
    }
  }, []);

  const pauseBgm = useCallback(() => {
    bgmRef.current?.pause();
  }, []);

  const stopBgm = useCallback(() => {
    bgmRef.current?.stop();
    bgmRef.current?.setCurrentTime(0);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsTimerRunning(false);
    pauseBgm();
  }, [pauseBgm]);

  const resumeTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsTimerRunning(true);

    if (soundLoaded && musicAllowed) { 
      playBgm();
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
     
          if (!savedRef.current && selectedCategory) {
            savedRef.current = true;
            setLastResultSec(INITIAL_SECONDS);
         
            savePracticeToStorage(selectedCategory, INITIAL_SECONDS).catch(() => {});
          }
          if (timerRef.current) clearInterval(timerRef.current);
          setIsTimerRunning(false);
          setPage(5);
          stopBgm();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [playBgm, stopBgm, soundLoaded, selectedCategory, musicAllowed]); 

  const startNewTimer = useCallback(() => {
    setPage(4);
    if (selectedCategory) {
      const list = phrases[selectedCategory];
      setRandomPhrase(list[Math.floor(Math.random() * list.length)]);
    }
    setTimeLeft(INITIAL_SECONDS);
    savedRef.current = false; 
    resumeTimer();
  }, [selectedCategory, resumeTimer]);

  const handleChoose = useCallback(() => {
    const category = categoryLabels[currentIndex];
    setSelectedCategory(category);
    setPracticeStep(1);
    setPage(3);
  }, [currentIndex]);

  const handleClose = useCallback(() => {
    stopTimer();
    setIsPopupVisible(true);
  }, [stopTimer]);

  const handleYes = useCallback(() => {
  
    setIsPopupVisible(false);
    stopBgm();
    setPage(3);
  }, [stopBgm]);

  const handleNo = useCallback(() => {
    setIsPopupVisible(false);
    resumeTimer();
  }, [resumeTimer]);

  const handleShare = async () => {
    try {
      await Share.share({
        message:
          `I just completed a ${formatTime(lastResultSec)} breathing practice! You can do it too with this app!`,
      });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  useEffect(() => {
    if (page !== 3) return;
    setPracticeStep(1);
  }, [page]);

  useEffect(() => {
    const s = new Sound('breathe.mp3', Sound.MAIN_BUNDLE, (err) => {
      if (err) {
        console.log('Sound load error', err);
        setSoundLoaded(false);
        return;
      }
      s.setNumberOfLoops(-1);
      s.setVolume(0.6);
      bgmRef.current = s;
      setSoundLoaded(true);
    });

    return () => {
      bgmRef.current?.stop();
      bgmRef.current?.release();
      bgmRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (isFocused) {
      setPage(1);
      stopTimer();
      stopBgm();
      animateContent();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isFocused, animateContent, stopBgm, stopTimer]);

  useEffect(() => {
    animateContent();
  }, [page, animateContent]);

  useEffect(() => {
    if (page === 4 && isTimerRunning) startSpin();
    else stopSpin();
    return () => stopSpin();
  }, [page, isTimerRunning, startSpin, stopSpin]);
  
  useEffect(() => {
    if (page === 5) {
      startConfettiSpin();
    }
  }, [page, startConfettiSpin]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);
  
  const MUSIC_KEY = 'settings:musicEnabled';
  useEffect(() => {
    let sub: { remove: () => void } | null = null;

    (async () => {
      const m = await AsyncStorage.getItem(MUSIC_KEY);
      setMusicAllowed(m !== '0'); 
    })();

    sub = DeviceEventEmitter.addListener('settings:musicToggled', ({ enabled }) => {
      setMusicAllowed(enabled);
      if (!enabled) {
        pauseBgm(); 
      } else if (isTimerRunning && soundLoaded) {
        playBgm(); 
      }
    });

    return () => sub && sub.remove();
  }, [isTimerRunning, soundLoaded, playBgm, pauseBgm]);

  const renderPage = () => {
    const rot = confettiSpin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

    switch (page) {
      case 1:
        return (
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <Animated.View
              style={[styles.animatedContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
            >
              <Image source={require('../assets/title_picture.png')} style={styles.titleImage} resizeMode="contain" />
              <Image source={require('../assets/image_hotoroom.png')} style={styles.hotoroomImage} resizeMode="contain" />
              <TouchableOpacity style={styles.buttonWrapper} onPress={() => setPage(2)}>
                <Image source={require('../assets/start_practice.png')} style={styles.startButton} resizeMode="contain" />
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        );

      case 2:
        return (
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <Animated.View
              style={[styles.pageContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
            >
              <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => setPage(1)}>
                  <Image source={require('../assets/back_button.png')} style={styles.backButton} resizeMode="contain" />
                </TouchableOpacity>
                <Image source={require('../assets/title_picture.png')} style={styles.titleImageSecond} resizeMode="contain" />
              </View>
              <Image source={require('../assets/ima_node.png')} style={styles.nodeImage} resizeMode="contain" />
              <View style={styles.carouselContainer}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setCurrentIndex((prev) => (prev - 1 + CATEGORY_CARDS.length) % CATEGORY_CARDS.length)}
                >
                  <Image source={getImageAt(-1)} style={styles.sideImage} />
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.9} style={styles.centerImageWrapper}>
                  <Image source={getImageAt(0)} style={styles.centerImage} />
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setCurrentIndex((prev) => (prev + 1) % CATEGORY_CARDS.length)}
                >
                  <Image source={getImageAt(1)} style={styles.sideImage} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.choseButtonWrapper}
                onPress={handleChoose}
              >
                <Image source={require('../assets/chose.png')} style={styles.choseButton} resizeMode="contain" />
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        );

      case 3:
        if (!selectedCategory) return null;
        return (
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <Animated.View
              style={[styles.pageContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
            >
              <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => setPage(2)}>
                  <Image source={require('../assets/back_button.png')} style={styles.backButton} resizeMode="contain" />
                </TouchableOpacity>
                <Image source={require('../assets/title_picture.png')} style={styles.titleImageSecond} resizeMode="contain" />
              </View>
              <Image source={getTopImageForCategory()} style={styles.topCategoryImage} resizeMode="contain" />
              <View style={styles.practiceBox}>
                <Text style={styles.stepText}>{practiceStep}/3</Text>
                <Image source={require('../assets/image_hotoroom.png')} style={styles.practiceInnerImage} resizeMode="contain" />
                <View style={styles.scrollableTextContainer}>
                  <ScrollView contentContainerStyle={styles.scrollContent}>
                    {practiceStep === 1 && (
                      <Text style={styles.instructionText}>{stepTexts[selectedCategory].step1}</Text>
                    )}
                    {practiceStep === 2 && (
                      <Text style={styles.instructionText}>{stepTexts[selectedCategory].step2}</Text>
                    )}
                    {practiceStep === 3 && (
                      <View style={styles.timerArea}>
                        <Text style={styles.timerLabel}>Set a timer:</Text>
                        <View style={styles.timerBox}>
                          <Image source={require('../assets/clock.png')} style={styles.timerIcon} resizeMode="contain" />
                          <Text style={styles.timerText}>5:00</Text>
                        </View>
                      </View>
                    )}
                  </ScrollView>
                </View>

                {practiceStep !== 3 ? (
                  <TouchableOpacity style={styles.nextButton} onPress={() => setPracticeStep((prev) => (prev === 1 ? 2 : 3))}>
                    <Image source={require('../assets/next.png')} style={styles.nextImage} resizeMode="contain" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.startButtonTimer} onPress={startNewTimer}>
                    <Image source={require('../assets/start.png')} style={styles.startButtonImage} resizeMode="contain" />
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          </ScrollView>
        );

      case 4:
        if (!selectedCategory) return null;
        return (
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <Animated.View
              style={[styles.pageContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
            >
              <View style={styles.headerRow}>
                {isTimerRunning ? (
                  <TouchableOpacity onPress={handleClose}>
                    <Image source={require('../assets/close.png')} style={styles.backButton} resizeMode="contain" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={() => setPage(3)}>
                    <Image source={require('../assets/back_button.png')} style={styles.backButton} resizeMode="contain" />
                  </TouchableOpacity>
                )}
                <Image source={require('../assets/title_picture.png')} style={styles.titleImageSecond} resizeMode="contain" />
              </View>
              <View style={styles.phraseBox}>
                <Image source={require('../assets/image_hotoroom.png')} style={styles.phraseImage} resizeMode="contain" />
                <Text style={styles.phraseText}>{randomPhrase}</Text>
              </View>
              <View style={styles.timerBoxOuter}>
                <View style={styles.loadingCircleContainer}>
                  <View style={styles.loadingCircleBackground} />
                  <Animated.View
                    renderToHardwareTextureAndroid
                    style={[
                      styles.loadingCircleForeground,
                      {
                        transform: [
                          {
                            rotate: spinValue.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0deg', '360deg'],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                </View>
                <Text style={styles.timerCount}>{formatTime(timeLeft)}</Text>
              </View>
              <View style={styles.timerButtonsContainer}>
                {isTimerRunning ? (
                  <TouchableOpacity onPress={stopTimer}>
                    <Image source={require('../assets/stop.png')} style={styles.controlButton} resizeMode="contain" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={resumeTimer}>
                    <Image source={require('../assets/start.png')} style={styles.controlButton} resizeMode="contain" />
                  </TouchableOpacity>
                )}
              </View>
              {isPopupVisible && (
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Are you sure you want to end the internship?</Text>
                    <Text style={styles.modalText}>If so, your progress will not be saved</Text>
                    <View style={styles.modalButtonsContainer}>
                      <TouchableOpacity onPress={handleYes}>
                        <Image source={require('../assets/yes.png')} style={styles.modalButton} resizeMode="contain" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleNo}>
                        <Image source={require('../assets/no.png')} style={styles.modalButton} resizeMode="contain" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </Animated.View>
          </ScrollView>
        );

      case 5:
        return (
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <Animated.View
              style={[styles.pageContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
            >
              <Image source={require('../assets/title_picture.png')} style={styles.titleImageFinal} resizeMode="contain" />
              <View style={styles.hotoroomImageFinalWrapper}>
                <Image source={require('../assets/image_hotoroom.png')} style={styles.hotoroomImageFinal} resizeMode="contain" />
                <Animated.View style={[styles.confettiRing, { transform: [{ rotate: rot }] }]}>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <Image
                      key={i}
                      source={ASSETS.confetti}
                      style={[
                        styles.confettiDot,
                        { transform: [{ rotate: `${i * 30}deg` }, { translateY: -180 }] },
                      ]}
                    />
                  ))}
                </Animated.View>
              </View>
              <View style={styles.finalBox}>
                <Text style={styles.finalTitle}>Congratulations on successfully completing the internship.</Text>
                <Text style={styles.finalResult}>Your result: {formatTime(lastResultSec)} minutes</Text>
                <View style={styles.finalButtonsContainer}>
                  <TouchableOpacity onPress={() => setPage(1)} activeOpacity={0.9}>
                    <Image source={ASSETS.back_home} style={styles.finalButtonImage} resizeMode="contain" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleShare} activeOpacity={0.9}>
                    <Image source={ASSETS.share} style={styles.finalButtonImage} resizeMode="contain" />
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </ScrollView>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.safeArea}>
      <ImageBackground
        source={require('../assets/reathing_practice.png')} 
        style={styles.background}
        resizeMode="cover"
      >
        <SafeAreaView style={{ flex: 1 }}>
          {renderPage()}
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
};


export default BreathingPracticeScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  background: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
  },
  scrollViewContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: screenHeight * 0.05,
  },
  animatedContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  pageContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },

  titleImage: {
    width: screenWidth * 0.92,
    height: screenHeight * 0.12,
    marginTop: screenHeight * 0.08,
  },
  hotoroomImage: {
    width: screenWidth * 0.7,
    height: screenHeight * 0.45,
    marginTop: screenHeight * 0.02,
  },
  buttonWrapper: {
    marginTop: screenHeight * 0.03,
  },
  startButton: {
    width: screenWidth * 0.65,
    height: screenHeight * 0.08,
  },

  headerRow: {
    flexDirection: 'row',
    width: '100%',
    marginTop: screenHeight * 0.05,
    paddingHorizontal: screenWidth * 0.05,
    alignItems: 'center',
  },
  backButton: {
    width: screenWidth * 0.18,
    height: screenHeight * 0.12,
  },
  titleImageSecond: {
    width: screenWidth * 0.7,
    height: screenHeight * 0.12,
    marginLeft: screenWidth * 0.02,
  },

  nodeImage: {
    width: screenWidth * 0.85,
    height: screenHeight * 0.18,
    marginTop: screenHeight * 0.02,
    marginBottom: screenHeight * 0.02,
  },
  carouselContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: screenHeight * 0.22,
    width: '100%',
    paddingHorizontal: screenWidth * 0.05,
  },
  sideImage: {
    width: screenWidth * 0.3,
    height: screenHeight * 0.2,
    opacity: 0.6,
  },
  centerImageWrapper: {
    marginHorizontal: screenWidth * 0.02,
    transform: [{ scale: 1.15 }],
  },
  centerImage: {
    width: screenWidth * 0.3,
    height: screenHeight * 0.2,
  },
  choseButtonWrapper: {
    marginTop: screenHeight * 0.02,
  },
  choseButton: {
    width: screenWidth * 0.6,
    height: screenHeight * 0.09,
  },

  topCategoryImage: {
    width: screenWidth * 0.85,
    height: screenHeight * 0.18,
    marginTop: screenHeight * 0.02,
    marginBottom: screenHeight * 0.02,
  },
  practiceBox: {
    width: screenWidth * 0.85,
    height: screenHeight * 0.380,
    backgroundColor: '#980909',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FCCB00',
    paddingTop: screenHeight * 0.01,
    paddingHorizontal: screenWidth * 0.04,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepText: {
    alignSelf: 'flex-end',
    color: '#fff',
    fontSize: screenWidth * 0.04,
    fontWeight: 'bold',
    marginBottom: screenHeight * 0.005,
    marginRight: screenWidth * 0.01,
  },
  practiceInnerImage: {
    width: screenWidth * 0.2,
    height: screenHeight * 0.1,
    marginTop: -screenHeight * 0.025,
    marginBottom: screenHeight * 0.01,
  },
  scrollableTextContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: screenWidth * 0.02,
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  instructionText: {
    color: '#fff',
    fontSize: screenWidth * 0.035,
    textAlign: 'center',
  },
  nextButton: {
    marginBottom: screenHeight * 0.02,
  },
  nextImage: {
    width: screenWidth * 0.45,
    height: screenHeight * 0.06,
  },
  timerArea: {
    width: '100%',
    alignItems: 'center',
    flex: 1,
  },
  timerLabel: {
    color: '#fff',
    fontSize: screenWidth * 0.035,
    marginBottom: screenHeight * 0.01,
  },
  timerBox: {
    width: screenWidth * 0.35,
    height: screenHeight * 0.04,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: screenHeight * 0.015,
  },
  timerIcon: {
    position: 'absolute',
    left: screenWidth * 0.02,
    width: screenWidth * 0.05,
    height: screenWidth * 0.05,
  },
  timerText: {
    color: '#000',
    fontSize: screenWidth * 0.04,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
  },
  startButtonTimer: {
    marginBottom: screenHeight * 0.02,
  },
  startButtonImage: {
    width: screenWidth * 0.65,
    height: screenHeight * 0.08,
  },

  phraseBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#980909',
    borderColor: '#FCCB00',
    borderWidth: 2,
    borderRadius: 20,
    width: screenWidth * 0.68,
    height: screenHeight * 0.12, 
    marginTop: screenHeight * 0.02,
    padding: screenWidth * 0.025,
  },
  phraseImage: {
    width: screenWidth * 0.15,
    height: screenHeight * 0.12,
  },
  phraseText: {
    flex: 1,
    color: '#fff',
    fontSize: screenWidth * 0.03,
    marginLeft: screenWidth * 0.02,
    textAlign: 'left',
  },
  timerBoxOuter: {
    marginTop: screenHeight * 0.02,
    backgroundColor: '#980909',
    borderColor: '#FCCB00',
    borderWidth: 2,
    borderRadius: 20,
    width: screenWidth * 0.64,
    height: screenHeight * 0.3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCircleContainer: {
    position: 'absolute',
    width: screenWidth * 0.5,
    height: screenWidth * 0.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCircleBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: screenWidth * 0.25,
    borderWidth: 4,
    borderColor: '#FCCB00',
    opacity: 0.25,
  },
  loadingCircleForeground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: screenWidth * 0.25,
    borderWidth: 4,
    borderTopColor: '#FCCB00',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  timerCount: {
    color: '#FCCB00',
    fontSize: screenWidth * 0.08,
    fontWeight: 'bold',
  },
  timerButtonsContainer: {
    marginTop: screenHeight * 0.02,
    width: '100%',
    alignItems: 'center',
  },
  controlButton: {
    width: screenWidth * 0.65,
    height: screenHeight * 0.08,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalContainer: {
    width: screenWidth * 0.9,
    height: screenHeight * 0.25,
    backgroundColor: '#980909',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FCCB00',
    justifyContent: 'center',
    alignItems: 'center',
    padding: screenWidth * 0.05,
  },
  modalTitle: {
    color: '#fff',
    fontSize: screenWidth * 0.05,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalText: {
    color: '#fff',
    fontSize: screenWidth * 0.04,
    textAlign: 'center',
    marginTop: screenHeight * 0.01,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: screenHeight * 0.02,
  },
  modalButton: {
    width: screenWidth * 0.35,
    height: screenHeight * 0.05,
  },

  titleImageFinal: {
    width: screenWidth * 0.9,
    height: screenHeight * 0.1,
    marginTop: screenHeight * 0.08,
  },
  hotoroomImageFinalWrapper: {
    width: screenWidth * 0.7,
    height: screenHeight * 0.43, 
    marginTop: screenHeight * 0.005,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hotoroomImageFinal: {
    width: screenWidth * 0.7,
    height: screenHeight * 0.43, 
  },
  confettiRing: {
    ...StyleSheet.absoluteFillObject,
  },
  confettiDot: {
    position: 'absolute',
    width: 20,
    height: 20,
    top: '50%',
    left: '50%',
  },
  finalBox: {
    width: screenWidth * 0.9,
    backgroundColor: '#980909',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FCCB00',
    paddingVertical: screenHeight * 0.03,
    paddingHorizontal: screenWidth * 0.05,
    alignItems: 'center',
    marginTop: -40,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0, 
  },
  finalTitle: {
    color: '#fff',
    fontSize: screenWidth * 0.045,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: screenHeight * 0.01,
  },
  finalResult: {
    color: '#fff',
    fontSize: screenWidth * 0.04,
    textAlign: 'center',
    marginBottom: screenHeight * 0.02,
  },
  finalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  finalButtonImage: {
    width: 140,
    height: 40,
  },
});