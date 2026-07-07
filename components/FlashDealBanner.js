import { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View,
  TouchableOpacity, Animated
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEAL_KEY = 'flash_deal_expiry_v2';

export default function FlashDealBanner({ deal, onPress }) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [ready, setReady] = useState(false);
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef(null);

  const DURATION = deal?.expiresInSeconds || 7200;

  useEffect(() => {
    initTimer();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  useEffect(() => {
    if (!ready) return;

    // Slide in
    Animated.spring(slideAnim, {
      toValue: 0, tension: 50, friction: 7, useNativeDriver: true
    }).start();

    // Pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();

    // Countdown
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          // Reset deal for next time
          const newExpiry = Date.now() + DURATION * 1000;
          AsyncStorage.setItem(DEAL_KEY, newExpiry.toString()).catch(() => {});
          return DURATION;
        }
        return prev - 1;
      });
    }, 1000);
  }, [ready]);

  const initTimer = async () => {
    try {
      const saved = await AsyncStorage.getItem(DEAL_KEY);
      if (saved) {
        const expiry = parseInt(saved);
        const now = Date.now();
        const remaining = Math.floor((expiry - now) / 1000);
        if (remaining > 30) {
          // Deal still active
          setTimeLeft(remaining);
          setReady(true);
          return;
        }
      }
      // Start fresh deal
      const newExpiry = Date.now() + DURATION * 1000;
      await AsyncStorage.setItem(DEAL_KEY, newExpiry.toString());
      setTimeLeft(DURATION);
      setReady(true);
    } catch {
      setTimeLeft(DURATION);
      setReady(true);
    }
  };

  const hours   = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;
  const pad = (n) => String(n).padStart(2, '0');

  if (!deal || !ready || timeLeft <= 0) return null;

  return (
    <Animated.View style={[
      styles.wrapper,
      { transform: [{ translateY: slideAnim }, { scale: pulseAnim }] }
    ]}>
      <TouchableOpacity style={styles.banner} onPress={onPress} activeOpacity={0.9}>
        {/* LEFT */}
        <View style={styles.left}>
          <Text style={styles.fireEmoji}>SALE</Text>
          <View>
            <Text style={styles.flashLabel}>FLASH DEAL</Text>
            <Text style={styles.dealName} numberOfLines={1}>
              {deal?.name || 'Engine Oil 1L'}
            </Text>
            <Text style={styles.discount}>
              {deal?.discount || '15% OFF'}
            </Text>
          </View>
        </View>

        {/* RIGHT — COUNTDOWN */}
        <View style={styles.right}>
          <Text style={styles.endsIn}>Ends in</Text>
          <View style={styles.timerRow}>
            <View style={styles.timeBox}>
              <Text style={styles.timeNum}>{pad(hours)}</Text>
              <Text style={styles.timeLabel}>HRS</Text>
            </View>
            <Text style={styles.timeSep}>:</Text>
            <View style={styles.timeBox}>
              <Text style={styles.timeNum}>{pad(minutes)}</Text>
              <Text style={styles.timeLabel}>MIN</Text>
            </View>
            <Text style={styles.timeSep}>:</Text>
            <View style={[styles.timeBox, styles.timeBoxSec]}>
              <Text style={[styles.timeNum, styles.timeNumSec]}>{pad(seconds)}</Text>
              <Text style={styles.timeLabel}>SEC</Text>
            </View>
          </View>
          <Text style={styles.tapHint}>Tap to shop →</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginHorizontal: 16, marginBottom: 12 },
  banner: {
    backgroundColor: '#0E0E1C', borderRadius: 18, padding: 14,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', borderWidth: 1.5,
    borderColor: 'rgba(255,71,87,0.5)',
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  fireEmoji: { fontSize: 24 },
  flashLabel: {
    fontSize: 10, color: '#FF4757', fontWeight: 'bold',
    letterSpacing: 2, marginBottom: 2,
  },
  dealName: { fontSize: 14, fontWeight: 'bold', color: '#fff', marginBottom: 2 },
  discount: { fontSize: 13, color: '#4ADE80', fontWeight: 'bold' },
  right: { alignItems: 'center', gap: 2 },
  endsIn: {
    fontSize: 9, color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4,
  },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  timeBox: {
    backgroundColor: 'rgba(255,71,87,0.15)', borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 4, alignItems: 'center',
    minWidth: 34, borderWidth: 1, borderColor: 'rgba(255,71,87,0.3)',
  },
  timeBoxSec: { backgroundColor: 'rgba(255,71,87,0.25)', borderColor: '#FF4757' },
  timeNum: { fontSize: 16, fontWeight: 'bold', color: '#FF4757' },
  timeNumSec: { color: '#FF4757' },
  timeLabel: { fontSize: 7, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 },
  timeSep: { fontSize: 16, fontWeight: 'bold', color: '#FF4757', marginBottom: 8 },
  tapHint: { fontSize: 9, color: 'rgba(255,71,87,0.5)', marginTop: 4 },
});