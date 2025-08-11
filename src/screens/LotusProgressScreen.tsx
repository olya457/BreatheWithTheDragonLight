import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Share,
  Animated,
  Modal,
  Pressable,
  StatusBar,
  ScrollView,
  Easing,
  DeviceEventEmitter, 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const ANDROID_TOP_INSET = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 10 : 0;

const ASSETS = {
  bg: require('../assets/reathing_practice.png'),
  header: require('../assets/lotus_header.png'),
  setProgress: require('../assets/set_progress.png'),
  yes: require('../assets/yes.png'),
  calendar: require('../assets/calendar.png'),
  share: require('../assets/share.png'),
  backHome: require('../assets/back_home.png'),
  confetti: require('../assets/image22.png'),
  lotusStages: [
    require('../assets/lotus_1.png'),
    require('../assets/lotus_2.png'),
    require('../assets/lotus_3.png'),
    require('../assets/lotus_4.png'),
    require('../assets/lotus_5.png'),
    require('../assets/lotus_6.png'),
    require('../assets/lotus_7.png'),
  ],
};

type DayActivities = Partial<{ calm: string; energy: string; focus: string }>;

const ymToday = () => {
  const d = new Date();
  return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() };
};
const keyFor = (y: number, m: number, d: number) => `activities:${y}-${m}-${d}`;

const toSeconds = (hhmmss: string) => {
  const [h = '0', m = '0', s = '0'] = hhmmss.split(':');
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
};
const fmtSeconds = (sec: number) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

const TARGETS = [1, 3, 7, 14, 30] as const;

