import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Dimensions, View } from 'react-native';

const { width, height } = Dimensions.get('window');
const COLORS = ['#4F6EF7','#FFC107','#FF4757','#4ADE80','#A78BFA','#FF6B35','#00B4D8','#EC4899'];

function Particle({ delay }) {
  const startX = Math.random() * width;
  const y = useRef(new Animated.Value(-20)).current;
  const x = useRef(new Animated.Value(startX)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const size = Math.random() * 8 + 6;
  const isCircle = Math.random() > 0.5;
  const duration = 2000 + Math.random() * 2000;
  const driftX = (Math.random() - 0.5) * 100;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(y, { toValue: height + 30, duration, useNativeDriver: true }),
        Animated.timing(x, { toValue: startX + driftX, duration, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: Math.random() > 0.5 ? 6 : -6, duration, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(duration * 0.6),
          Animated.timing(opacity, { toValue: 0, duration: duration * 0.4, useNativeDriver: true }),
        ]),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  const spin = rotate.interpolate({ inputRange: [-6, 6], outputRange: ['-360deg', '360deg'] });

  return (
    <Animated.View style={{
      position: 'absolute', top: 0,
      transform: [{ translateX: x }, { translateY: y }, { rotate: spin }],
      opacity, width: size,
      height: isCircle ? size : size * 1.5,
      borderRadius: isCircle ? size / 2 : 2,
      backgroundColor: color,
    }} />
  );
}

export default function ConfettiEffect({ visible }) {
  if (!visible) return null;
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }} pointerEvents="none">
      {Array.from({ length: 40 }, (_, i) => (
        <Particle key={i} delay={i * 60} />
      ))}
    </View>
  );
}
