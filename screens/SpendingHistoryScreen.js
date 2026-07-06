import { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  SafeAreaView, StatusBar, ScrollView,
  Animated, Dimensions, RefreshControl
} from 'react-native';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const API_URL = 'https://rahul-auto-spares-backend.onrender.com';
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function AnimatedBar({ value, maxValue, color, delay = 0 }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: maxValue > 0 ? value / maxValue : 0,
      duration: 800, delay, useNativeDriver: false,
    }).start();
  }, [value, maxValue]);
  const height = anim.interpolate({ inputRange: [0,1], outputRange: ['0%','100%'] });
  return <Animated.View style={[bar.fill, { height, backgroundColor: color }]} />;
}
const bar = StyleSheet.create({ fill: { width: '100%', borderRadius: 6, minHeight: 2 } });

function StatCard({ icon, label, value, sublabel, color }) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1, tension: 60, friction: 8, useNativeDriver: true
    }).start();
  }, []);
  return (
    <Animated.View style={[sc.card, { transform: [{ scale: scaleAnim }], borderColor: color+'30' }]}>
      <View style={[sc.iconBox, { backgroundColor: color+'15' }]}>
        <Text style={sc.icon}>{icon}</Text>
      </View>
      <Text style={[sc.value, { color }]}>{value}</Text>
      <Text style={sc.label}>{label}</Text>
      {sublabel && <Text style={sc.sublabel}>{sublabel}</Text>}
    </Animated.View>
  );
}
const sc = StyleSheet.create({
  card: {
    flex: 1, backgroundColor: '#0E0E1C', borderRadius: 16,
    padding: 14, alignItems: 'center', gap: 6, borderWidth: 1,
  },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 22 },
  value: { fontSize: 22, fontWeight: 'bold' },
  label: { fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' },
  sublabel: { fontSize: 10, color: 'rgba(255,255,255,0.25)', textAlign: 'center' },
});

function getLevel(spent) {
  if (spent >= 10000) return { label: '💎 Diamond', color: '#60A5FA', next: null };
  if (spent >= 5000)  return { label: '🥇 Gold',    color: '#FFC107', next: `₹${(10000-spent).toFixed(0)} to Diamond` };
  if (spent >= 2000)  return { label: '🥈 Silver',  color: '#9CA3AF', next: `₹${(5000-spent).toFixed(0)} to Gold` };
  if (spent >= 500)   return { label: '🥉 Bronze',  color: '#CD7C3E', next: `₹${(2000-spent).toFixed(0)} to Silver` };
  return { label: '🌱 New', color: '#4ADE80', next: `₹${(500-spent).toFixed(0)} to Bronze` };
}