const LotusProgressScreen = () => {
  const [step, setStep] = useState<'landing' | 'progress'>('landing');
  const [rangeDays, setRangeDays] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [rangeTotalSec, setRangeTotalSec] = useState(0);
  const [progressDays, setProgressDays] = useState(0);
  const [showCongrats, setShowCongrats] = useState(false);

  const blurAnimation = useRef(new Animated.Value(0)).current;

  const fade = useRef(new Animated.Value(1)).current;
  const slide = useRef(new Animated.Value(0)).current;

  const spin = useRef(new Animated.Value(0)).current;
  const confettiLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('lotus:targetDays');
      if (saved) setRangeDays(Number(saved));
    })();
  }, []);

  useEffect(() => {
    if (showCongrats) {
      spin.setValue(0);
      confettiLoopRef.current?.stop(); 
      confettiLoopRef.current = Animated.loop(
        Animated.timing(spin, {
          toValue: 1,
          duration: 5000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      confettiLoopRef.current.start();
    } else {
      confettiLoopRef.current?.stop(); 
      confettiLoopRef.current = null;
    }
   
    return () => {
      confettiLoopRef.current?.stop();
    };
  }, [showCongrats, spin]);


  const loadRangeData = useCallback(async (days: number) => {
    const { y, m, d } = ymToday();
    const dates: Date[] = Array.from({ length: days }, (_, i) => new Date(y, m - 1, d - i));
    const keys = dates.map(dd => keyFor(dd.getFullYear(), dd.getMonth() + 1, dd.getDate()));
    const pairs = await AsyncStorage.multiGet(keys);

    let total = 0;
    const has: boolean[] = [];

    pairs.forEach(([_, value]: [string, string | null], idx) => {
      if (value) {
        const obj: DayActivities = JSON.parse(value);
        const dayHas = !!(obj.calm || obj.energy || obj.focus);
        has[idx] = dayHas;
        if (obj.calm) total += toSeconds(obj.calm);
        if (obj.energy) total += toSeconds(obj.energy);
        if (obj.focus) total += toSeconds(obj.focus);
      } else {
        has[idx] = false;
      }
    });

    let streak = 0;
    for (let i = 0; i < has.length; i++) {
      if (has[i]) streak += 1; else break;
    }

    setRangeTotalSec(total);
    setProgressDays(streak);
  }, []);

  useEffect(() => {
    if (step === 'progress' && rangeDays) loadRangeData(rangeDays);
  }, [step, rangeDays, loadRangeData]);
  
  useEffect(() => {
      if (step === 'progress') {
        if (rangeDays === 1) {
            setShowCongrats(true);
        } else if (rangeDays && progressDays >= rangeDays) {
            setShowCongrats(true);
        } else {
            setShowCongrats(false);
        }
    } else {
        setShowCongrats(false);
    }
  }, [step, rangeDays, progressDays]);

  useEffect(() => {
    Animated.timing(blurAnimation, {
      toValue: showCongrats ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [showCongrats]);

  const confirmSelection = async () => {
    if (rangeDays === null) return;
    await AsyncStorage.setItem('lotus:targetDays', String(rangeDays));
    setModalOpen(false);
    setStep('progress');
  };

  const lotusStageIndex = useMemo(() => {
    if (!rangeDays || progressDays <= 0) return 0;
    const day = Math.min(progressDays, rangeDays);
    if (rangeDays === 1) return 0;
    if (rangeDays === 3) return [0, 3, 6][Math.min(day, 3) - 1];
    if (rangeDays === 7) return Math.min(6, day - 1);
    if (rangeDays === 14) return Math.min(6, Math.floor((day - 1) / 2));
    if (rangeDays === 30) return Math.min(6, Math.floor((day - 1) / 5));

    return Math.min(6, day - 1);
  }, [rangeDays, progressDays]);

  const onShare = async () => {
    try {
      await Share.share({
        message: `I've reached a ${rangeDays}-day streak! Total practice time: ${fmtSeconds(rangeTotalSec)} ✨`,
      });
    } catch {}
  };

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('achievements:cleared', () => {
      setRangeDays(null);
      setRangeTotalSec(0);
      setProgressDays(0);
      setStep('landing');
      AsyncStorage.removeItem('lotus:targetDays'); 
    });
    return () => sub.remove();
  }, []);

  const Landing = () => {
    const pulse = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0, duration: 1200, useNativeDriver: true }),
        ])
      ).start();
    }, [pulse]);

    const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });

    const CIRCLE_SIZE = width * 0.7;
    const LOTUS_SIZE = width * 0.6;
    const HEADER_HEIGHT = ((115 / 360) * Math.min(360, width - 24)) | 0;

    return (
      <Animated.View
        style={[
          styles.container,
          { paddingTop: ANDROID_TOP_INSET, opacity: fade, transform: [{ translateY: slide }] },
        ]}
      >
        <Image source={ASSETS.header} style={styles.header} resizeMode="contain" />

        <View style={{ marginTop: 20 }}>
            <Animated.View
            style={[
                styles.yellowCircle,
                {
                width: CIRCLE_SIZE,
                height: CIRCLE_SIZE,
                borderRadius: CIRCLE_SIZE / 2,
                transform: [{ scale }],
                },
            ]}
            >
            <Image
                source={ASSETS.lotusStages[0]}
                style={{ width: LOTUS_SIZE, height: LOTUS_SIZE, resizeMode: 'contain' }}
            />
            </Animated.View>

            <TouchableOpacity
            onPress={() => setModalOpen(true)}
            activeOpacity={0.9}
            style={[styles.setBtnWrap, { marginTop: 20 }]}
            >
            <Image source={ASSETS.setProgress} style={{ width: 316 * 0.8, height: 83 * 0.8, resizeMode: 'contain' }} />
            </TouchableOpacity>
        </View>

        <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.chooseCard}>
              <Text style={styles.chooseTitle}>Choose the number of days:</Text>
              <Pressable style={styles.daysInput}>
                <Image source={ASSETS.calendar} style={styles.daysIcon} />
                <Text style={styles.daysText}>{rangeDays !== null ? `${rangeDays} Days` : 'day'}</Text>
              </Pressable>
              <View style={styles.optionsRow}>
                {TARGETS.map((n) => (
                  <TouchableOpacity
                    key={n}
                    onPress={() => setRangeDays(n)}
                    activeOpacity={0.85}
                    style={[styles.optBtn, rangeDays === n && styles.optBtnActive]}
                  >
                    <Text style={[styles.optText, rangeDays === n && styles.optTextActive]}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                onPress={confirmSelection}
                disabled={rangeDays === null}
                activeOpacity={0.9}
                style={{ opacity: rangeDays !== null ? 1 : 0.5, marginTop: 12 }}
              >
                <Image source={ASSETS.yes} style={styles.yesButton} />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </Animated.View>
    );
  };

  const Progress = () => {
    const percent = rangeDays ? Math.max(0, Math.min(1, progressDays / rangeDays)) : 0;
    const barW = width * 0.7;
    const fillW = Math.round(barW * percent);
    const thumbX = Math.max(0, Math.min(barW - 28, fillW - 14));
    
    const CIRCLE_SIZE = width * 0.6;
    const LOTUS_SIZE = width * 0.5;

    return (
      <Animated.View style={[styles.container, { paddingTop: ANDROID_TOP_INSET, opacity: fade, transform: [{ translateY: slide }] }]}>
        <Image source={ASSETS.header} style={styles.header} resizeMode="contain" />
        <View style={styles.totalCard}>
          <Text style={styles.totalText}>
            Total time spent on practices: <Text style={{ fontWeight: '800' }}>{fmtSeconds(rangeTotalSec)}</Text>
          </Text>
        </View>
        <View style={[styles.yellowCircle, { width: CIRCLE_SIZE, height: CIRCLE_SIZE, borderRadius: CIRCLE_SIZE / 2 }]}>
          <Image source={ASSETS.lotusStages[lotusStageIndex]} style={{ width: LOTUS_SIZE, height: LOTUS_SIZE, resizeMode: 'contain' }} />
        </View>
        <View style={styles.progressCard}>
          <Text style={styles.progressOf}>{Math.min(progressDays, rangeDays ?? 0)} of {rangeDays ?? 0}</Text>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Your progress:</Text>
            <View style={[styles.progressBar, { width: barW }]}>
              <View style={[styles.progressFill, { width: fillW, backgroundColor: '#FFD700' }]} />
              <Image source={ASSETS.lotusStages[0]} style={[styles.progressThumb, { left: thumbX }]} />
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  const Congrats = () => {
    if (!showCongrats || !rangeDays) return null;
    const rot = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
    const blur = blurAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.4)']
    });
    
    const CARD_WIDTH = width * 0.9;
    
    return (
      <Animated.View style={[styles.congratsWrap, { backgroundColor: blur }]}>
        <ScrollView contentContainerStyle={[styles.congratsContent, { paddingBottom: 100 }]}>
            <View style={[styles.congratsTop, { paddingTop: ANDROID_TOP_INSET, height: height * 0.5 }]}>
              <Image source={ASSETS.lotusStages[6]} style={{ width: 326, height: 326, resizeMode: 'contain' }} />
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
            <View style={[styles.congratsCard, { width: CARD_WIDTH }]}>
              <Text style={styles.congratsTitle}>Congratulations!</Text>
              <Text style={styles.congratsText}>You&apos;ve reached a {rangeDays}-day streak</Text>
              <View style={styles.congratsBtns}>
                <TouchableOpacity onPress={onShare} activeOpacity={0.9}>
                  <Image source={ASSETS.share} style={{ width: 140, height: 40, resizeMode: 'contain' }} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setStep('landing')} activeOpacity={0.9}>
                  <Image source={ASSETS.backHome} style={{ width: 140, height: 40, resizeMode: 'contain' }} />
                </TouchableOpacity>
              </View>
            </View>
        </ScrollView>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ImageBackground source={ASSETS.bg} style={styles.bg} resizeMode="cover">
        {step === 'landing' ? <Landing /> : <Progress />}
        <Congrats />
      </ImageBackground>
    </SafeAreaView>
  );
};

