import { useState, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  SafeAreaView, Dimensions, StatusBar, FlatList
} from 'react-native';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1', icon: '🏍️',
    title: 'New Rahul\nAuto Spares',
    subtitle: 'Nandyal\'s trusted\ntwo-wheeler parts store',
    titleTe: 'నందయాల్ నంబర్ 1\nస్పేర్ పార్ట్స్ స్టోర్',
    color: '#4F6EF7',
  },
  {
    id: '2', icon: '🔍',
    title: 'Find Parts\nInstantly',
    subtitle: 'Search 500+ genuine OEM\nparts for your bike',
    titleTe: 'మీ బైక్‌కు అసలైన\nపార్ట్స్ వెతకండి',
    color: '#FFC107',
  },
  {
    id: '3', icon: '📦',
    title: 'Order & Track\nEasily',
    subtitle: 'Place orders and track\nfrom your phone',
    titleTe: 'ఫోన్‌లో ఆర్డర్ ఇచ్చి\nట్రాక్ చేయండి',
    color: '#4ADE80',
  },
  {
    id: '4', icon: '💎',
    title: 'Earn Loyalty\nRewards',
    subtitle: 'Every purchase earns\npoints for discounts!',
    titleTe: 'ప్రతి కొనుగోలుకు\nపాయింట్లు సంపాదించండి!',
    color: '#A78BFA',
  },
];

export default function WelcomeScreen({ onLogin, onDone }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatRef = useRef(null);
  const slide = SLIDES[activeIndex];

  const goNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      const nextIndex = activeIndex + 1;
      flatRef.current?.scrollToIndex({
        index: nextIndex, animated: true
      });
      setActiveIndex(nextIndex);
    } else {
      onLogin();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content"
        backgroundColor="#06060E" />

      <TouchableOpacity
        style={styles.skipBtn}
        onPress={onDone}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatRef}
        data={SLIDES}
        horizontal pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        keyExtractor={item => item.id}
        onMomentumScrollEnd={e => {
          const idx = Math.round(
            e.nativeEvent.contentOffset.x / width
          );
          setActiveIndex(idx);
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={[styles.iconRing,
              {
                borderColor: item.color + '40',
                backgroundColor: item.color + '12'
              }]}>
              <Text style={styles.slideIcon}>{item.icon}</Text>
            </View>
            <View style={styles.storeBadge}>
              <Text style={styles.storeBadgeText}>
                NEW RAHUL AUTO SPARES
              </Text>
            </View>
            <Text style={[styles.slideTitle,
              { color: item.color }]}>
              {item.title}
            </Text>
            <Text style={styles.slideTitleTe}>
              {item.titleTe}
            </Text>
            <Text style={styles.slideSubtitle}>
              {item.subtitle}
            </Text>
          </View>
        )}
      />

      <View style={styles.dotsRow}>
        {SLIDES.map((sl, i) => (
          <View
            key={i}
            style={[styles.dot,
              i === activeIndex && [
                styles.dotActive,
                { backgroundColor: slide.color }
              ]
            ]}
          />
        ))}
      </View>

      <TouchableOpacity
        style={[styles.nextBtn,
          { backgroundColor: slide.color }]}
        onPress={goNext}
      >
        <Text style={styles.nextBtnText}>
          {activeIndex === SLIDES.length - 1
            ? '🚀 Get Started!'
            : 'Next →'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.location}>
        📍 Telugu Peta, Nandyal · 518501
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#06060E', alignItems: 'center',
  },
  skipBtn: {
    alignSelf: 'flex-end', padding: 16, paddingHorizontal: 20,
  },
  skipText: {
    color: 'rgba(255,255,255,0.3)', fontSize: 15, fontWeight: '600',
  },
  slide: {
    alignItems: 'center', paddingHorizontal: 32, paddingTop: 20,
  },
  iconRing: {
    width: 140, height: 140, borderRadius: 70,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, marginBottom: 24,
  },
  slideIcon: { fontSize: 72 },
  storeBadge: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 6, marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  storeBadgeText: {
    fontSize: 10, color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2, fontWeight: 'bold',
  },
  slideTitle: {
    fontSize: 34, fontWeight: 'bold', textAlign: 'center',
    lineHeight: 42, marginBottom: 8,
  },
  slideTitleTe: {
    fontSize: 14, color: 'rgba(255,255,255,0.3)',
    textAlign: 'center', marginBottom: 16, lineHeight: 22,
  },
  slideSubtitle: {
    fontSize: 16, color: 'rgba(255,255,255,0.5)',
    textAlign: 'center', lineHeight: 26,
  },
  dotsRow: {
    flexDirection: 'row', gap: 8, marginBottom: 24,
  },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  dotActive: { width: 24, borderRadius: 4 },
  nextBtn: {
    width: '80%', padding: 18, borderRadius: 30,
    alignItems: 'center', marginBottom: 16,
  },
  nextBtnText: {
    color: '#ffffff', fontSize: 18, fontWeight: 'bold',
  },
  location: {
    fontSize: 12, color: 'rgba(255,255,255,0.2)', marginBottom: 16,
  },
});