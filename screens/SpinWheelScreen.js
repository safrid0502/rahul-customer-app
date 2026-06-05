import { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  SafeAreaView, StatusBar, Animated, Easing,
  Dimensions, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const WHEEL_SIZE = width * 0.8;
const CENTER = WHEEL_SIZE / 2;
const SEGMENTS = 8;
const SEGMENT_ANGLE = 360 / SEGMENTS;

const PRIZES = [
  { label: '50 pts', icon: '💎', color: '#4F6EF7', value: 50, type: 'points' },
  { label: '10% OFF', icon: '🎁', color: '#FF4757', value: 10, type: 'discount' },
  { label: '100 pts', icon: '🏆', color: '#FFC107', value: 100, type: 'points' },
  { label: 'Try Again', icon: '😅', color: '#636E72', value: 0, type: 'none' },
  { label: '20% OFF', icon: '🔥', color: '#FF6B35', value: 20, type: 'discount' },
  { label: '25 pts', icon: '💫', color: '#A78BFA', value: 25, type: 'points' },
  { label: '15% OFF', icon: '🎉', color: '#4ADE80', value: 15, type: 'discount' },
  { label: '75 pts', icon: '⭐', color: '#00B4D8', value: 75, type: 'points' },
];

function WheelSegment({ prize, index, total }) {
  const angle = (360 / total) * index;
  const midAngle = angle + 360 / total / 2;
  const rad = (midAngle * Math.PI) / 180;
  const r = CENTER * 0.62;
  const x = CENTER + r * Math.sin(rad);
  const y = CENTER - r * Math.cos(rad);

  return (
    <View style={[styles.segmentWedge, {
      position: 'absolute',
      width: WHEEL_SIZE,
      height: WHEEL_SIZE,
      transform: [{ rotate: `${angle}deg` }],
    }]}>
      <View style={[styles.segmentFill, {
        backgroundColor: prize.color,
        opacity: 0.9,
      }]} />
      <View style={[styles.segmentBorder]} />
    </View>
  );
}

export default function SpinWheelScreen({
  onBack, customer, onPointsEarned
}) {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [canSpin, setCanSpin] = useState(true);
  const [nextSpin, setNextSpin] = useState('');
  const [spinsLeft, setSpinsLeft] = useState(1);

  const spinAnim = useRef(new Animated.Value(0)).current;
  const resultScale = useRef(new Animated.Value(0)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const totalDeg = useRef(0);

  useEffect(() => {
    checkSpinAvailability();
    startGlow();
    startPulse();
  }, []);

  const startGlow = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1, duration: 1500, useNativeDriver: true
        }),
        Animated.timing(glowAnim, {
          toValue: 0, duration: 1500, useNativeDriver: true
        }),
      ])
    ).start();
  };

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.spring(pulseAnim, {
          toValue: 1.08, friction: 3, useNativeDriver: true
        }),
        Animated.spring(pulseAnim, {
          toValue: 1, friction: 3, useNativeDriver: true
        }),
      ])
    ).start();
  };

  const checkSpinAvailability = async () => {
    try {
      const key = `spin_${customer?.phone}`;
      const data = await AsyncStorage.getItem(key);
      if (data) {
        const { lastSpin, count } = JSON.parse(data);
        const last = new Date(lastSpin);
        const now = new Date();
        const hoursDiff = (now - last) / (1000 * 60 * 60);
        if (hoursDiff < 168) {
          setCanSpin(false);
          const next = new Date(last);
          next.setDate(next.getDate() + 7);
          setNextSpin(next.toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short'
          }));
        }
      }
    } catch {}
  };

  const spin = async () => {
    if (spinning || !canSpin) return;
    setSpinning(true);
    setResult(null);
    resultScale.setValue(0);
    resultOpacity.setValue(0);

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    const prizeIndex = Math.floor(Math.random() * PRIZES.length);
    const extra = 360 * 10;
    const target = extra + (360 - prizeIndex * SEGMENT_ANGLE);
    totalDeg.current += target;

    Animated.timing(spinAnim, {
      toValue: totalDeg.current,
      duration: 5000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(async () => {
      setSpinning(false);
      const prize = PRIZES[prizeIndex];
      setResult(prize);

      await Haptics.notificationAsync(
        prize.type === 'none'
          ? Haptics.NotificationFeedbackType.Error
          : Haptics.NotificationFeedbackType.Success
      );

      Animated.parallel([
        Animated.spring(resultScale, {
          toValue: 1, tension: 60, friction: 6,
          useNativeDriver: true
        }),
        Animated.timing(resultOpacity, {
          toValue: 1, duration: 300, useNativeDriver: true
        }),
      ]).start();

      await AsyncStorage.setItem(`spin_${customer?.phone}`,
        JSON.stringify({
          lastSpin: new Date().toISOString(),
          count: 1
        })
      );
      setCanSpin(false);

      if (prize.type === 'points' && prize.value > 0) {
        try {
          await fetch(
            `https://rahul-auto-spares-backend.onrender.com/loyalty/${customer?.phone}/add`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ points: prize.value })
            }
          );
          onPointsEarned?.(prize.value);
        } catch {}
      }
    });
  };

  const rotate = spinAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
    extrapolate: 'extend',
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content"
        backgroundColor="#06060E" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🎡 Lucky Spin</Text>
        <View style={{ width: 70 }} />
      </View>

      <View style={styles.body}>
        <Text style={styles.topTitle}>
          Spin & Win Rewards! 🎊
        </Text>
        <Text style={styles.topSub}>
          1 free spin every week · ప్రతివారం ఒక స్పిన్!
        </Text>

        {/* GLOW RING */}
        <Animated.View style={[styles.glowRing,
          { opacity: glowOpacity }]} />

        {/* POINTER */}
        <View style={styles.pointerWrap}>
          <View style={styles.pointer} />
        </View>

        {/* WHEEL */}
        <View style={styles.wheelWrap}>
          <Animated.View style={[styles.wheel,
            { transform: [{ rotate }] }]}>
            {PRIZES.map((prize, i) => {
              const angle = i * SEGMENT_ANGLE;
              const midAngle = angle + SEGMENT_ANGLE / 2;
              const rad = (midAngle - 90) * (Math.PI / 180);
              const r = CENTER * 0.55;
              const tx = CENTER + r * Math.cos(rad) - 24;
              const ty = CENTER + r * Math.sin(rad) - 24;
              return (
                <View key={i}>
                  {/* Segment wedge */}
                  <View style={[styles.wedgeWrap,
                    { transform: [{ rotate: `${angle}deg` }] }]}>
                    <View style={[styles.wedge,
                      { backgroundColor: prize.color }]} />
                    <View style={styles.wedgeLine} />
                  </View>
                  {/* Icon + label */}
                  <View style={[styles.prizeIcon,
                    { left: tx, top: ty }]}>
                    <Text style={styles.prizeEmoji}>{prize.icon}</Text>
                    <Text style={styles.prizeText}>{prize.label}</Text>
                  </View>
                </View>
              );
            })}
            {/* Center pin */}
            <View style={styles.centerPin}>
              <Text style={styles.centerPinText}>
                {spinning ? '🌀' : '🎯'}
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* RESULT CARD */}
        {result && (
          <Animated.View style={[styles.resultCard,
            {
              transform: [{ scale: resultScale }],
              opacity: resultOpacity,
              borderColor: result.color
            }
          ]}>
            <Text style={styles.resultEmoji}>{result.icon}</Text>
            <Text style={[styles.resultTitle, { color: result.color }]}>
              {result.type === 'none'
                ? '😅 Better luck next time!'
                : `🎉 You won ${result.label}!`}
            </Text>
            {result.type === 'points' && result.value > 0 && (
              <Text style={styles.resultSub}>
                💎 {result.value} points added instantly!
              </Text>
            )}
            {result.type === 'discount' && (
              <Text style={styles.resultSub}>
                Show to staff at store for discount!
              </Text>
            )}
          </Animated.View>
        )}

        {/* SPIN BUTTON */}
        {!result && (
          <Animated.View style={[
            { transform: [{ scale: canSpin ? pulseAnim : 1 }] }
          ]}>
            <TouchableOpacity
              style={[styles.spinBtn,
                (!canSpin || spinning) && styles.spinBtnOff]}
              onPress={spin}
              disabled={!canSpin || spinning}
            >
              <Text style={styles.spinBtnText}>
                {spinning ? '🌀 Spinning...'
                 : canSpin ? '🎡 TAP TO SPIN!'
                 : `⏰ Next spin: ${nextSpin}`}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <Text style={styles.footerNote}>
          Win points, discounts and more! 🎁
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06060E' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(79,110,247,0.15)',
  },
  backBtn: {
    backgroundColor: 'rgba(79,110,247,0.1)', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1,
    borderColor: 'rgba(79,110,247,0.2)',
  },
  backBtnText: { color: '#4F6EF7', fontSize: 14, fontWeight: 'bold' },
  headerTitle: {
    fontSize: 18, fontWeight: 'bold', color: '#fff',
  },
  body: { flex: 1, alignItems: 'center', paddingTop: 10 },
  topTitle: {
    fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4,
  },
  topSub: {
    fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 20,
  },
  glowRing: {
    position: 'absolute',
    top: 100,
    width: WHEEL_SIZE + 40,
    height: WHEEL_SIZE + 40,
    borderRadius: (WHEEL_SIZE + 40) / 2,
    borderWidth: 3,
    borderColor: '#4F6EF7',
  },
  pointerWrap: {
    zIndex: 10, marginBottom: -16,
  },
  pointer: {
    width: 0, height: 0,
    borderLeftWidth: 12, borderRightWidth: 12,
    borderTopWidth: 24,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FF4757',
  },
  wheelWrap: {
    width: WHEEL_SIZE, height: WHEEL_SIZE,
    borderRadius: WHEEL_SIZE / 2,
    overflow: 'hidden',
    borderWidth: 4, borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#0E0E1C',
  },
  wheel: {
    width: WHEEL_SIZE, height: WHEEL_SIZE,
    position: 'relative',
  },
  wedgeWrap: {
    position: 'absolute',
    width: WHEEL_SIZE / 2, height: WHEEL_SIZE / 2,
    left: WHEEL_SIZE / 2, top: 0,
    transformOrigin: 'left bottom',
  },
  wedge: {
    position: 'absolute', width: '100%', height: '100%',
    borderTopRightRadius: WHEEL_SIZE / 2,
    opacity: 0.85,
  },
  wedgeLine: {
    position: 'absolute', right: 0, bottom: 0,
    width: 2, height: WHEEL_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  prizeIcon: {
    position: 'absolute', width: 48, height: 48,
    alignItems: 'center', justifyContent: 'center',
  },
  prizeEmoji: { fontSize: 18 },
  prizeText: {
    fontSize: 7, color: '#fff', fontWeight: 'bold',
    textAlign: 'center', textShadowColor: '#000',
    textShadowRadius: 2,
  },
  centerPin: {
    position: 'absolute',
    left: CENTER - 28, top: CENTER - 28,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#0E0E1C', borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 10,
  },
  centerPinText: { fontSize: 24 },
  resultCard: {
    marginTop: 20, marginHorizontal: 20,
    backgroundColor: '#0E0E1C', borderRadius: 20,
    padding: 24, alignItems: 'center', borderWidth: 2,
    gap: 8, width: width - 40,
  },
  resultEmoji: { fontSize: 52, marginBottom: 4 },
  resultTitle: {
    fontSize: 20, fontWeight: 'bold', textAlign: 'center',
  },
  resultSub: {
    fontSize: 13, color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
  spinBtn: {
    marginTop: 20, backgroundColor: '#4F6EF7', borderRadius: 30,
    paddingHorizontal: 48, paddingVertical: 18,
    shadowColor: '#4F6EF7', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5, shadowRadius: 12, elevation: 10,
  },
  spinBtnOff: {
    backgroundColor: '#1A1A2E', shadowOpacity: 0,
  },
  spinBtnText: {
    color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 1,
  },
  footerNote: {
    marginTop: 14, fontSize: 12, color: 'rgba(255,255,255,0.3)',
  },
});