export default LotusProgressScreen;

const BORDER = '#FCCB00';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#120000' },
  bg: { flex: 1, alignItems: 'center' },

  container: { flex: 1, alignItems: 'center', paddingHorizontal: 16 },

  header: {
    width: Math.min(360, width - 24),
    height: ((115 / 360) * Math.min(360, width - 24)) | 0,
    marginTop: Platform.select({ ios: 8, android: 12 }),
    marginBottom: 8,
  },

  yellowCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFE8A3',
    borderWidth: 2,
    borderColor: '#ffe9b8',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },

  setBtnWrap: {
    alignItems: 'center',
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  chooseCard: {
    width: '90%',
    height: 220,
    backgroundColor: '#980909',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: BORDER,
    alignItems: 'center',
    paddingTop: 14,
  },
  chooseTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },

  daysInput: {
    marginTop: 10,
    width: '80%',
    height: 44,
    backgroundColor: '#fff',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  daysIcon: {
    width: 22,
    height: 22,
    marginRight: 8,
    resizeMode: 'contain',
    tintColor: 'rgba(0, 0, 0, 0.6)',
  },
  daysText: { color: '#000', fontSize: 16, fontWeight: '700' },

  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginTop: 10,
  },
  optBtn: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
  },
  optBtnActive: { backgroundColor: '#ffd27a', borderColor: '#ffd27a' },
  optText: { color: '#fff', fontWeight: '800' },
  optTextActive: { color: '#5a1c00' },

  totalCard: {
    width: '95%',
    backgroundColor: '#980909',
    borderWidth: 2,
    borderColor: BORDER,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  totalText: { color: '#ffe9c4', textAlign: 'center' },
  progressCard: {
    width: '95%',
    height: 85,
    backgroundColor: '#980909',
    borderWidth: 2,
    borderColor: BORDER,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  progressOf: { color: '#fff', fontWeight: '800', marginBottom: 4 },
  progressRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressLabel: { color: '#fff', fontWeight: '700' },

  progressBar: {
    flex: 1,
    height: 18,
    backgroundColor: '#fff',
    borderRadius: 9,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: BORDER,
  },
  progressThumb: {
    position: 'absolute',
    top: -8,
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },

  congratsWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  congratsContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  congratsTop: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  confettiRing: {
    position: 'absolute',
    width: 360,
    height: 360,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confettiDot: { position: 'absolute', width: 24, height: 24, resizeMode: 'contain' },

  congratsCard: {
    width: '90%',
    backgroundColor: '#980909',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginTop: 20,
  },
  congratsTitle: { color: '#fff', fontWeight: '900', fontSize: 18, marginBottom: 6 },
  congratsText: { color: '#ffe9c4', fontSize: 14, marginBottom: 10 },
  congratsBtns: { flexDirection: 'row', gap: 12, marginTop: 6 },

  yesButton: {
    width: 140, 
    resizeMode: 'contain',
  },
});