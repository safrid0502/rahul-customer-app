import { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  SafeAreaView, StatusBar, ScrollView,
  Animated, Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const API_URL = 'https://rahul-auto-spares-backend.onrender.com';
const { width } = Dimensions.get('window');

const ACHIEVEMENTS = [
  {
    id: 'first_order',
    icon: '🎯', title: 'First Order!',
    titleTe: 'మొదటి ఆర్డర్!',
    desc: 'Placed your very first order',
    color: '#4F6EF7',
    reward: '+25 pts',
    check: (data) => data.orderCount >= 1
  },
  {
    id: 'five_orders',
    icon: '⭐', title: '5 Orders Club',
    titleTe: '5 ఆర్డర్లు!',
    desc: 'Placed 5 orders at the store',
    color: '#FFC107',
    reward: '+50 pts',
    check: (data) => data.orderCount >= 5
  },
  {
    id: 'ten_orders',
    icon: '🔥', title: 'Regular Customer',
    titleTe: 'రెగ్యులర్ కస్టమర్!',
    desc: 'Placed 10 or more orders',
    color: '#FF4757',
    reward: '+100 pts',
    check: (data) => data.orderCount >= 10
  },
  {
    id: 'hundred_points',
    icon: '💎', title: 'Points Collector',
    titleTe: 'పాయింట్స్ కలెక్టర్!',
    desc: 'Earned 100 loyalty points',
    color: '#A78BFA',
    reward: '+30 pts',
    check: (data) => data.totalPoints >= 100
  },
  {
    id: 'mechanic_friend',
    icon: '🔧', title: 'Mechanic Friend',
    titleTe: 'మెకానిక్ స్నేహితుడు!',
    desc: 'Referred a mechanic to the store',
    color: '#4ADE80',
    reward: '+75 pts',
    check: (data) => data.referrals >= 1
  },
  {
    id: 'early_bird',
    icon: '🌅', title: 'Early Bird',
    titleTe: 'ఎర్లీ బర్డ్!',
    desc: 'Ordered before 12 PM',
    color: '#00B4D8',
    reward: '+20 pts',
    check: (data) => data.morningOrder
  },
  {
    id: 'bike_doctor',
    icon: '🏥', title: 'Bike Doctor',
    titleTe: 'బైక్ డాక్టర్!',
    desc: 'Completed Bike Health Check',
    color: '#FF6B35',
    reward: '+15 pts',
    check: (data) => data.healthCheck
  },
  {
    id: 'lucky_spinner',
    icon: '🎡', title: 'Lucky Spinner',
    titleTe: 'లక్కీ స్పిన్నర్!',
    desc: 'Used the Lucky Spin feature',
    color: '#EC4899',
    reward: '+10 pts',
    check: (data) => data.spun
  },
];

function AchievementCard({ achievement, unlocked, delay }) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1, tension: 50, friction: 7,
          useNativeDriver: true
        }),
        Animated.timing(opacityAnim, {
          toValue: 1, duration: 400, useNativeDriver: true
        }),
      ]).start();
    }, delay);

    if (unlocked) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1, duration: 2000, useNativeDriver: true
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3, duration: 2000, useNativeDriver: true
          }),
        ])
      ).start();
    }
  }, []);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1], outputRange: [0.3, 0.8]
  });

  return (
    <Animated.View style={[
      styles.badge,
      !unlocked && styles.badgeLocked,
      {
        transform: [{ scale: scaleAnim }],
        opacity: opacityAnim,
        borderColor: unlocked
          ? achievement.color + '60'
          : 'rgba(255,255,255,0.08)'
      }
    ]}>
      {unlocked && (
        <Animated.View style={[styles.badgeGlow,
          {
            backgroundColor: achievement.color + '15',
            opacity: glowOpacity
          }]} />
      )}
      <View style={[styles.badgeIconWrap,
        {
          backgroundColor: unlocked
            ? achievement.color + '20'
            : 'rgba(255,255,255,0.05)'
        }]}>
        <Text style={[styles.badgeIcon,
          !unlocked && styles.badgeIconLocked]}>
          {unlocked ? achievement.icon : '🔒'}
        </Text>
      </View>
      <Text style={[styles.badgeTitle,
        !unlocked && styles.badgeTitleLocked]}>
        {unlocked ? achievement.title : '???'}
      </Text>
      <Text style={styles.badgeTitleTe}>
        {unlocked ? achievement.titleTe : 'కనుక్కోండి'}
      </Text>
      {unlocked ? (
        <>
          <Text style={styles.badgeDesc}>{achievement.desc}</Text>
          <View style={[styles.rewardBadge,
            { backgroundColor: achievement.color + '20' }]}>
            <Text style={[styles.rewardText,
              { color: achievement.color }]}>
              {achievement.reward}
            </Text>
          </View>
          <View style={styles.unlockedTag}>
            <Text style={styles.unlockedTagText}>✅ UNLOCKED</Text>
          </View>
        </>
      ) : (
        <Text style={styles.lockedDesc}>{achievement.desc}</Text>
      )}
    </Animated.View>
  );
}

