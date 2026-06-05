import { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated, Easing } from 'react-native';

export default function FlashDealBanner({ deal, onPress }) {
  const [timeLeft, setTimeLeft] = useState(deal?.expiresInSeconds || 3600);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
    const timer = setInterval(() => {
      setTimeLeft(prev => { if (prev <= 1) { clearInterval(timer); return 0; } return prev - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return h + 'h ' + m + 'm';
    if (m > 0) return m + 'm ' + String(s).padStart(2, '0') + 's';
    return s + 's';
  };

  if (timeLeft === 0) return null;

  const fireOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });

  return (
    <Animated.View style={{ marginHorizontal: 16, marginBottom: 12, transform: [{ translateY: slideAnim }, { scale: pulseAnim }] }}>
      <TouchableOpacity
        style={styles.banner}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <View style={styles.bgGlow} />
        <Animated.Text style={{ fontSize: 28, opacity: fireOpacity }}>⚡</Animated.Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.flashLabel}>⚡ FLASH DEAL</Text>
          <Text style={styles.dealName}>{deal?.name}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.discount}>{deal?.discount}</Text>
          <Text style={styles.timerLabel}>Ends in</Text>
          <Text style={styles.timerValue}>{formatTime(timeLeft)}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#1A0808', borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: '#FF4757', overflow: 'hidden',
    shadowColor: '#FF4757', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 8,
  },
  bgGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,71,87,0.06)',
  },
  flashLabel: { fontSize: 9, color: '#FF4757', fontWeight: 'bold', letterSpacing: 2, marginBottom: 3 },
  dealName: { fontSize: 15, fontWeight: 'bold', color: '#fff' },
  discount: { fontSize: 20, fontWeight: 'bold', color: '#FF4757', marginBottom: 2 },
  timerLabel: { fontSize: 8, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 },
  timerValue: { fontSize: 13, fontWeight: 'bold', color: '#FFC107' },
});