export default function SpendingHistoryScreen({ customer, onBack }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [period, setPeriod] = useState(6);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    setError(false);
    try {
      const r = await fetch(`${API_URL}/orders/customer/${customer?.phone}`);
      if (!r.ok) throw new Error('API error');
      const d = await r.json();
      setOrders(d.orders || []);
    } catch {
      setError(true);
      setOrders([]);
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  // ── CALCULATIONS ──
  const collectedOrders = orders.filter(o => o.status === 'collected');
  const totalSpent  = collectedOrders.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
  const totalOrders = collectedOrders.length;
  const avgOrder    = totalOrders > 0 ? totalSpent / totalOrders : 0;
  const pointsEarned = Math.floor(totalSpent / 50);
  const estimatedSavings = totalSpent * 0.15;
  const level = getLevel(totalSpent);

  const cashTotal = collectedOrders
    .filter(o => o.payment_type === 'cash')
    .reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
  const upiTotal = collectedOrders
    .filter(o => o.payment_type === 'upi')
    .reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);

  // Monthly chart
  const getMonthlyData = () => {
    const now = new Date();
    const months = [];
    for (let i = period - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: MONTHS[d.getMonth()],
        month: d.getMonth(), year: d.getFullYear(),
        spent: 0, orders: 0,
      });
    }
    collectedOrders.forEach(o => {
      const d = new Date(o.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const m = months.find(x => x.key === key);
      if (m) { m.spent += parseFloat(o.total_amount || 0); m.orders += 1; }
    });
    return months;
  };

  const monthlyData = getMonthlyData();
  const maxMonthly  = Math.max(...monthlyData.map(m => m.spent), 1);
  const bestMonth   = monthlyData.reduce((b, m) => m.spent > b.spent ? m : b, { spent: 0, label: '-' });

  const CHART_H = 120;

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#06060E" />

      {/* HEADER */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={onBack}>
          <Text style={s.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>📊 My Spending</Text>
          <Text style={s.headerSub}>{customer?.name} · +91 {customer?.phone}</Text>
        </View>
        <View style={[s.levelBadge, { borderColor: level.color+'60' }]}>
          <Text style={[s.levelText, { color: level.color }]}>{level.label}</Text>
        </View>
      </View>

      {loading ? (
        <View style={s.centerBox}>
          <Text style={{ fontSize: 36, marginBottom: 10 }}>📊</Text>
          <Text style={s.loadingText}>Loading your history...</Text>
        </View>
      ) : error ? (
        <View style={s.centerBox}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>📡</Text>
          <Text style={s.emptyTitle}>Could not load data</Text>
          <Text style={s.emptySub}>Check your internet connection</Text>
          <TouchableOpacity style={s.retryBtn} onPress={fetchOrders}>
            <Text style={s.retryBtnText}>🔄 Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing}
              onRefresh={onRefresh} tintColor="#4F6EF7" />
          }>

          {/* HERO */}
          <View style={s.heroCard}>
            <Text style={s.heroLabel}>TOTAL SPENT</Text>
            <Text style={s.heroValue}>
              ₹{totalSpent >= 1000 ? (totalSpent/1000).toFixed(1)+'k' : totalSpent.toFixed(0)}
            </Text>
            <Text style={s.heroSub}>Across {totalOrders} completed orders</Text>
            {level.next && (
              <View style={s.levelProgress}>
                <Text style={s.levelProgressText}>🎯 {level.next}</Text>
              </View>
            )}
            {totalOrders === 0 && (
              <Text style={s.noOrdersHint}>Place your first order to start tracking!</Text>
            )}
          </View>

          {/* STAT CARDS */}
          <View style={s.statsGrid}>
            <StatCard icon="📦" label="Orders" value={totalOrders} color="#4F6EF7" />
            <StatCard icon="💰" label="Avg Order"
              value={`₹${avgOrder.toFixed(0)}`} color="#FFC107" />
            <StatCard icon="💎" label="Points"
              value={pointsEarned} color="#A78BFA" sublabel="Earned Total" />
            <StatCard icon="🏆" label="Best Month"
              value={`₹${(bestMonth.spent/1000).toFixed(1)}k`}
              color="#4ADE80" sublabel={bestMonth.label} />
          </View>

          {/* SAVINGS */}
          {totalSpent > 0 && (
            <View style={s.savingsCard}>
              <View style={s.savingsLeft}>
                <Text style={s.savingsIcon}>🎉</Text>
                <View>
                  <Text style={s.savingsTitle}>Your Savings vs MRP</Text>
                  <Text style={s.savingsSub}>Avg 15% below market price</Text>
                </View>
              </View>
              <View style={s.savingsRight}>
                <Text style={s.savingsAmount}>
                  ₹{estimatedSavings >= 1000
                    ? (estimatedSavings/1000).toFixed(1)+'k'
                    : estimatedSavings.toFixed(0)}
                </Text>
                <Text style={s.savingsSaved}>SAVED</Text>
              </View>
            </View>
          )}

          {/* MONTHLY CHART */}
          <View style={s.chartCard}>
            <View style={s.chartHeader}>
              <Text style={s.chartTitle}>📈 Monthly Spending</Text>
              <View style={s.periodRow}>
                {[3, 6, 12].map(p => (
                  <TouchableOpacity key={p}
                    style={[s.periodBtn, period === p && s.periodBtnActive]}
                    onPress={async () => {
                      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setPeriod(p);
                    }}>
                    <Text style={[s.periodBtnText, period === p && { color: '#4F6EF7' }]}>
                      {p}M
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {monthlyData.every(m => m.spent === 0) ? (
              <View style={s.chartEmpty}>
                <Text style={s.chartEmptyText}>No spending data yet for this period</Text>
              </View>
            ) : (
              <View style={[s.chart, { height: CHART_H }]}>
                {monthlyData.map((m, i) => {
                  const isPeak = m.spent === bestMonth.spent && m.spent > 0;
                  return (
                    <View key={m.key} style={s.barCol}>
                      <View style={[s.barWrapper, { height: CHART_H - 30 }]}>
                        <AnimatedBar value={m.spent} maxValue={maxMonthly}
                          color={isPeak ? '#FFC107' : '#4F6EF7'} delay={i * 80} />
                      </View>
                      {m.spent > 0 && (
                        <Text style={s.barValue}>
                          {m.spent >= 1000 ? (m.spent/1000).toFixed(1)+'k' : m.spent.toFixed(0)}
                        </Text>
                      )}
                      <Text style={[s.barLabel, isPeak && { color: '#FFC107' }]}>
                        {m.label}
                      </Text>
                      {isPeak && <Text style={s.bestTag}>Best</Text>}
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* PAYMENT BREAKDOWN */}
          {totalSpent > 0 && (
            <View style={s.payCard}>
              <Text style={s.sectionTitle}>💳 Payment Breakdown</Text>
              <View style={s.payRow}>
                {[
                  { label: 'Cash', value: cashTotal, color: '#4ADE80', icon: '💵' },
                  { label: 'UPI',  value: upiTotal,  color: '#4F6EF7', icon: '📱' },
                  { label: 'Other',
                    value: Math.max(0, totalSpent - cashTotal - upiTotal),
                    color: '#FFC107', icon: '💰' },
                ].map((p, i) => {
                  const pct = totalSpent > 0 ? ((p.value / totalSpent) * 100).toFixed(0) : 0;
                  return (
                    <View key={i} style={s.payItem}>
                      <Text style={s.payIcon}>{p.icon}</Text>
                      <Text style={[s.payValue, { color: p.color }]}>
                        ₹{p.value >= 1000 ? (p.value/1000).toFixed(1)+'k' : p.value.toFixed(0)}
                      </Text>
                      <Text style={s.payLabel}>{p.label}</Text>
                      <View style={s.payBarBg}>
                        <View style={[s.payBarFill, { width: `${pct}%`, backgroundColor: p.color }]} />
                      </View>
                      <Text style={s.payPct}>{pct}%</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* ORDER HISTORY */}
          <View style={s.historyCard}>
            <Text style={s.sectionTitle}>📋 Order History</Text>
            {collectedOrders.length === 0 ? (
              <View style={s.noDataBox}>
                <Text style={s.noDataText}>No completed orders yet!</Text>
              </View>
            ) : (
              collectedOrders.slice(0, 10).map((order, i) => (
                <View key={i} style={[s.historyRow,
                  i === collectedOrders.slice(0,10).length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={s.historyLeft}>
                    <Text style={s.historyId}>
                      {order.custom_id || `RAS-${order.id}`}
                    </Text>
                    <Text style={s.historyDate}>
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </Text>
                  </View>
                  <View style={s.historyRight}>
                    <Text style={s.historyAmount}>
                      ₹{parseFloat(order.total_amount).toFixed(0)}
                    </Text>
                    <View style={[s.historyPay,
                      { backgroundColor: order.payment_type === 'upi'
                        ? 'rgba(79,110,247,0.15)' : 'rgba(74,222,128,0.15)' }]}>
                      <Text style={[s.historyPayText,
                        { color: order.payment_type === 'upi' ? '#4F6EF7' : '#4ADE80' }]}>
                        {order.payment_type === 'upi' ? '📱 UPI' : '💵 Cash'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
            {collectedOrders.length > 10 && (
              <Text style={s.moreOrders}>+{collectedOrders.length - 10} more orders</Text>
            )}
          </View>

          {/* LOYALTY SUMMARY */}
          <View style={s.loyaltyCard}>
            <Text style={s.sectionTitle}>💎 Loyalty Summary</Text>
            <View style={s.loyaltyGrid}>
              {[
                { label: 'Points Earned', value: pointsEarned, icon: '💎', color: '#A78BFA' },
                { label: 'Value',   value: `₹${pointsEarned}`,  icon: '💰', color: '#FFC107' },
                { label: 'Orders',  value: totalOrders,          icon: '📦', color: '#4F6EF7' },
                { label: 'Level',   value: level.label,          icon: '🏆', color: '#4ADE80' },
              ].map((item, i) => (
                <View key={i} style={[s.loyaltyItem, { borderColor: item.color+'30' }]}>
                  <Text style={s.loyaltyItemIcon}>{item.icon}</Text>
                  <Text style={[s.loyaltyItemValue, { color: item.color }]}>{item.value}</Text>
                  <Text style={s.loyaltyItemLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ height: 80 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06060E' },
  header: {
    backgroundColor: '#0E0E1C', paddingHorizontal: 16, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1,
    borderBottomColor: 'rgba(79,110,247,0.15)',
  },
  backBtn: {
    backgroundColor: 'rgba(79,110,247,0.1)', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1,
    borderColor: 'rgba(79,110,247,0.2)',
  },
  backBtnText: { color: '#4F6EF7', fontSize: 14, fontWeight: 'bold' },
  headerTitle: { fontSize: 17, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 },
  levelBadge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1.5 },
  levelText: { fontSize: 12, fontWeight: 'bold' },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10 },
  loadingText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  emptySub: { fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
  retryBtn: {
    backgroundColor: 'rgba(79,110,247,0.1)', borderRadius: 14,
    paddingHorizontal: 20, paddingVertical: 12, borderWidth: 1,
    borderColor: 'rgba(79,110,247,0.3)', marginTop: 8,
  },
  retryBtnText: { color: '#4F6EF7', fontWeight: 'bold', fontSize: 14 },
  heroCard: {
    margin: 16, backgroundColor: '#0E0E1C', borderRadius: 20,
    padding: 24, alignItems: 'center', borderWidth: 1,
    borderColor: 'rgba(79,110,247,0.2)', gap: 6,
  },
  heroLabel: { fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 3, marginBottom: 4 },
  heroValue: { fontSize: 48, fontWeight: 'bold', color: '#4F6EF7', marginBottom: 2 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  noOrdersHint: { fontSize: 12, color: 'rgba(79,110,247,0.5)', textAlign: 'center', marginTop: 4 },
  levelProgress: {
    marginTop: 10, backgroundColor: 'rgba(79,110,247,0.1)',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(79,110,247,0.2)',
  },
  levelProgressText: { color: '#4F6EF7', fontSize: 12, fontWeight: 'bold' },
  statsGrid: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  savingsCard: {
    marginHorizontal: 16, backgroundColor: '#0E0E1C', borderRadius: 16,
    padding: 16, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12, borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.25)',
  },
  savingsLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  savingsIcon: { fontSize: 32 },
  savingsTitle: { fontSize: 14, fontWeight: 'bold', color: '#fff', marginBottom: 2 },
  savingsSub: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  savingsRight: { alignItems: 'flex-end' },
  savingsAmount: { fontSize: 28, fontWeight: 'bold', color: '#4ADE80' },
  savingsSaved: { fontSize: 9, color: 'rgba(74,222,128,0.5)', letterSpacing: 2 },
  chartCard: {
    marginHorizontal: 16, backgroundColor: '#0E0E1C', borderRadius: 20,
    padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(79,110,247,0.15)',
  },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  chartTitle: { fontSize: 15, fontWeight: 'bold', color: '#fff' },
  periodRow: { flexDirection: 'row', gap: 6 },
  periodBtn: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(79,110,247,0.2)',
  },
  periodBtnActive: { backgroundColor: 'rgba(79,110,247,0.1)', borderColor: '#4F6EF7' },
  periodBtnText: { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' },
  chartEmpty: { alignItems: 'center', padding: 20 },
  chartEmptyText: { color: 'rgba(255,255,255,0.3)', fontSize: 12 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  barCol: { flex: 1, alignItems: 'center', gap: 2 },
  barWrapper: {
    width: '100%', justifyContent: 'flex-end',
    backgroundColor: 'rgba(79,110,247,0.06)', borderRadius: 6, overflow: 'hidden',
  },
  barValue: { fontSize: 8, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
  barLabel: { fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: 'bold' },
  bestTag: { fontSize: 7, color: '#FFC107', fontWeight: 'bold' },
  payCard: {
    marginHorizontal: 16, backgroundColor: '#0E0E1C', borderRadius: 20,
    padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(79,110,247,0.15)',
  },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#fff', marginBottom: 14 },
  payRow: { flexDirection: 'row', gap: 8 },
  payItem: { flex: 1, alignItems: 'center', gap: 4 },
  payIcon: { fontSize: 24 },
  payValue: { fontSize: 14, fontWeight: 'bold' },
  payLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)' },
  payBarBg: {
    width: '100%', height: 4, backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2, overflow: 'hidden',
  },
  payBarFill: { height: '100%', borderRadius: 2 },
  payPct: { fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 'bold' },
  historyCard: {
    marginHorizontal: 16, backgroundColor: '#0E0E1C', borderRadius: 20,
    padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(79,110,247,0.15)',
  },
  historyRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(79,110,247,0.08)',
  },
  historyLeft: { gap: 4 },
  historyId: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
  historyDate: { fontSize: 11, color: 'rgba(255,255,255,0.35)' },
  historyRight: { alignItems: 'flex-end', gap: 4 },
  historyAmount: { fontSize: 16, fontWeight: 'bold', color: '#FFC107' },
  historyPay: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  historyPayText: { fontSize: 10, fontWeight: 'bold' },
  moreOrders: { textAlign: 'center', color: '#4F6EF7', fontSize: 13, fontWeight: 'bold', paddingTop: 12 },
  loyaltyCard: {
    marginHorizontal: 16, backgroundColor: '#0E0E1C', borderRadius: 20,
    padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(167,139,250,0.2)',
  },
  loyaltyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  loyaltyItem: {
    width: (width - 64) / 2, backgroundColor: 'rgba(79,110,247,0.05)',
    borderRadius: 14, padding: 14, alignItems: 'center', gap: 4, borderWidth: 1,
  },
  loyaltyItemIcon: { fontSize: 26 },
  loyaltyItemValue: { fontSize: 18, fontWeight: 'bold' },
  loyaltyItemLabel: {
    fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase',
    letterSpacing: 1, textAlign: 'center',
  },
  noDataBox: { alignItems: 'center', padding: 20 },
  noDataText: { color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center' },
});