export default function AchievementsScreen({ onBack, customer }) {
  const [data, setData] = useState({
    orderCount: 0,
    totalPoints: 0,
    referrals: 0,
    morningOrder: false,
    healthCheck: false,
    spun: false,
  });
  const [loading, setLoading] = useState(true);
  const [totalUnlocked, setTotalUnlocked] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ordersRes, loyaltyRes] = await Promise.all([
        fetch(`${API_URL}/orders/customer/${customer?.phone}`),
        fetch(`${API_URL}/loyalty/${customer?.phone}`)
      ]);
      const ordersData = await ordersRes.json();
      const loyaltyData = await loyaltyRes.json();

      const spinKey = `spin_${customer?.phone}`;
      const healthKey = `health_done_${customer?.phone}`;
      const [spinData, healthData] = await Promise.all([
        AsyncStorage.getItem(spinKey),
        AsyncStorage.getItem(healthKey)
      ]);

      const orders = ordersData.orders || [];
      const orderCount = orders.length;
      const morningOrder = orders.some(o => {
        if (!o.created_at) return false;
        const h = new Date(o.created_at).getHours();
        return h < 12;
      });

      const newData = {
        orderCount,
        totalPoints: loyaltyData.total_earned || 0,
        referrals: 0,
        morningOrder,
        healthCheck: !!healthData,
        spun: !!spinData,
      };
      setData(newData);

      const unlocked = ACHIEVEMENTS.filter(
        a => a.check(newData)
      ).length;
      setTotalUnlocked(unlocked);
    } catch {}
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content"
        backgroundColor="#06060E" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🏆 Achievements</Text>
        <View style={{ width: 70 }} />
      </View>

      {/* PROGRESS */}
      <View style={styles.progressCard}>
        <View style={styles.progressLeft}>
          <Text style={styles.progressCount}>
            {totalUnlocked}/{ACHIEVEMENTS.length}
          </Text>
          <Text style={styles.progressLabel}>Unlocked</Text>
        </View>
        <View style={styles.progressBarWrap}>
          <Text style={styles.progressTitle}>
            🏆 Achievement Progress
          </Text>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill,
              {
                width: `${(totalUnlocked/ACHIEVEMENTS.length)*100}%`
              }]} />
          </View>
          <Text style={styles.progressSub}>
            {ACHIEVEMENTS.length - totalUnlocked} more to unlock!
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        <Text style={styles.sectionLabel}>
          Your Achievements · మీ విజయాలు
        </Text>
        <View style={styles.badgesGrid}>
          {ACHIEVEMENTS.map((a, i) => (
            <AchievementCard
              key={a.id}
              achievement={a}
              unlocked={a.check(data)}
              delay={i * 80}
            />
          ))}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06060E' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,193,7,0.15)',
  },
  backBtn: {
    backgroundColor: 'rgba(255,193,7,0.1)', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1,
    borderColor: 'rgba(255,193,7,0.2)',
  },
  backBtnText: { color: '#FFC107', fontSize: 14, fontWeight: 'bold' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  progressCard: {
    backgroundColor: '#0E0E1C', margin: 12, borderRadius: 16,
    padding: 16, flexDirection: 'row', gap: 16, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,193,7,0.2)',
  },
  progressLeft: { alignItems: 'center' },
  progressCount: {
    fontSize: 32, fontWeight: 'bold', color: '#FFC107',
  },
  progressLabel: {
    fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 1,
  },
  progressBarWrap: { flex: 1 },
  progressTitle: {
    fontSize: 13, fontWeight: 'bold', color: '#fff', marginBottom: 8,
  },
  progressBg: {
    height: 8, backgroundColor: 'rgba(255,193,7,0.15)',
    borderRadius: 4, overflow: 'hidden', marginBottom: 6,
  },
  progressFill: {
    height: '100%', backgroundColor: '#FFC107', borderRadius: 4,
  },
  progressSub: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  grid: { padding: 12 },
  sectionLabel: {
    fontSize: 12, color: 'rgba(255,255,255,0.3)',
    letterSpacing: 2, marginBottom: 14, textTransform: 'uppercase',
  },
  badgesGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  badge: {
    width: (width - 44) / 2,
    backgroundColor: '#0E0E1C', borderRadius: 18, padding: 16,
    alignItems: 'center', gap: 6, borderWidth: 1,
    overflow: 'hidden', position: 'relative',
  },
  badgeLocked: { opacity: 0.5 },
  badgeGlow: {
    position: 'absolute', top: 0, left: 0,
    right: 0, bottom: 0,
  },
  badgeIconWrap: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  badgeIcon: { fontSize: 32 },
  badgeIconLocked: { opacity: 0.4 },
  badgeTitle: {
    fontSize: 13, fontWeight: 'bold', color: '#fff',
    textAlign: 'center',
  },
  badgeTitleLocked: { color: 'rgba(255,255,255,0.3)' },
  badgeTitleTe: {
    fontSize: 9, color: 'rgba(255,255,255,0.3)', textAlign: 'center',
  },
  badgeDesc: {
    fontSize: 10, color: 'rgba(255,255,255,0.4)',
    textAlign: 'center', lineHeight: 14,
  },
  lockedDesc: {
    fontSize: 10, color: 'rgba(255,255,255,0.2)',
    textAlign: 'center',
  },
  rewardBadge: {
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3,
    marginTop: 2,
  },
  rewardText: { fontSize: 11, fontWeight: 'bold' },
  unlockedTag: {
    backgroundColor: 'rgba(74,222,128,0.15)',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2,
  },
  unlockedTagText: {
    fontSize: 8, color: '#4ADE80', fontWeight: 'bold',
    letterSpacing: 1,
  },
});