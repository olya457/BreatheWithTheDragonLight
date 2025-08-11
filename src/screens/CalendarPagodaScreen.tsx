import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  Dimensions,
  TouchableOpacity,
  Modal,
  Pressable,
  Platform,
  SafeAreaView,
  ScrollView,
  Animated,
  StatusBar,
  DeviceEventEmitter, 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');
const isSmallW = width < 360;
const isShortH = height < 680;
const TOP_SHIFT = 20;

const ANDROID_TOP_INSET = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 10 : 0;

const ASSETS = {
  bg: require('../assets/background_calendar.png'),
  header: require('../assets/calendar_pagoda.png'),
  calm: require('../assets/calm.png'),
  energy: require('../assets/energy.png'),
  focus: require('../assets/focus.png'),
  more: require('../assets/more.png'),
  close_bac: require('../assets/close_bac.png'),
};

type DayActivities = Partial<{ calm: string; energy: string; focus: string }>;

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

const ymToday = () => {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
};
const keyFor = (y: number, m: number, d: number) => `activities:${y}-${m}-${d}`;

const CalendarPagodaScreen = () => {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activities, setActivities] = useState<Record<number, DayActivities>>({});
  const isFocused = useIsFocused();

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(10)).current;

  const animateIn = () => {
    fade.setValue(0);
    slide.setValue(10);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 420, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    if (isFocused) animateIn();
  }, [isFocused]);

  const { year, month } = ymToday();

  const loadMonth = useCallback(async () => {
    const data: Record<number, DayActivities> = {};
    const keys = DAYS.map((d) => keyFor(year, month, d));
    const pairs = await AsyncStorage.multiGet(keys);

    pairs.forEach(([key, value]: [string, string | null]) => {
      if (value) {
        const day = Number(key.split('-').pop());
        if (!Number.isNaN(day)) data[day] = JSON.parse(value);
      }
    });
    setActivities(data);
  }, [year, month]);

  useEffect(() => {
    if (isFocused) loadMonth();
  }, [isFocused, loadMonth]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('achievements:cleared', () => {
      setActivities({});
      setSelectedDay(null);
    });
    return () => sub.remove();
  }, []);

  const dayData: DayActivities | undefined = useMemo(
    () => (selectedDay ? activities[selectedDay] : undefined),
    [selectedDay, activities]
  );

  const hasActivities =
    !!dayData && (dayData.calm || dayData.energy || dayData.focus);

  return (
    <SafeAreaView style={styles.safe}>
      <ImageBackground source={ASSETS.bg} style={styles.bg} resizeMode="cover">
        <View style={styles.dimOverlay} />

        <Animated.View
          style={[
            styles.content,
            { paddingTop: ANDROID_TOP_INSET, opacity: fade, transform: [{ translateY: slide }] },
          ]}
        >
          <Image
            source={ASSETS.header}
            style={[styles.headerImage, { marginTop: (styles.headerImage.marginTop as number) + TOP_SHIFT }]}
            resizeMode="contain"
          />

          {isShortH || isSmallW ? (
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <CalendarContent
                days={DAYS}
                activities={activities}
                selectedDay={selectedDay}
                setSelectedDay={setSelectedDay}
                dayData={dayData}
                hasActivities={hasActivities}
                setModalOpen={setModalOpen}
              />
            </ScrollView>
          ) : (
            <CalendarContent
              days={DAYS}
              activities={activities}
              selectedDay={selectedDay}
              setSelectedDay={setSelectedDay}
              dayData={dayData}
              hasActivities={hasActivities}
              setModalOpen={setModalOpen}
            />
          )}
        </Animated.View>

        <Modal
          visible={modalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setModalOpen(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <ScrollView contentContainerStyle={{ paddingBottom: 8 }}>
                <Text style={styles.modalTitle}>Day {selectedDay}</Text>
                {!!dayData?.energy && (
                  <ActivityRow
                    icon={ASSETS.energy}
                    title="Breath of Energy"
                    total={dayData.energy}
                  />
                )}
                {!!dayData?.focus && (
                  <ActivityRow
                    icon={ASSETS.focus}
                    title="Breath of Focus"
                    total={dayData.focus}
                  />
                )}
                {!!dayData?.calm && (
                  <ActivityRow
                    icon={ASSETS.calm}
                    title="Breath of Calm"
                    total={dayData.calm}
                  />
                )}
              </ScrollView>

              <Pressable
                onPress={() => setModalOpen(false)}
                style={({ pressed }) => [
                  styles.closeBtn,
                  pressed && { opacity: 0.9 },
                ]}
              >
                <Image source={ASSETS.close_bac} style={styles.closeImg} />
              </Pressable>
            </View>
          </View>
        </Modal>
      </ImageBackground>
    </SafeAreaView>
  );
};

const CalendarContent = ({
  days,
  activities,
  selectedDay,
  setSelectedDay,
  dayData,
  hasActivities,
  setModalOpen,
}: any) => (
  <>
    <View style={[styles.calendarCard, { marginTop: TOP_SHIFT }]}>
      <View style={styles.calendarGrid}>
        {days.map((d: number) => {
          const active = !!activities[d];
          const selected = selectedDay === d;
          return (
            <TouchableOpacity
              key={d}
              activeOpacity={0.85}
              onPress={() => setSelectedDay(d)}
              style={[
                styles.dayCell,
                active && styles.dayCellActive,
                selected && styles.dayCellSelected,
              ]}
            >
              <Text
                style={[
                  styles.dayText,
                  active && styles.dayTextActive,
                  selected && styles.dayTextSelected,
                ]}
              >
                {d}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>

    <View style={styles.bottomBlock}>
      {selectedDay == null ? (
        <Text style={styles.helperText}>Tap a day to see activity.</Text>
      ) : !hasActivities ? (
        <View style={styles.noActivityCard}>
          <Text style={styles.noActivityText}>
            There are no activities on this day.
          </Text>
        </View>
      ) : (
        <View style={styles.activitiesWrap}>
          <View style={styles.iconsRow}>
            {!!dayData?.calm && (
              <IconWithLabel icon={ASSETS.calm} label="Breath of Calm" />
            )}
            {!!dayData?.energy && (
              <IconWithLabel icon={ASSETS.energy} label="Breath of Energy" />
            )}
            {!!dayData?.focus && (
              <IconWithLabel icon={ASSETS.focus} label="Breath of Focus" />
            )}
          </View>

          <Pressable
            onPress={() => setModalOpen(true)}
            style={({ pressed }) => [
              styles.moreBtn,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Image source={ASSETS.more} style={styles.moreImg} />
          </Pressable>
        </View>
      )}
    </View>
  </>
);

export default CalendarPagodaScreen;

const IconWithLabel = ({ icon, label }: { icon: any; label: string }) => (
  <View style={styles.iconItem}>
    <Image source={icon} style={styles.iconImg} resizeMode="contain" />
    <Text style={styles.iconText} numberOfLines={1}>
      {label}
    </Text>
  </View>
);

const ActivityRow = ({
  icon,
  title,
  total,
}: {
  icon: any;
  title: string;
  total?: string;
}) => (
  <View style={styles.actRow}>
    <Image source={icon} style={styles.actIcon} />
    <View style={styles.actMiddle}>
      <Text style={styles.actTitle}>{title}</Text>
      <View style={styles.dividerDecor} />
    </View>
    <Text style={styles.actTotal}>Total time: {total}</Text>
  </View>
);

const ACT_ICON_SIZE = isSmallW || isShortH ? 76 : 84; 
const ACT_TEXT_FONT = isSmallW || isShortH ? 11 : 12;

const MORE_BTN_WIDTH = isSmallW || isShortH ? 130 : 150; 
const MORE_BTN_HEIGHT = isSmallW || isShortH ? 38 : 44; 

const ACT_ROW_ICON_SIZE = isSmallW || isShortH ? 48 : 56;
const ACT_ROW_TITLE_FONT = isSmallW || isShortH ? 14 : 16;
const ACT_ROW_TOTAL_FONT = isSmallW || isShortH ? 13 : 14;

const CALENDAR_PADDING_HORIZONTAL = isSmallW || isShortH ? 8 : 10;
const GRID_GAP = isSmallW || isShortH ? 6 : 8;

const calculateCellSize = () => {
  const availableWidth = width - 24 - (CALENDAR_PADDING_HORIZONTAL * 2);
  const cellWithGap = availableWidth / 7;
  const cellSize = cellWithGap - GRID_GAP;
  return cellSize;
};
const CELL_SIZE = calculateCellSize();
const DAY_FONT = isSmallW || isShortH ? 12 : 14;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#120000' },
  bg: { flex: 1 },
  dimOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },

  content: { flex: 1, alignItems: 'center', paddingHorizontal: 12 },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 110, 
  },

  headerImage: {
    width: Math.min(360, width - (isSmallW ? 16 : 24)),
    height: ((115 / 360) * Math.min(360, width - (isSmallW ? 16 : 24))) | 0,
    marginTop: Platform.select({ ios: 8, android: 12 }) as number,
    marginBottom: isSmallW || isShortH ? 6 : 8,
  },

  calendarCard: {
    width: '100%',
    paddingVertical: isSmallW || isShortH ? 10 : 14,
    paddingHorizontal: CALENDAR_PADDING_HORIZONTAL,
    borderRadius: 16,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,200,120,0.45)',
  },

  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    rowGap: GRID_GAP,
    columnGap: GRID_GAP,
  },

  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: CELL_SIZE / 2,
    borderWidth: 1,
    borderColor: '#FFFAD2',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#980909',
  },
  dayCellActive: { borderColor: '#FFFAD2', backgroundColor: '#980909' },

  dayCellSelected: { 
    borderColor: '#980909',
    backgroundColor: '#FFFAD2',
  },

  dayText: { color: '#ffffff', fontWeight: '700', fontSize: DAY_FONT },
  dayTextActive: { color: '#ffffff' },

  dayTextSelected: { 
    color: '#000000',
  },

  bottomBlock: { width: '100%', marginTop: isSmallW || isShortH ? 10 : 12, marginBottom: 16 },

  helperText: {
    textAlign: 'center',
    color: '#ffe6b0',
    backgroundColor: 'rgba(18,0,0,0.5)',
    paddingVertical: isSmallW || isShortH ? 10 : 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,200,120,0.45)',
    fontSize: isSmallW || isShortH ? 12 : 14,
    paddingHorizontal: 8,
  },

  noActivityCard: {
    backgroundColor: 'rgba(18,0,0,0.5)',
    padding: isSmallW || isShortH ? 12 : 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,210,150,0.45)',
    alignItems: 'center',
  },
  noActivityText: { color: '#fff7d9', fontSize: isSmallW || isShortH ? 13 : 14, fontWeight: '700' },

  activitiesWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(18,0,0,0.5)',
    borderRadius: 16,
    paddingVertical: isSmallW || isShortH ? 6 : 14,
    borderWidth: 1,
    borderColor: 'rgba(255,210,150,0.45)',
  },

  iconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: isSmallW || isShortH ? 15 : 23, 
    paddingHorizontal: 10,
  },

  iconItem: { alignItems: 'center', width: isSmallW || isShortH ? 88 : 100 },
  iconImg: { 
    width: ACT_ICON_SIZE,
    height: ACT_ICON_SIZE, 
    marginBottom: 8
  },
  iconText: { color: '#ffe6b0', fontSize: ACT_TEXT_FONT, textAlign: 'center' },

  moreBtn: { 
    marginTop: 11, 
    paddingHorizontal: 10, 
    paddingVertical: 6 
  },
  moreImg: { 
    width: MORE_BTN_WIDTH, 
    height: MORE_BTN_HEIGHT, 
    resizeMode: 'contain' 
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },

  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: 'rgba(20,0,0,0.5)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ffdca3',
    padding: 18,
  },

  modalTitle: { color: '#ffe6b8', fontWeight: '800', fontSize: 18, textAlign: 'center', marginBottom: 12 },
  
  actRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(65,0,0,0.5)',
    borderRadius: 14,
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,210,150,0.35)',
  },
  actIcon: { width: ACT_ROW_ICON_SIZE, height: ACT_ROW_ICON_SIZE, marginRight: 12, resizeMode: 'contain' },
  actMiddle: { flex: 1 },
  actTitle: { color: '#ffe6b0', fontWeight: '700', fontSize: ACT_ROW_TITLE_FONT, marginBottom: 8 },
  dividerDecor: { height: 1, backgroundColor: 'rgba(255,220,170,0.45)', borderRadius: 1 },
  actTotal: { color: '#fff', fontSize: ACT_ROW_TOTAL_FONT, marginLeft: 12 },
  
  closeBtn: {
    alignSelf: 'center',
    marginTop: 16,
  },
  closeImg: {
    width: 160,
    height: 85,
    resizeMode: 'contain',
  },
});