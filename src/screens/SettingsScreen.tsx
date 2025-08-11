
import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  Modal,
  StatusBar,
  DeviceEventEmitter,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const ANDROID_TOP_INSET = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 10 : 0;


export const EVENTS = {
  MUSIC_TOGGLED: 'settings:musicToggled',
  ACHIEVEMENTS_CLEARED: 'achievements:cleared',
} as const;

const MUSIC_KEY = 'settings:musicEnabled';
const NOTIF_KEY = 'settings:notificationsEnabled';


const ASSETS = {
  bg: require('../assets/reathing_practice.png'),
  header: require('../assets/settings2.png'),
  yes: require('../assets/yes.png'),
  no: require('../assets/no.png'),
  iconMusic: require('../assets/ic_music.png'), 
  iconBell: require('../assets/ic_bell.png'),   
  iconTrash: require('../assets/ic_trash.png'), 
};

const BASE_W = 390;                      
const scale = Math.min(1, width / BASE_W);
const CARD_W = Math.round(353 * scale);
const CARD_H = Math.round(303 * scale);
const RADIUS = Math.round(Math.min(CARD_W, CARD_H) * 0.2); 
const TILE = Math.max(56, Math.round(73 * scale));
const ICON = Math.max(20, Math.round(23 * scale));

const SettingsScreen = () => {
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [askDelete, setAskDelete] = useState(false);

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 320, useNativeDriver: true }),
    ]).start();
  }, [fade, slide]);

  useEffect(() => {
    (async () => {
      const m = await AsyncStorage.getItem(MUSIC_KEY);
      const n = await AsyncStorage.getItem(NOTIF_KEY);
      if (m !== null) setMusicEnabled(m === '1');
      else await AsyncStorage.setItem(MUSIC_KEY, '1');
      if (n !== null) setNotifEnabled(n === '1');
      else await AsyncStorage.setItem(NOTIF_KEY, '1');
    })();
  }, []);

  const toggleMusic = useCallback(async () => {
    const next = !musicEnabled;
    setMusicEnabled(next);
    await AsyncStorage.setItem(MUSIC_KEY, next ? '1' : '0');
    DeviceEventEmitter.emit(EVENTS.MUSIC_TOGGLED, { enabled: next });
  }, [musicEnabled]);

  const toggleNotif = useCallback(async () => {
    const next = !notifEnabled;
    setNotifEnabled(next);
    await AsyncStorage.setItem(NOTIF_KEY, next ? '1' : '0');
  }, [notifEnabled]);

  const confirmDeleteAll = useCallback(async () => {
    const keys = await AsyncStorage.getAllKeys();
    const toRemove = keys.filter((k) => k.startsWith('activities:') || k.startsWith('lotus:'));
    if (toRemove.length) await AsyncStorage.multiRemove(toRemove);
    setAskDelete(false);
    DeviceEventEmitter.emit(EVENTS.ACHIEVEMENTS_CLEARED);
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ImageBackground source={ASSETS.bg} style={styles.bg} resizeMode="cover">
        <Animated.View
          style={[
            styles.container,
            { paddingTop: ANDROID_TOP_INSET, opacity: fade, transform: [{ translateY: slide }] },
          ]}
        >
    
          <Image source={ASSETS.header} style={styles.header} resizeMode="contain" />


          <View style={styles.centerArea}>
            <View style={[styles.card, { width: CARD_W, height: CARD_H, borderRadius: RADIUS }]}>
              <View style={styles.row}>
             
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={toggleMusic}
                  style={[
                    styles.tile,
                    { width: TILE, height: TILE },
                    !musicEnabled && styles.tileInactive,
                  ]}
                >
                  <Image source={ASSETS.iconMusic} style={[styles.icon, { width: ICON, height: ICON }]} />
               
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={toggleNotif}
                  style={[
                    styles.tile,
                    { width: TILE, height: TILE },
                    !notifEnabled && styles.tileInactive,
                  ]}
                >
                  <Image source={ASSETS.iconBell} style={[styles.icon, { width: ICON, height: ICON }]} />
                 
                </TouchableOpacity>


                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setAskDelete(true)}
                  style={[styles.tile, { width: TILE, height: TILE }, styles.tileWarning]}
                >
                  <Image source={ASSETS.iconTrash} style={[styles.icon, { width: ICON, height: ICON }]} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <Modal
            visible={askDelete}
            transparent
            animationType="fade"
            onRequestClose={() => setAskDelete(false)}
          >
            <View style={styles.modalBackdrop}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Are you sure you want to delete progress?</Text>
                <View style={styles.modalBtns}>
                  <TouchableOpacity activeOpacity={0.9} onPress={confirmDeleteAll}>
                    <Image source={ASSETS.yes} style={styles.modalBtnImg} />
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.9} onPress={() => setAskDelete(false)}>
                    <Image source={ASSETS.no} style={styles.modalBtnImg} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </Animated.View>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#120000' },
  bg: { flex: 1 },
  container: { flex: 1, alignItems: 'center', paddingHorizontal: 12 },

  header: {
    width: Math.min(368, width - 24),
    height: 115,
      marginTop: 10, 
  },

  centerArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 16,
  },

  card: {
    backgroundColor: '#980909',
    borderWidth: 2,
    borderColor: '#FCCB00',
    paddingHorizontal: 18,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
  },

  tile: {
    borderRadius: 16,
    backgroundColor: '#FFD27A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 6,
  },
  tileInactive: {
    backgroundColor: '#747474',
  },
  tileWarning: {
    backgroundColor: '#FFD27A',
  },

  icon: { tintColor: '#000' },
  tileLabel: { marginTop: 6, fontSize: 11, fontWeight: '700', color: '#000' },

  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: Math.min(360, width - 20),
    minHeight: 160,
    backgroundColor: '#980909',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FCCB00',
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  modalTitle: { color: '#fff', fontSize: 16, textAlign: 'center', marginBottom: 14 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  modalBtnImg: { width: 140, height: 40, resizeMode: 'contain' },
});
