import { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, FlatList,
  TouchableOpacity, SafeAreaView, StatusBar,
  ScrollView, TextInput, Modal, Linking,
  Alert, Share, RefreshControl, Image,
  Animated, Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import SpinWheelScreen from './SpinWheelScreen';
import BikeHealthScreen from './BikeHealthScreen';
import AchievementsScreen from './AchievementsScreen';
import ConfettiEffect from '../components/ConfettiEffect';
import FlashDealBanner from '../components/FlashDealBanner';

const { width } = Dimensions.get('window');
const API_URL = 'https://rahul-auto-spares-backend.onrender.com';
const WHATSAPP = '916300281504';
const STORE_UPI = 'rahulautospares@paytm';
const PRODUCTS_KEY = 'products_cache_v2';

const getIcon = (sku) => {
  if (!sku) return '🔩';
  if (sku.startsWith('OIL')) return '🛢️';
  if (sku.startsWith('SPL')) return '⚙️';
  if (sku.startsWith('PAS')) return '🏍️';
  if (sku.startsWith('GLA')) return '✨';
  if (sku.startsWith('HFD')) return '🔧';
  return '🔩';
};

const CATEGORIES = [
  { id: 'all', label: '🔩 All Parts' },
  { id: 'OIL', label: '🛢️ Oils' },
  { id: 'SPL', label: '⚙️ Splendor' },
  { id: 'PAS', label: '🏍️ Passion' },
  { id: 'GLA', label: '✨ Glamour' },
  { id: 'HFD', label: '🔧 HF Deluxe' },
];

// ── BOTTOM NAV ──
function BottomNav({ active, onChange, cartCount, notifCount }) {
  const tabs = [
    { id: 'home', icon: '🏠', label: 'Home' },
    { id: 'browse', icon: '🔍', label: 'Browse' },
    { id: 'cart', icon: '🛒', label: 'Cart', badge: cartCount },
    { id: 'orders', icon: '📋', label: 'Orders' },
    { id: 'store', icon: '🏪', label: 'Store' },
  ];
  return (
    <View style={navStyles.bar}>
      {tabs.map(tab => (
        <TouchableOpacity
          key={tab.id} style={navStyles.tab}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onChange(tab.id);
          }}
        >
          <View style={navStyles.iconWrap}>
            <Text style={navStyles.icon}>{tab.icon}</Text>
            {tab.badge > 0 && (
              <View style={navStyles.badge}>
                <Text style={navStyles.badgeText}>{tab.badge}</Text>
              </View>
            )}
          </View>
          <Text style={[navStyles.label,
            active === tab.id && navStyles.labelActive]}>
            {tab.label}
          </Text>
          {active === tab.id && <View style={navStyles.dot} />}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const navStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row', backgroundColor: '#0E0E1C',
    borderTopWidth: 1,
    borderTopColor: 'rgba(79,110,247,0.15)',
    paddingBottom: 6, paddingTop: 8,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 2 },
  iconWrap: { position: 'relative', marginBottom: 3 },
  icon: { fontSize: 22 },
  badge: {
    position: 'absolute', top: -4, right: -8,
    backgroundColor: '#FF4757', borderRadius: 8,
    minWidth: 16, height: 16, alignItems: 'center',
    justifyContent: 'center', paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  label: {
    fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: '600',
  },
  labelActive: { color: '#4F6EF7' },
  dot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: '#4F6EF7', marginTop: 2,
  },
});

// ── SKELETON ──
function SkeletonCard() {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1, duration: 900, useNativeDriver: true
        }),
        Animated.timing(shimmer, {
          toValue: 0, duration: 900, useNativeDriver: true
        }),
      ])
    ).start();
  }, []);
  const opacity = shimmer.interpolate({
    inputRange: [0, 1], outputRange: [0.4, 0.9]
  });
  return (
    <Animated.View style={[skStyles.card, { opacity }]}>
      <View style={skStyles.icon} />
      <View style={{ flex: 1, gap: 8 }}>
        <View style={[skStyles.line, { width: '70%' }]} />
        <View style={[skStyles.line, { width: '40%', height: 10 }]} />
        <View style={[skStyles.line, { width: '55%', height: 10 }]} />
      </View>
      <View style={{ gap: 8, alignItems: 'flex-end' }}>
        <View style={[skStyles.line, { width: 50, height: 10 }]} />
        <View style={[skStyles.line, { width: 60, height: 22 }]} />
        <View style={[skStyles.line,
          { width: 60, height: 30, borderRadius: 8 }]} />
      </View>
    </Animated.View>
  );
}

const skStyles = StyleSheet.create({
  card: {
    backgroundColor: '#0E0E1C', borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 8, gap: 12, borderWidth: 1,
    borderColor: 'rgba(79,110,247,0.08)',
  },
  icon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#1A1A2E',
  },
  line: { height: 13, borderRadius: 6, backgroundColor: '#1A1A2E' },
});

export default function MainApp({
  customer, isMechanic, vehicle, onVehicleChange, onLogout
}) {
  const [tab, setTab] = useState('home');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [cart, setCart] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [applyPoints, setApplyPoints] = useState(false);
  const [pickupTime, setPickupTime] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [ratingStars, setRatingStars] = useState(0);
  const [offers, setOffers] = useState([]);

  // ── GEN Z FEATURES STATE ──
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [showBikeHealth, setShowBikeHealth] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [flashDeal] = useState({
    name: 'Engine Oil 1L',
    discount: '15% OFF',
    expiresInSeconds: 7200
  });

  // ── ANIMATIONS ──
  const headerScale = useRef(new Animated.Value(0.95)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(headerScale, {
        toValue: 1, tension: 50, friction: 7,
        useNativeDriver: true
      }),
      Animated.timing(headerOpacity, {
        toValue: 1, duration: 500, useNativeDriver: true
      }),
    ]).start();
    loadProducts();
    loadFavorites();
    loadRecentlyViewed();
    loadNotifications();
    fetchLoyaltyPoints();
    fetchOffers();
  }, []);

  const registerPush = async () => {
    // Push works in production APK, not Expo Go
  };

  const loadProducts = async () => {
    try {
      const r = await fetch(`${API_URL}/products`);
      const d = await r.json();
      setProducts(d.products || []);
      setOffline(false);
      await AsyncStorage.setItem(
        PRODUCTS_KEY, JSON.stringify(d.products || [])
      );
    } catch {
      try {
        const c = await AsyncStorage.getItem(PRODUCTS_KEY);
        if (c) { setProducts(JSON.parse(c)); setOffline(true); }
      } catch {}
    }
    setLoading(false);
  };

  const fetchOffers = async () => {
    try {
      const r = await fetch(`${API_URL}/offers`);
      const d = await r.json();
      setOffers(d.offers || []);
    } catch {}
  };

  const fetchLoyaltyPoints = async () => {
    try {
      const r = await fetch(
        `${API_URL}/loyalty/${customer?.phone}`
      );
      const d = await r.json();
      setLoyaltyPoints(d.points || 0);
    } catch {}
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadProducts();
    await fetchLoyaltyPoints();
    await fetchOffers();
    setRefreshing(false);
  };

  const loadFavorites = async () => {
    try {
      const s = await AsyncStorage.getItem(
        `fav_${customer?.phone}`
      );
      if (s) setFavorites(JSON.parse(s));
    } catch {}
  };

  const toggleFavorite = async (id) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const nf = favorites.includes(id)
      ? favorites.filter(x => x !== id)
      : [...favorites, id];
    setFavorites(nf);
    await AsyncStorage.setItem(
      `fav_${customer?.phone}`, JSON.stringify(nf)
    );
  };

  const loadRecentlyViewed = async () => {
    try {
      const s = await AsyncStorage.getItem(
        `recent_${customer?.phone}`
      );
      if (s) setRecentlyViewed(JSON.parse(s));
    } catch {}
  };

  const addToRecent = async (product) => {
    const nr = [
      product,
      ...recentlyViewed.filter(p => p.id !== product.id)
    ].slice(0, 8);
    setRecentlyViewed(nr);
    await AsyncStorage.setItem(
      `recent_${customer?.phone}`, JSON.stringify(nr)
    );
  };

  const loadNotifications = async () => {
    try {
      const s = await AsyncStorage.getItem(
        `notif_${customer?.phone}`
      );
      if (s) setNotifications(JSON.parse(s));
    } catch {}
  };

  const addNotification = async (n) => {
    const newN = {
      id: Date.now().toString(), read: false,
      time: new Date().toLocaleTimeString('en', {
        hour: '2-digit', minute: '2-digit'
      }),
      ...n
    };
    const updated = [newN, ...notifications].slice(0, 30);
    setNotifications(updated);
    await AsyncStorage.setItem(
      `notif_${customer?.phone}`, JSON.stringify(updated)
    );
  };

  const openProduct = (item) => {
    setSelectedProduct(item);
    setQty(1);
    addToRecent(item);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const addToCart = async (product, quantity = 1) => {
    await Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success
    );
    const price = getPrice(product);
    const existing = cart.find(c => c.id === product.id);
    if (existing) {
      setCart(cart.map(c =>
        c.id === product.id
          ? { ...c, qty: c.qty + quantity } : c
      ));
    } else {
      setCart([...cart, {
        ...product, qty: quantity, mechanic_price: price
      }]);
    }
    setSelectedProduct(null);
    setQty(1);
  };

  const shareProduct = async (product) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Share.share({
      message:
        `🏍️ *${product.name_en}*\n` +
        `✅ OEM Part · ${product.sku}\n` +
        `💰 ₹${product.selling_price} (MRP ₹${product.mrp})\n` +
        `🏪 New Rahul Auto Spares\n` +
        `📍 Telugu Peta, Nandyal\n📞 08514-244944`,
    });
  };

  const placeOrder = async () => {
    if (!pickupTime) {
      Alert.alert('⏰', 'Please select pickup time!');
      return;
    }
    await Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success
    );
    const msg =
      `🔔 *New Order!*\n` +
      `${isMechanic ? '🔧 MECHANIC\n' : ''}` +
      `👤 ${customer?.name} · +91${customer?.phone}\n` +
      `💰 ₹${finalTotal.toFixed(0)} · 📅 ${pickupTime}\n\n` +
      cart.map(i =>
        `• ${i.name_en} x${i.qty} = ₹${(
          (i.mechanic_price || i.selling_price) * i.qty
        ).toFixed(0)}`
      ).join('\n');

    Alert.alert(
      '🎉 Order Confirmed!',
      `Total: ₹${finalTotal.toFixed(0)}\nPickup: ${pickupTime}`,
      [{
        text: 'OK 🙏',
        onPress: async () => {
          // Confetti celebration!
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3500);

          if (applyPoints && pointsDiscount > 0) {
            await fetch(
              `${API_URL}/loyalty/${customer?.phone}/redeem`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ points: pointsDiscount })
              }
            ).catch(() => {});
            setLoyaltyPoints(p =>
              Math.max(0, p - pointsDiscount)
            );
          }

          const earned = Math.floor(finalTotal / 50);
          if (earned > 0) {
            await fetch(
              `${API_URL}/loyalty/${customer?.phone}/add`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ points: earned })
              }
            ).catch(() => {});
            setLoyaltyPoints(p => p + earned);
          }

          fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pickup_time: pickupTime,
              total_amount: finalTotal,
              customer_name: customer?.name,
              customer_phone: customer?.phone,
              items: cart
            })
          }).then(r => r.json()).then(async d => {
            await addNotification({
              type: 'order',
              title: '✅ Order Placed!',
              body: `${d.custom_id} · ₹${finalTotal.toFixed(0)}`
            });
          }).catch(() => {});

          const countStr =
            await AsyncStorage.getItem('order_count');
          const count = parseInt(countStr || '0') + 1;
          await AsyncStorage.setItem(
            'order_count', count.toString()
          );
          const rated =
            await AsyncStorage.getItem('has_rated');
          if (count === 3 && !rated) {
            setTimeout(() => setShowRating(true), 4000);
          }

          const enc = encodeURIComponent(msg);
          Linking.openURL(
            `https://wa.me/${WHATSAPP}?text=${enc}`
          );
          setCart([]);
          setPickupTime('');
          setApplyPoints(false);
          setTab('orders');
        }
      }]
    );
  };

  const handleLogout = () => {
    Alert.alert('Logout?', 'Remove saved profile?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: onLogout }
    ]);
  };

  const getPrice = (p) => isMechanic
    ? Math.round(p.selling_price * 0.95)
    : p.selling_price;

  const cartTotal = cart.reduce(
    (s, i) => s + (
      (i.mechanic_price || i.selling_price) * i.qty
    ), 0
  );
  const pointsDiscount = applyPoints
    ? Math.min(loyaltyPoints, Math.floor(cartTotal * 0.5))
    : 0;
  const finalTotal = Math.max(0, cartTotal - pointsDiscount);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const unread = notifications.filter(n => !n.read).length;

  const filtered = products
    .filter(p => category === 'all' || p.sku?.startsWith(category))
    .filter(p =>
      !search ||
      p.name_en?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase())
    );

  const favProducts = products.filter(
    p => favorites.includes(p.id)
  );

  const QUICK_ACTIONS = [
    {
      icon: '🔍', label: 'Browse Parts',
      labelTe: 'పార్ట్స్ చూడండి',
      color: '#4F6EF7', bg: 'rgba(79,110,247,0.15)',
      action: () => setTab('browse')
    },
    {
      icon: '📋', label: 'Track Orders',
      labelTe: 'ఆర్డర్ ట్రాక్',
      color: '#4ADE80', bg: 'rgba(74,222,128,0.15)',
      action: () => setTab('orders')
    },
    {
      icon: '🎡', label: 'Lucky Spin',
      labelTe: 'లక్కీ స్పిన్!',
      color: '#FF4757', bg: 'rgba(255,71,87,0.15)',
      action: () => setShowSpinWheel(true)
    },
    {
      icon: '🏍️', label: 'Bike Health',
      labelTe: 'బైక్ హెల్త్',
      color: '#FFC107', bg: 'rgba(255,193,7,0.15)',
      action: () => setShowBikeHealth(true)
    },
    {
      icon: '🏆', label: 'Achievements',
      labelTe: 'విజయాలు',
      color: '#A78BFA', bg: 'rgba(167,139,250,0.15)',
      action: () => setShowAchievements(true)
    },
    {
      icon: '🏪', label: 'Store Info',
      labelTe: 'స్టోర్ వివరాలు',
      color: '#00B4D8', bg: 'rgba(0,180,216,0.15)',
      action: () => setTab('store')
    },
  ];

  // ── GEN Z SCREENS ──
  if (showSpinWheel) {
    return (
      <SpinWheelScreen
        customer={customer}
        onBack={() => setShowSpinWheel(false)}
        onPointsEarned={(pts) => {
          setLoyaltyPoints(p => p + pts);
          addNotification({
            type: 'spin',
            title: '🎡 Lucky Spin!',
            body: `You won ${pts} points!`
          });
        }}
      />
    );
  }

  if (showBikeHealth) {
    return (
      <BikeHealthScreen
        onBack={() => setShowBikeHealth(false)}
        onBrowseParts={() => {
          setShowBikeHealth(false);
          setTab('browse');
        }}
      />
    );
  }

  if (showAchievements) {
    return (
      <AchievementsScreen
        customer={customer}
        onBack={() => setShowAchievements(false)}
      />
    );
  }

  // ── MAIN RENDER ──
  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content"
        backgroundColor="#06060E" />

      {/* CONFETTI OVERLAY */}
      <ConfettiEffect visible={showConfetti} />

      {/* HEADER */}
      <Animated.View style={[s.header,
        {
          transform: [{ scale: headerScale }],
          opacity: headerOpacity
        }
      ]}>
        <View style={{ flex: 1 }}>
          <Text style={s.headerBrand}>
            NEW RAHUL AUTO SPARES
          </Text>
          {offline && (
            <Text style={s.offlineTag}>📴 Offline mode</Text>
          )}
        </View>
        <View style={s.headerRight}>
          {isMechanic && (
            <View style={s.mechanicTag}>
              <Text style={s.mechanicTagText}>🔧 5%</Text>
            </View>
          )}
          {loyaltyPoints > 0 && (
            <View style={s.pointsTag}>
              <Text style={s.pointsTagText}>
                💎{loyaltyPoints}
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={s.notifBtn}
            onPress={() => setShowNotifs(true)}
          >
            <Text style={s.notifIcon}>🔔</Text>
            {unread > 0 && (
              <View style={s.notifBadge}>
                <Text style={s.notifBadgeText}>{unread}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={s.exitBtn}
            onPress={handleLogout}
          >
            <Text style={s.exitText}>Exit</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* BROWSE FILTERS */}
      {tab === 'browse' && (
        <>
          <View style={s.searchBox}>
            <Text style={s.searchIcon}>🔍</Text>
            <TextInput
              style={s.searchInput}
              placeholder="Search parts... / వెతకండి"
              placeholderTextColor="rgba(255,255,255,0.2)"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Text style={s.clearBtn}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <ScrollView
            horizontal showsHorizontalScrollIndicator={false}
            style={s.catScroll}
            contentContainerStyle={s.catRow}
          >
            {CATEGORIES.map(c => (
              <TouchableOpacity
                key={c.id}
                style={[s.catChip,
                  category === c.id && s.catChipActive]}
                onPress={() => {
                  Haptics.impactAsync(
                    Haptics.ImpactFeedbackStyle.Light
                  );
                  setCategory(c.id);
                }}
              >
                <Text style={[s.catChipText,
                  category === c.id && s.catChipTextActive]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      {/* CONTENT */}
      <View style={{ flex: 1 }}>

        {/* ══ HOME TAB ══ */}
        {tab === 'home' && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#4F6EF7"
                colors={['#4F6EF7']}
              />
            }
          >
            {/* GREETING */}
            <View style={s.greeting}>
              <View style={{ flex: 1 }}>
                <Text style={s.greetName}>
                  Hi, {customer?.name?.split(' ')[0]}! 👋
                </Text>
                <Text style={s.greetSub}>
                  What do you need today?
                </Text>
                {vehicle && (
                  <View style={s.vehicleChip}>
                    <Text style={s.vehicleChipText}>
                      🏍️ {vehicle.brand} {vehicle.model}
                    </Text>
                  </View>
                )}
              </View>
              {isMechanic && (
                <View style={s.mechBadge}>
                  <Text style={s.mechBadgeIcon}>🔧</Text>
                  <Text style={s.mechBadgeText}>5% OFF</Text>
                </View>
              )}
            </View>

            {/* LOYALTY CARD */}
            <TouchableOpacity
              style={s.loyaltyCard}
              onPress={() => setShowAchievements(true)}
              activeOpacity={0.85}
            >
              <View style={s.loyaltyLeft}>
                <Text style={s.loyaltyIcon}>💎</Text>
                <View>
                  <Text style={s.loyaltyTitle}>
                    Loyalty Points
                  </Text>
                  <Text style={s.loyaltyHint}>
                    {loyaltyPoints >= 10
                      ? `₹${loyaltyPoints} discount ready!`
                      : `Earn 1pt per ₹50 spent`}
                  </Text>
                </View>
              </View>
              <View style={s.loyaltyRight}>
                <Text style={s.loyaltyPts}>{loyaltyPoints}</Text>
                <Text style={s.loyaltyTapHint}>
                  View Achievements →
                </Text>
              </View>
            </TouchableOpacity>

            {/* FLASH DEAL */}
            <FlashDealBanner
              deal={flashDeal}
              onPress={() => setTab('browse')}
            />

            {/* OFFERS */}
            {offers.length > 0 && (
              <ScrollView
                horizontal showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.offersRow}
              >
                {offers.map(o => (
                  <View key={o.id} style={s.offerCard}>
                    <Text style={s.offerEmoji}>{o.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={s.offerTitle}>{o.title}</Text>
                      {o.discount_percent > 0 && (
                        <View style={s.offerBadge}>
                          <Text style={s.offerBadgeText}>
                            {o.discount_percent}% OFF
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}

            {/* QUICK ACTIONS — 6 GRID */}
            <View style={s.qaSection}>
              <Text style={s.qaSectionTitle}>Quick Actions</Text>
              <View style={s.qaGrid}>
                {QUICK_ACTIONS.map((a, i) => (
                  <TouchableOpacity
                    key={i}
                    style={s.qaCard}
                    onPress={() => {
                      Haptics.impactAsync(
                        Haptics.ImpactFeedbackStyle.Light
                      );
                      a.action();
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={[s.qaIconBox,
                      { backgroundColor: a.bg }]}>
                      <Text style={s.qaIcon}>{a.icon}</Text>
                    </View>
                    <Text style={[s.qaLabel,
                      { color: a.color }]}>
                      {a.label}
                    </Text>
                    <Text style={s.qaLabelTe}>{a.labelTe}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* GEN Z FEATURE PROMO CARDS */}
            <View style={s.promoRow}>
              <TouchableOpacity
                style={[s.promoCard,
                  { borderColor: 'rgba(255,71,87,0.4)',
                    backgroundColor: 'rgba(255,71,87,0.06)' }]}
                onPress={() => setShowSpinWheel(true)}
              >
                <Text style={s.promoIcon}>🎡</Text>
                <Text style={s.promoTitle}>Spin & Win!</Text>
                <Text style={s.promoSub}>
                  Points or discounts!
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.promoCard,
                  { borderColor: 'rgba(255,193,7,0.4)',
                    backgroundColor: 'rgba(255,193,7,0.06)' }]}
                onPress={() => setShowBikeHealth(true)}
              >
                <Text style={s.promoIcon}>🏍️</Text>
                <Text style={s.promoTitle}>Bike Health</Text>
                <Text style={s.promoSub}>
                  Free diagnosis!
                </Text>
              </TouchableOpacity>
            </View>

            {/* POPULAR PARTS */}
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>⭐ Popular Parts</Text>
              <TouchableOpacity onPress={() => setTab('browse')}>
                <Text style={s.seeAll}>See All →</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.hScroll}
            >
              {products.slice(0, 10).map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={s.miniCard}
                  onPress={() => openProduct(item)}
                  activeOpacity={0.8}
                >
                  <TouchableOpacity
                    style={s.miniHeart}
                    onPress={() => toggleFavorite(item.id)}
                  >
                    <Text>
                      {favorites.includes(item.id) ? '❤️' : '🤍'}
                    </Text>
                  </TouchableOpacity>
                  <Text style={s.miniCardIcon}>
                    {getIcon(item.sku)}
                  </Text>
                  <Text style={s.miniCardName} numberOfLines={2}>
                    {item.name_en}
                  </Text>
                  <Text style={s.miniCardMrp}>₹{item.mrp}</Text>
                  <Text style={s.miniCardPrice}>
                    ₹{getPrice(item)}
                  </Text>
                  {item.stock_qty > 0 && (
                    <TouchableOpacity
                      style={s.miniAddBtn}
                      onPress={() => addToCart(item, 1)}
                    >
                      <Text style={s.miniAddText}>+ Add</Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* RECENTLY VIEWED */}
            {recentlyViewed.length > 0 && (
              <>
                <View style={s.sectionHeader}>
                  <Text style={s.sectionTitle}>
                    🕐 Recently Viewed
                  </Text>
                </View>
                <ScrollView
                  horizontal showsHorizontalScrollIndicator={false}
                  contentContainerStyle={s.hScroll}
                >
                  {recentlyViewed.map(item => (
                    <TouchableOpacity
                      key={item.id}
                      style={[s.miniCard,
                        { borderColor: 'rgba(255,255,255,0.06)' }]}
                      onPress={() => openProduct(item)}
                    >
                      <Text style={s.miniCardIcon}>
                        {getIcon(item.sku)}
                      </Text>
                      <Text style={s.miniCardName} numberOfLines={2}>
                        {item.name_en}
                      </Text>
                      <Text style={s.miniCardPrice}>
                        ₹{getPrice(item)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {/* STORE HOURS */}
            <View style={s.hoursCard}>
              <Text style={s.hoursTitle}>🕐 Store Hours</Text>
              <View style={s.hoursRow}>
                <Text style={s.hoursDay}>Mon – Sat</Text>
                <Text style={s.hoursTime}>10:00 AM – 9:00 PM</Text>
              </View>
              <View style={s.hoursRow}>
                <Text style={s.hoursDay}>Sunday</Text>
                <Text style={s.hoursTime}>10:00 AM – 3:00 PM</Text>
              </View>
              <TouchableOpacity
                style={s.callBtn}
                onPress={() => Linking.openURL('tel:08514244944')}
              >
                <Text style={s.callBtnText}>
                  📞 08514-244944
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>
        )}

        {/* ══ BROWSE TAB ══ */}
        {tab === 'browse' && (
          loading ? (
            <FlatList
              data={[1,2,3,4,5,6]}
              keyExtractor={i => i.toString()}
              contentContainerStyle={{ padding: 12 }}
              renderItem={() => <SkeletonCard />}
            />
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={i => i.id.toString()}
              contentContainerStyle={{ padding: 12 }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#4F6EF7"
                />
              }
              ListHeaderComponent={() => (
                <Text style={s.countText}>
                  {filtered.length} products found
                </Text>
              )}
              ListEmptyComponent={() => (
                <View style={s.emptyBox}>
                  <Text style={{ fontSize: 48 }}>🔍</Text>
                  <Text style={s.emptyText}>No parts found</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setSearch(''); setCategory('all');
                    }}
                  >
                    <Text style={s.clearSearchText}>
                      Clear filters
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={s.productCard}
                  onPress={() => openProduct(item)}
                  activeOpacity={0.8}
                >
                  <View style={s.productLeft}>
                    <View style={s.productIconBox}>
                      <Text style={s.productIconText}>
                        {getIcon(item.sku)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.productName}>
                        {item.name_en}
                      </Text>
                      {item.name_te && (
                        <Text style={s.productNameTe}>
                          {item.name_te}
                        </Text>
                      )}
                      <Text style={s.productSku}>{item.sku}</Text>
                      <View style={[s.stockBadge,
                        item.stock_qty === 0 && s.stockBadgeOut]}>
                        <Text style={[s.stockText,
                          item.stock_qty === 0 && s.stockTextOut]}>
                          {item.stock_qty > 0
                            ? `✅ ${item.stock_qty} in stock`
                            : '❌ Out of stock'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={s.productRight}>
                    <TouchableOpacity
                      onPress={() => toggleFavorite(item.id)}
                    >
                      <Text style={{ fontSize: 18 }}>
                        {favorites.includes(item.id) ? '❤️' : '🤍'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => shareProduct(item)}
                    >
                      <Text style={{ fontSize: 16 }}>🔗</Text>
                    </TouchableOpacity>
                    <Text style={s.productMrp}>₹{item.mrp}</Text>
                    <Text style={s.productPrice}>
                      ₹{getPrice(item)}
                    </Text>
                    {isMechanic && (
                      <Text style={s.mechDiscount}>5% OFF</Text>
                    )}
                    {item.stock_qty > 0 && (
                      <TouchableOpacity
                        style={s.addBtn}
                        onPress={() => addToCart(item, 1)}
                      >
                        <Text style={s.addBtnText}>+ Add</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              )}
            />
          )
        )}

        {/* ══ FAVORITES TAB ══ */}
        {tab === 'favorites' && (
          favProducts.length === 0 ? (
            <View style={s.emptyBox}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>
                🤍
              </Text>
              <Text style={s.emptyText}>No favorites yet!</Text>
              <TouchableOpacity
                style={s.browseBtn}
                onPress={() => setTab('browse')}
              >
                <Text style={s.browseBtnText}>Browse Parts →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={favProducts}
              keyExtractor={i => i.id.toString()}
              contentContainerStyle={{ padding: 12 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={s.productCard}
                  onPress={() => openProduct(item)}
                >
                  <View style={s.productLeft}>
                    <View style={s.productIconBox}>
                      <Text style={s.productIconText}>
                        {getIcon(item.sku)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.productName}>
                        {item.name_en}
                      </Text>
                      <Text style={s.productSku}>{item.sku}</Text>
                    </View>
                  </View>
                  <View style={s.productRight}>
                    <TouchableOpacity
                      onPress={() => toggleFavorite(item.id)}
                    >
                      <Text style={{ fontSize: 18 }}>❤️</Text>
                    </TouchableOpacity>
                    <Text style={s.productMrp}>₹{item.mrp}</Text>
                    <Text style={s.productPrice}>
                      ₹{getPrice(item)}
                    </Text>
                    {item.stock_qty > 0 && (
                      <TouchableOpacity
                        style={s.addBtn}
                        onPress={() => addToCart(item, 1)}
                      >
                        <Text style={s.addBtnText}>+ Add</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              )}
            />
          )
        )}

        {/* ══ CART TAB ══ */}
        {tab === 'cart' && (
          cart.length === 0 ? (
            <View style={s.emptyBox}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>
                🛒
              </Text>
              <Text style={s.emptyText}>Cart is empty!</Text>
              <TouchableOpacity
                style={s.browseBtn}
                onPress={() => setTab('browse')}
              >
                <Text style={s.browseBtnText}>Browse Parts →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <View style={s.cartCustomer}>
                <Text style={s.cartCustomerName}>
                  {isMechanic ? '🔧' : '👤'} {customer?.name}
                </Text>
                <Text style={s.cartCustomerPhone}>
                  📱 +91 {customer?.phone}
                </Text>
              </View>

              {cart.map((item, i) => (
                <View key={i} style={s.cartItem}>
                  <Text style={s.cartItemIcon}>
                    {getIcon(item.sku)}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.cartItemName}>
                      {item.name_en}
                    </Text>
                    <View style={s.qtyRow}>
                      <TouchableOpacity
                        style={s.qtyBtn}
                        onPress={async () => {
                          await Haptics.impactAsync(
                            Haptics.ImpactFeedbackStyle.Light
                          );
                          if (item.qty === 1) {
                            setCart(cart.filter(
                              (_, j) => j !== i
                            ));
                          } else {
                            setCart(cart.map((c, j) =>
                              j === i
                                ? { ...c, qty: c.qty - 1 } : c
                            ));
                          }
                        }}
                      >
                        <Text style={s.qtyBtnText}>
                          {item.qty === 1 ? '🗑️' : '−'}
                        </Text>
                      </TouchableOpacity>
                      <Text style={s.qtyNum}>{item.qty}</Text>
                      <TouchableOpacity
                        style={s.qtyBtn}
                        onPress={async () => {
                          await Haptics.impactAsync(
                            Haptics.ImpactFeedbackStyle.Light
                          );
                          setCart(cart.map((c, j) =>
                            j === i
                              ? { ...c, qty: c.qty + 1 } : c
                          ));
                        }}
                      >
                        <Text style={s.qtyBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={s.cartItemPrice}>
                    ₹{(
                      (item.mechanic_price || item.selling_price)
                      * item.qty
                    ).toFixed(0)}
                  </Text>
                </View>
              ))}

              {loyaltyPoints >= 10 && (
                <TouchableOpacity
                  style={[s.loyaltyToggle,
                    applyPoints && s.loyaltyToggleOn]}
                  onPress={async () => {
                    await Haptics.impactAsync(
                      Haptics.ImpactFeedbackStyle.Medium
                    );
                    setApplyPoints(!applyPoints);
                  }}
                >
                  <Text style={s.loyaltyToggleText}>
                    💎 Use {loyaltyPoints} points
                    = ₹{Math.min(
                      loyaltyPoints,
                      Math.floor(cartTotal * 0.5)
                    )} off
                  </Text>
                  <View style={[s.toggleSwitch,
                    applyPoints && s.toggleSwitchOn]}>
                    <View style={[s.toggleKnob,
                      applyPoints && s.toggleKnobOn]} />
                  </View>
                </TouchableOpacity>
              )}

              <View style={s.pickupCard}>
                <Text style={s.pickupTitle}>
                  📅 Select Pickup Time
                </Text>
                <View style={s.pickupOptions}>
                  {[
                    'Today 11AM', 'Today 2PM', 'Today 5PM',
                    'Today 8PM', 'Tomorrow 11AM', 'Tomorrow 2PM'
                  ].map(t => (
                    <TouchableOpacity
                      key={t}
                      style={[s.pickupChip,
                        pickupTime === t && s.pickupChipActive]}
                      onPress={async () => {
                        await Haptics.impactAsync(
                          Haptics.ImpactFeedbackStyle.Light
                        );
                        setPickupTime(t);
                      }}
                    >
                      <Text style={[s.pickupChipText,
                        pickupTime === t &&
                        s.pickupChipTextActive]}>
                        {t}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={s.summaryCard}>
                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>
                    Items ({cartCount})
                  </Text>
                  <Text style={s.summaryValue}>
                    ₹{cartTotal.toFixed(0)}
                  </Text>
                </View>
                {pointsDiscount > 0 && (
                  <View style={s.summaryRow}>
                    <Text style={s.summaryLabel}>
                      💎 Points Discount
                    </Text>
                    <Text style={[s.summaryValue,
                      { color: '#4ADE80' }]}>
                      -₹{pointsDiscount}
                    </Text>
                  </View>
                )}
                <View style={[s.summaryRow, s.summaryTotal]}>
                  <Text style={s.summaryTotalLabel}>TOTAL</Text>
                  <Text style={s.summaryTotalValue}>
                    ₹{finalTotal.toFixed(0)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[s.orderBtn,
                  !pickupTime && { opacity: 0.4 }]}
                onPress={placeOrder}
                disabled={!pickupTime}
              >
                <Text style={s.orderBtnText}>
                  🔥 Place Order · ₹{finalTotal.toFixed(0)}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.upiBtn}
                onPress={() => {
                  Haptics.impactAsync(
                    Haptics.ImpactFeedbackStyle.Medium
                  );
                  Linking.openURL(
                    `upi://pay?pa=${STORE_UPI}` +
                    `&pn=New Rahul Auto Spares` +
                    `&am=${finalTotal.toFixed(2)}&cu=INR`
                  ).catch(() => Alert.alert(
                    '📱 UPI',
                    `Pay ₹${finalTotal.toFixed(0)} to:\n${STORE_UPI}`
                  ));
                }}
              >
                <Text style={s.upiBtnText}>
                  📱 Pay with UPI · ₹{finalTotal.toFixed(0)}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.callStoreBtn}
                onPress={() =>
                  Linking.openURL('tel:08514244944')}
              >
                <Text style={s.callStoreBtnText}>
                  📞 Call Store
                </Text>
              </TouchableOpacity>

              <View style={{ height: 80 }} />
            </ScrollView>
          )
        )}

        {/* ══ ORDERS TAB ══ */}
        {tab === 'orders' && (
          <OrdersTab customer={customer} />
        )}

        {/* ══ STORE TAB ══ */}
        {tab === 'store' && (
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <View style={s.storeCard}>
              <Text style={s.storeIcon}>🏪</Text>
              <Text style={s.storeName}>
                New Rahul Auto Spares
              </Text>
              <Text style={s.storeAddr}>
                Telugu Peta, Nandyal · 518501
              </Text>
            </View>
            {[
              {
                label: '📞 Phone', value: '08514-244944',
                action: () => Linking.openURL('tel:08514244944')
              },
              {
                label: '💬 WhatsApp', value: '+91 6300281504',
                action: () => Linking.openURL(
                  `https://wa.me/${WHATSAPP}`
                )
              },
              { label: '🕐 Mon–Sat', value: '10AM – 9PM' },
              { label: '🕐 Sunday', value: '10AM – 3PM' },
            ].map((r, i) => (
              <TouchableOpacity
                key={i} style={s.storeRow}
                onPress={r.action}
                disabled={!r.action}
              >
                <Text style={s.storeRowLabel}>{r.label}</Text>
                <Text style={[s.storeRowValue,
                  r.action && { color: '#4ADE80' }]}>
                  {r.value}
                </Text>
              </TouchableOpacity>
            ))}

            {/* GEN Z FEATURE BUTTONS IN STORE TAB */}
            <View style={s.storeFeatures}>
              <Text style={s.storeFeatTitle}>
                🔥 Try These Features!
              </Text>
              <TouchableOpacity
                style={s.storeFeatureBtn}
                onPress={() => setShowSpinWheel(true)}
              >
                <Text style={s.storeFeatureBtnIcon}>🎡</Text>
                <Text style={s.storeFeatureBtnText}>
                  Lucky Spin Wheel
                </Text>
                <Text style={s.storeFeatureBtnArrow}>→</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.storeFeatureBtn}
                onPress={() => setShowBikeHealth(true)}
              >
                <Text style={s.storeFeatureBtnIcon}>🏍️</Text>
                <Text style={s.storeFeatureBtnText}>
                  Free Bike Health Check
                </Text>
                <Text style={s.storeFeatureBtnArrow}>→</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.storeFeatureBtn}
                onPress={() => setShowAchievements(true)}
              >
                <Text style={s.storeFeatureBtnIcon}>🏆</Text>
                <Text style={s.storeFeatureBtnText}>
                  View Achievements
                </Text>
                <Text style={s.storeFeatureBtnArrow}>→</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>

      {/* BOTTOM NAV */}
      <BottomNav
        active={tab}
        onChange={setTab}
        cartCount={cartCount}
        notifCount={unread}
      />

      {/* FLOATING WHATSAPP */}
      <TouchableOpacity
        style={s.floatingWA}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          Linking.openURL(
            `https://wa.me/${WHATSAPP}?text=` +
            encodeURIComponent(
              `Hi! I need help. Customer: ${customer?.name}`
            )
          );
        }}
      >
        <Text style={s.floatingWAIcon}>💬</Text>
      </TouchableOpacity>

      {/* ══ PRODUCT DETAIL MODAL ══ */}
      <Modal
        visible={selectedProduct !== null}
        animationType="slide"
        onRequestClose={() => setSelectedProduct(null)}
      >
        {selectedProduct && (
          <SafeAreaView style={s.container}>
            <StatusBar barStyle="light-content"
              backgroundColor="#06060E" />
            <View style={s.modalHeader}>
              <TouchableOpacity
                style={s.modalBack}
                onPress={() => {
                  setSelectedProduct(null); setQty(1);
                }}
              >
                <Text style={s.modalBackText}>← Back</Text>
              </TouchableOpacity>
              <Text style={s.modalTitle}>Part Details</Text>
              <View style={s.modalActions}>
                <TouchableOpacity
                  onPress={() => shareProduct(selectedProduct)}
                >
                  <Text style={{ fontSize: 20 }}>🔗</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    toggleFavorite(selectedProduct.id)}
                >
                  <Text style={{ fontSize: 22 }}>
                    {favorites.includes(selectedProduct.id)
                      ? '❤️' : '🤍'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView>
              <View style={s.heroBox}>
                <Text style={s.heroIcon}>
                  {getIcon(selectedProduct.sku)}
                </Text>
                <View style={s.oemBadge}>
                  <Text style={s.oemText}>✅ Original OEM</Text>
                </View>
              </View>
              <View style={{ padding: 20 }}>
                <Text style={s.detailName}>
                  {selectedProduct.name_en}
                </Text>
                {selectedProduct.name_te && (
                  <Text style={s.detailNameTe}>
                    {selectedProduct.name_te}
                  </Text>
                )}
                <Text style={s.detailSku}>
                  {selectedProduct.sku}
                </Text>
                {isMechanic && (
                  <View style={s.mechBox}>
                    <Text style={s.mechBoxText}>
                      🔧 Mechanic 5% OFF Applied!
                    </Text>
                  </View>
                )}
                <View style={s.priceBox}>
                  <View>
                    <Text style={s.priceLabel}>MRP</Text>
                    <Text style={s.priceMrp}>
                      ₹{selectedProduct.mrp}
                    </Text>
                  </View>
                  <View style={s.priceDivider} />
                  <View>
                    <Text style={s.priceLabel}>Our Price</Text>
                    <Text style={s.priceSelling}>
                      ₹{getPrice(selectedProduct)}
                    </Text>
                  </View>
                  <View style={s.saveBadge}>
                    <Text style={s.saveText}>
                      Save{'\n'}
                      ₹{(
                        selectedProduct.mrp -
                        getPrice(selectedProduct)
                      ).toFixed(0)}
                    </Text>
                  </View>
                </View>
                <View style={s.stockRow}>
                  <View style={[s.stockDot,
                    {
                      backgroundColor:
                        selectedProduct.stock_qty > 0
                          ? '#4ADE80' : '#FF4757'
                    }]} />
                  <Text style={[s.stockLabel,
                    {
                      color: selectedProduct.stock_qty > 0
                        ? '#4ADE80' : '#FF4757'
                    }]}>
                    {selectedProduct.stock_qty > 0
                      ? `In Stock · ${selectedProduct.stock_qty} units`
                      : 'Out of Stock'}
                  </Text>
                </View>
                {selectedProduct.stock_qty > 0 && (
                  <>
                    <View style={s.qtySelector}>
                      <TouchableOpacity
                        style={s.qtyBtn}
                        onPress={() =>
                          setQty(Math.max(1, qty - 1))}
                      >
                        <Text style={s.qtyBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={s.qtyNum}>{qty}</Text>
                      <TouchableOpacity
                        style={s.qtyBtn}
                        onPress={() => setQty(Math.min(
                          selectedProduct.stock_qty, qty + 1
                        ))}
                      >
                        <Text style={s.qtyBtnText}>+</Text>
                      </TouchableOpacity>
                      <Text style={s.qtyTotal}>
                        = ₹{(
                          getPrice(selectedProduct) * qty
                        ).toFixed(0)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[s.orderBtn,
                        isMechanic && {
                          backgroundColor: '#FFC107'
                        }]}
                      onPress={() =>
                        addToCart(selectedProduct, qty)}
                    >
                      <Text style={[s.orderBtnText,
                        isMechanic && { color: '#06060E' }]}>
                        🛒 Add to Cart ·
                        ₹{(
                          getPrice(selectedProduct) * qty
                        ).toFixed(0)}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
                <TouchableOpacity
                  style={s.callStoreBtn}
                  onPress={() =>
                    Linking.openURL('tel:08514244944')}
                >
                  <Text style={s.callStoreBtnText}>
                    📞 Call Store
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>

      {/* ══ NOTIFICATIONS MODAL ══ */}
      <Modal
        visible={showNotifs}
        animationType="slide"
        onRequestClose={() => setShowNotifs(false)}
      >
        <SafeAreaView style={s.container}>
          <StatusBar barStyle="light-content"
            backgroundColor="#06060E" />
          <View style={s.modalHeader}>
            <TouchableOpacity
              style={s.modalBack}
              onPress={() => setShowNotifs(false)}
            >
              <Text style={s.modalBackText}>← Back</Text>
            </TouchableOpacity>
            <Text style={s.modalTitle}>🔔 Notifications</Text>
            {notifications.length > 0 && (
              <TouchableOpacity
                onPress={async () => {
                  const u = notifications.map(
                    n => ({ ...n, read: true })
                  );
                  setNotifications(u);
                  await AsyncStorage.setItem(
                    `notif_${customer?.phone}`,
                    JSON.stringify(u)
                  );
                }}
              >
                <Text style={{
                  color: '#4F6EF7', fontSize: 12
                }}>
                  Read All
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {notifications.length === 0 ? (
            <View style={s.emptyBox}>
              <Text style={{ fontSize: 48 }}>🔕</Text>
              <Text style={s.emptyText}>No notifications</Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={i => i.id}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <View style={[s.notifCard,
                  !item.read && s.notifCardUnread]}>
                  <Text style={s.notifIcon2}>
                    {item.type === 'order' ? '📦'
                      : item.type === 'spin' ? '🎡'
                      : item.type === 'ready' ? '🎉'
                      : '🔔'}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.notifTitle2}>
                      {item.title}
                    </Text>
                    <Text style={s.notifBody2}>{item.body}</Text>
                    <Text style={s.notifTime}>{item.time}</Text>
                  </View>
                  {!item.read && <View style={s.unreadDot} />}
                </View>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* ══ RATING MODAL ══ */}
      <Modal
        visible={showRating}
        transparent animationType="fade"
        onRequestClose={() => setShowRating(false)}
      >
        <View style={s.ratingOverlay}>
          <View style={s.ratingCard}>
            <Text style={s.ratingEmoji}>⭐</Text>
            <Text style={s.ratingTitle}>Enjoying the App?</Text>
            <Text style={s.ratingTe}>
              మీ అనుభవం రేట్ చేయండి!
            </Text>
            <View style={s.starsRow}>
              {[1,2,3,4,5].map(star => (
                <TouchableOpacity
                  key={star}
                  onPress={async () => {
                    await Haptics.impactAsync(
                      Haptics.ImpactFeedbackStyle.Medium
                    );
                    setRatingStars(star);
                  }}
                >
                  <Text style={s.star}>
                    {star <= ratingStars ? '⭐' : '☆'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.ratingBtns}>
              <TouchableOpacity
                style={s.laterBtn}
                onPress={() => setShowRating(false)}
              >
                <Text style={s.laterText}>Later</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.submitRating,
                  ratingStars === 0 && { opacity: 0.4 }]}
                disabled={ratingStars === 0}
                onPress={async () => {
                  setShowRating(false);
                  await AsyncStorage.setItem('has_rated', 'true');
                  if (ratingStars === 5) {
                    Linking.openURL(
                      'market://details?id=com.rahulautospares'
                    ).catch(() => {});
                  }
                }}
              >
                <Text style={s.submitRatingText}>
                  Submit ⭐
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// ── ORDERS TAB COMPONENT ──
function OrdersTab({ customer }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('active');

  const API_URL = 'https://rahul-auto-spares-backend.onrender.com';

  const STATUS_STEPS = [
    {
      key: 'new', label: 'Placed', icon: '📋',
      color: '#4F6EF7'
    },
    {
      key: 'packing', label: 'Packing', icon: '📦',
      color: '#FFC107'
    },
    {
      key: 'ready', label: 'Ready!', icon: '✅',
      color: '#4ADE80'
    },
    {
      key: 'collected', label: 'Done', icon: '🏁',
      color: 'rgba(255,255,255,0.3)'
    },
  ];

  const getStepIndex = (status) => {
    const m = { new: 0, packing: 1, ready: 2, collected: 3 };
    return m[status] ?? 0;
  };

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const r = await fetch(
        `${API_URL}/orders/customer/${customer?.phone}`
      );
      const d = await r.json();
      setOrders(d.orders || []);
    } catch {}
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const active = orders.filter(o => o.status !== 'collected');
  const displayed = filter === 'active' ? active : orders;
  const orderId = (o) => o.custom_id || `RAS-${o.id}`;

  if (loading) {
    return (
      <View style={os.centerBox}>
        <Text style={os.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={os.filterRow}>
        {[
          { id: 'active', label: `Active (${active.length})` },
          { id: 'all', label: `All (${orders.length})` }
        ].map(f => (
          <TouchableOpacity
            key={f.id}
            style={[os.filterBtn,
              filter === f.id && os.filterBtnActive]}
            onPress={() => setFilter(f.id)}
          >
            <Text style={[os.filterText,
              filter === f.id && os.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {displayed.length === 0 ? (
        <View style={os.centerBox}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>
            📋
          </Text>
          <Text style={os.emptyText}>
            {filter === 'active'
              ? 'No active orders!'
              : 'No orders yet!'}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#4F6EF7"
            />
          }
        >
          {displayed.map(order => {
            const currentStep = getStepIndex(order.status);
            const qrUrl =
              `https://api.qrserver.com/v1/create-qr-code/` +
              `?size=140x140&data=${orderId(order)}` +
              `&bgcolor=0E0E1C&color=4F6EF7&qzone=2`;

            return (
              <View key={order.id} style={os.orderCard}>
                <View style={os.orderHeader}>
                  <View>
                    <Text style={os.orderId}>
                      {orderId(order)}
                    </Text>
                    <Text style={os.orderPickup}>
                      📅 {order.pickup_time || '—'}
                    </Text>
                  </View>
                  <View style={os.orderRight}>
                    <Text style={os.orderAmount}>
                      ₹{order.total_amount}
                    </Text>
                    {order.status === 'ready' && (
                      <TouchableOpacity
                        style={os.callBtn}
                        onPress={() =>
                          Linking.openURL('tel:08514244944')}
                      >
                        <Text style={os.callBtnText}>
                          📞 Call
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {order.status === 'ready' && (
                  <View style={os.readyBanner}>
                    <Text style={os.readyText}>
                      🎉 Ready! Come pick up now!
                    </Text>
                  </View>
                )}

                {/* TIMELINE */}
                <View style={os.timeline}>
                  {STATUS_STEPS.map((step, i) => {
                    const done = i < currentStep;
                    const current = i === currentStep;
                    const pending = i > currentStep;
                    return (
                      <View key={step.key} style={os.step}>
                        {i > 0 && (
                          <View style={[os.stepLine,
                            done && {
                              backgroundColor: step.color
                            }]} />
                        )}
                        <View style={[os.stepIcon,
                          done && {
                            backgroundColor: step.color + '20',
                            borderColor: step.color
                          },
                          current && {
                            backgroundColor: step.color + '20',
                            borderColor: step.color
                          },
                          pending && {
                            borderColor: 'rgba(255,255,255,0.1)'
                          }]}>
                          <Text style={[os.stepEmoji,
                            pending && { opacity: 0.2 }]}>
                            {done ? '✓' : step.icon}
                          </Text>
                        </View>
                        <Text style={[os.stepLabel,
                          done && { color: '#4ADE80' },
                          current && { color: step.color },
                          pending && {
                            color: 'rgba(255,255,255,0.2)'
                          }]}>
                          {step.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {/* QR CODE */}
                {order.status !== 'collected' && (
                  <View style={os.qrSection}>
                    <Text style={os.qrTitle}>
                      📱 Show QR at Pickup
                    </Text>
                    <Image
                      source={{ uri: qrUrl }}
                      style={os.qrImage}
                      resizeMode="contain"
                    />
                    <Text style={os.qrId}>{orderId(order)}</Text>
                  </View>
                )}
              </View>
            );
          })}
          <View style={{ height: 80 }} />
        </ScrollView>
      )}
    </View>
  );
}

const os = StyleSheet.create({
  centerBox: {
    flex: 1, alignItems: 'center',
    justifyContent: 'center', padding: 40,
  },
  loadingText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  emptyText: {
    fontSize: 16, color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
  },
  filterRow: {
    flexDirection: 'row', padding: 12, gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(79,110,247,0.15)',
  },
  filterBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 10,
    alignItems: 'center', borderWidth: 1,
    borderColor: 'rgba(79,110,247,0.2)',
  },
  filterBtnActive: {
    backgroundColor: '#4F6EF7', borderColor: '#4F6EF7',
  },
  filterText: {
    fontSize: 13, color: 'rgba(255,255,255,0.4)',
    fontWeight: '700',
  },
  filterTextActive: { color: '#fff' },
  orderCard: {
    backgroundColor: '#0E0E1C', borderRadius: 16,
    padding: 16, marginBottom: 14, borderWidth: 1,
    borderColor: 'rgba(79,110,247,0.2)',
  },
  orderHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginBottom: 14,
  },
  orderId: {
    fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 4,
  },
  orderPickup: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  orderRight: { alignItems: 'flex-end', gap: 6 },
  orderAmount: {
    fontSize: 20, fontWeight: 'bold', color: '#FFC107',
  },
  callBtn: {
    backgroundColor: '#4ADE80', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  callBtnText: {
    color: '#06060E', fontWeight: 'bold', fontSize: 12,
  },
  readyBanner: {
    backgroundColor: 'rgba(74,222,128,0.1)', borderRadius: 10,
    padding: 10, marginBottom: 14, borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.3)',
  },
  readyText: {
    color: '#4ADE80', fontWeight: 'bold', fontSize: 13,
  },
  timeline: { flexDirection: 'row', marginBottom: 14 },
  step: { flex: 1, alignItems: 'center', position: 'relative' },
  stepLine: {
    position: 'absolute', top: 18, right: '50%',
    left: '-50%', height: 2,
    backgroundColor: 'rgba(79,110,247,0.1)',
  },
  stepIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 6, zIndex: 1, borderWidth: 2,
    borderColor: 'rgba(79,110,247,0.2)',
    backgroundColor: '#0E0E1C',
  },
  stepEmoji: { fontSize: 14 },
  stepLabel: {
    fontSize: 9, fontWeight: 'bold', color: '#fff',
    textAlign: 'center',
  },
  qrSection: {
    alignItems: 'center', paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(79,110,247,0.15)',
  },
  qrTitle: {
    fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 10,
  },
  qrImage: {
    width: 140, height: 140, borderRadius: 8, marginBottom: 8
  },
  qrId: {
    fontSize: 16, fontWeight: 'bold', color: '#4F6EF7',
    letterSpacing: 2,
  },
});

// ── MAIN STYLES ──
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06060E' },
  header: {
    backgroundColor: '#0E0E1C', paddingHorizontal: 16,
    paddingVertical: 12, flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(79,110,247,0.15)',
  },
  headerBrand: {
    fontSize: 13, fontWeight: 'bold', color: '#fff', letterSpacing: 1,
  },
  offlineTag: { fontSize: 10, color: '#FFC107', marginTop: 2 },
  headerRight: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  mechanicTag: {
    backgroundColor: 'rgba(255,193,7,0.15)', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1,
    borderColor: 'rgba(255,193,7,0.3)',
  },
  mechanicTagText: {
    color: '#FFC107', fontSize: 10, fontWeight: 'bold',
  },
  pointsTag: {
    backgroundColor: 'rgba(255,193,7,0.1)', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1,
    borderColor: 'rgba(255,193,7,0.2)',
  },
  pointsTagText: { color: '#FFC107', fontSize: 10 },
  notifBtn: { position: 'relative', padding: 4 },
  notifIcon: { fontSize: 20 },
  notifBadge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: '#FF4757', borderRadius: 6,
    minWidth: 14, height: 14, alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadgeText: {
    color: '#fff', fontSize: 8, fontWeight: 'bold',
  },
  exitBtn: {
    backgroundColor: 'rgba(255,71,87,0.1)', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1,
    borderColor: 'rgba(255,71,87,0.2)',
  },
  exitText: { color: '#FF4757', fontSize: 11, fontWeight: 'bold' },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0E0E1C', margin: 10, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1,
    borderColor: 'rgba(79,110,247,0.2)', gap: 10,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, color: '#fff', fontSize: 14 },
  clearBtn: { color: 'rgba(255,255,255,0.3)', fontSize: 16 },
  catScroll: { maxHeight: 46 },
  catRow: {
    paddingHorizontal: 12, paddingBottom: 8, gap: 8,
    flexDirection: 'row', alignItems: 'center',
  },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(79,110,247,0.2)',
    backgroundColor: 'rgba(79,110,247,0.06)',
  },
  catChipActive: {
    backgroundColor: '#4F6EF7', borderColor: '#4F6EF7',
  },
  catChipText: {
    fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: '700',
  },
  catChipTextActive: { color: '#fff' },
  greeting: {
    padding: 20, flexDirection: 'row', alignItems: 'flex-start',
  },
  greetName: {
    fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4,
  },
  greetSub: {
    fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 10,
  },
  vehicleChip: {
    backgroundColor: 'rgba(79,110,247,0.1)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
    alignSelf: 'flex-start', borderWidth: 1,
    borderColor: 'rgba(79,110,247,0.2)',
  },
  vehicleChipText: {
    color: '#4F6EF7', fontSize: 12, fontWeight: 'bold',
  },
  mechBadge: {
    backgroundColor: 'rgba(255,193,7,0.1)', borderRadius: 12,
    padding: 10, alignItems: 'center', borderWidth: 1,
    borderColor: 'rgba(255,193,7,0.2)',
  },
  mechBadgeIcon: { fontSize: 24 },
  mechBadgeText: {
    color: '#FFC107', fontSize: 10, fontWeight: 'bold',
  },
  loyaltyCard: {
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: 'rgba(255,193,7,0.06)', borderRadius: 16,
    padding: 16, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', borderWidth: 1,
    borderColor: 'rgba(255,193,7,0.2)',
  },
  loyaltyLeft: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  loyaltyIcon: { fontSize: 28 },
  loyaltyTitle: {
    fontSize: 14, fontWeight: 'bold', color: '#FFC107',
  },
  loyaltyHint: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  loyaltyRight: { alignItems: 'flex-end' },
  loyaltyPts: {
    fontSize: 36, fontWeight: 'bold', color: '#FFC107',
  },
  loyaltyTapHint: {
    fontSize: 9, color: 'rgba(255,193,7,0.5)', marginTop: 2,
  },
  offersRow: { paddingHorizontal: 16, paddingBottom: 8, gap: 10 },
  offerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,193,7,0.06)', borderRadius: 14,
    padding: 12, borderWidth: 1,
    borderColor: 'rgba(255,193,7,0.2)', minWidth: 200,
  },
  offerEmoji: { fontSize: 24 },
  offerTitle: {
    fontSize: 13, fontWeight: 'bold', color: '#FFC107',
  },
  offerBadge: {
    backgroundColor: '#FFC107', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2, marginTop: 4,
    alignSelf: 'flex-start',
  },
  offerBadgeText: {
    fontSize: 10, color: '#06060E', fontWeight: 'bold',
  },
  qaSection: { paddingHorizontal: 16, marginBottom: 4 },
  qaSectionTitle: {
    fontSize: 13, color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2, marginBottom: 12, textTransform: 'uppercase',
  },
  qaGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    marginBottom: 16,
  },
  qaCard: {
    width: (width - 52) / 3,
    backgroundColor: '#0E0E1C', borderRadius: 16,
    padding: 12, alignItems: 'center', gap: 6, borderWidth: 1,
    borderColor: 'rgba(79,110,247,0.12)',
  },
  qaIconBox: {
    width: 46, height: 46, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  qaIcon: { fontSize: 24 },
  qaLabel: {
    fontSize: 11, fontWeight: 'bold', textAlign: 'center',
  },
  qaLabelTe: {
    fontSize: 8, color: 'rgba(255,255,255,0.25)',
    textAlign: 'center',
  },
  promoRow: {
    flexDirection: 'row', paddingHorizontal: 16,
    gap: 10, marginBottom: 16,
  },
  promoCard: {
    flex: 1, borderRadius: 16, padding: 16,
    alignItems: 'center', gap: 4, borderWidth: 1,
  },
  promoIcon: { fontSize: 32, marginBottom: 4 },
  promoTitle: {
    fontSize: 14, fontWeight: 'bold', color: '#fff',
  },
  promoSub: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 16, fontWeight: 'bold', color: '#fff',
  },
  seeAll: { fontSize: 13, color: '#4F6EF7', fontWeight: 'bold' },
  hScroll: { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  miniCard: {
    backgroundColor: '#0E0E1C', borderRadius: 14, padding: 12,
    width: 130, borderWidth: 1,
    borderColor: 'rgba(79,110,247,0.15)', position: 'relative',
  },
  miniHeart: { position: 'absolute', top: 8, right: 8 },
  miniCardIcon: { fontSize: 30, marginBottom: 8, marginTop: 8 },
  miniCardName: {
    fontSize: 12, fontWeight: 'bold', color: '#fff',
    marginBottom: 4, lineHeight: 16,
  },
  miniCardMrp: {
    fontSize: 10, color: 'rgba(255,255,255,0.25)',
    textDecorationLine: 'line-through',
  },
  miniCardPrice: {
    fontSize: 16, fontWeight: 'bold', color: '#FFC107',
    marginBottom: 8,
  },
  miniAddBtn: {
    backgroundColor: '#4F6EF7', borderRadius: 8,
    padding: 6, alignItems: 'center',
  },
  miniAddText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  hoursCard: {
    margin: 16, backgroundColor: '#0E0E1C', borderRadius: 16,
    padding: 16, borderWidth: 1,
    borderColor: 'rgba(79,110,247,0.15)',
  },
  hoursTitle: {
    fontSize: 14, fontWeight: 'bold', color: '#fff', marginBottom: 12,
  },
  hoursRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1,
    borderBottomColor: 'rgba(79,110,247,0.08)',
  },
  hoursDay: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  hoursTime: { fontSize: 13, color: '#fff', fontWeight: '600' },
  callBtn: {
    marginTop: 12, backgroundColor: 'rgba(74,222,128,0.1)',
    borderRadius: 12, padding: 12, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(74,222,128,0.2)',
  },
  callBtnText: {
    color: '#4ADE80', fontSize: 14, fontWeight: 'bold',
  },
  countText: {
    fontSize: 11, color: 'rgba(255,255,255,0.25)', paddingBottom: 8,
  },
  productCard: {
    backgroundColor: '#0E0E1C', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    borderColor: 'rgba(79,110,247,0.15)', marginBottom: 8, gap: 10,
  },
  productLeft: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  productIconBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(79,110,247,0.08)', alignItems: 'center',
    justifyContent: 'center', borderWidth: 1,
    borderColor: 'rgba(79,110,247,0.12)',
  },
  productIconText: { fontSize: 22 },
  productName: {
    fontSize: 13, fontWeight: 'bold', color: '#fff', marginBottom: 2,
  },
  productNameTe: {
    fontSize: 10, color: 'rgba(79,110,247,0.5)', marginBottom: 2,
  },
  productSku: {
    fontSize: 9, color: 'rgba(79,110,247,0.5)',
    letterSpacing: 1, marginBottom: 4,
  },
  stockBadge: {
    backgroundColor: 'rgba(74,222,128,0.1)', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
    alignSelf: 'flex-start', borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.2)',
  },
  stockBadgeOut: {
    backgroundColor: 'rgba(255,71,87,0.08)',
    borderColor: 'rgba(255,71,87,0.2)',
  },
  stockText: { fontSize: 9, color: '#4ADE80' },
  stockTextOut: { color: '#FF4757' },
  productRight: { alignItems: 'flex-end', gap: 4 },
  productMrp: {
    fontSize: 10, color: 'rgba(255,255,255,0.25)',
    textDecorationLine: 'line-through',
  },
  productPrice: {
    fontSize: 17, fontWeight: 'bold', color: '#FFC107',
  },
  mechDiscount: { fontSize: 9, color: '#FFC107' },
  addBtn: {
    backgroundColor: '#4F6EF7', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  addBtnText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  emptyBox: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 40, gap: 12,
  },
  emptyText: {
    fontSize: 16, color: 'rgba(255,255,255,0.4)',
    fontWeight: 'bold',
  },
  clearSearchText: { color: '#4F6EF7', fontWeight: 'bold' },
  browseBtn: {
    backgroundColor: 'rgba(79,110,247,0.1)', borderRadius: 14,
    paddingHorizontal: 20, paddingVertical: 12, borderWidth: 1,
    borderColor: 'rgba(79,110,247,0.2)',
  },
  browseBtnText: { color: '#4F6EF7', fontWeight: 'bold' },
  cartCustomer: {
    backgroundColor: '#0E0E1C', borderRadius: 14, padding: 14,
    marginBottom: 12, borderWidth: 1,
    borderColor: 'rgba(79,110,247,0.15)',
  },
  cartCustomerName: {
    fontSize: 15, fontWeight: 'bold', color: '#fff', marginBottom: 2,
  },
  cartCustomerPhone: {
    fontSize: 12, color: 'rgba(255,255,255,0.4)',
  },
  cartItem: {
    backgroundColor: '#0E0E1C', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    borderColor: 'rgba(79,110,247,0.15)', marginBottom: 8, gap: 10,
  },
  cartItemIcon: { fontSize: 26 },
  cartItemName: {
    fontSize: 13, fontWeight: 'bold', color: '#fff', marginBottom: 8,
  },
  cartItemPrice: {
    fontSize: 18, fontWeight: 'bold', color: '#FFC107',
  },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtySelector: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, marginBottom: 16,
  },
  qtyBtn: {
    width: 36, height: 36, backgroundColor: '#0E0E1C',
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(79,110,247,0.3)',
  },
  qtyBtnText: {
    fontSize: 18, color: '#4F6EF7', fontWeight: 'bold',
  },
  qtyNum: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  qtyTotal: { fontSize: 16, color: '#FFC107', fontWeight: 'bold' },
  loyaltyToggle: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,193,7,0.05)', borderRadius: 14,
    padding: 14, marginBottom: 10, borderWidth: 1,
    borderColor: 'rgba(255,193,7,0.2)',
  },
  loyaltyToggleOn: {
    backgroundColor: 'rgba(74,222,128,0.06)',
    borderColor: 'rgba(74,222,128,0.3)',
  },
  loyaltyToggleText: {
    fontSize: 13, color: '#FFC107', fontWeight: 'bold', flex: 1,
  },
  toggleSwitch: {
    width: 44, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', padding: 2,
  },
  toggleSwitchOn: { backgroundColor: '#4ADE80' },
  toggleKnob: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignSelf: 'flex-start',
  },
  toggleKnobOn: { backgroundColor: '#fff', alignSelf: 'flex-end' },
  pickupCard: {
    backgroundColor: '#0E0E1C', borderRadius: 14, padding: 14,
    marginBottom: 10, borderWidth: 1,
    borderColor: 'rgba(79,110,247,0.15)',
  },
  pickupTitle: {
    fontSize: 14, fontWeight: 'bold', color: '#fff', marginBottom: 12,
  },
  pickupOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pickupChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(79,110,247,0.2)',
  },
  pickupChipActive: {
    backgroundColor: '#4F6EF7', borderColor: '#4F6EF7',
  },
  pickupChipText: {
    fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: '600',
  },
  pickupChipTextActive: { color: '#fff' },
  summaryCard: {
    backgroundColor: '#0E0E1C', borderRadius: 14, padding: 14,
    marginBottom: 10, borderWidth: 1,
    borderColor: 'rgba(255,193,7,0.15)',
  },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  summaryValue: { fontSize: 13, color: '#fff', fontWeight: '600' },
  summaryTotal: {
    borderTopWidth: 1, borderTopColor: 'rgba(255,193,7,0.15)',
    paddingTop: 10, marginTop: 4,
  },
  summaryTotalLabel: {
    fontSize: 15, fontWeight: 'bold', color: '#fff',
  },
  summaryTotalValue: {
    fontSize: 22, fontWeight: 'bold', color: '#FFC107',
  },
  orderBtn: {
    backgroundColor: '#FF4757', borderRadius: 18,
    padding: 16, alignItems: 'center', marginBottom: 10,
  },
  orderBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  upiBtn: {
    backgroundColor: 'rgba(79,110,247,0.12)', borderRadius: 18,
    padding: 14, alignItems: 'center', marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(79,110,247,0.3)',
  },
  upiBtnText: {
    color: '#4F6EF7', fontSize: 14, fontWeight: 'bold',
  },
  callStoreBtn: {
    backgroundColor: 'rgba(74,222,128,0.1)', borderRadius: 18,
    padding: 14, alignItems: 'center', borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.2)',
  },
  callStoreBtnText: {
    color: '#4ADE80', fontSize: 14, fontWeight: 'bold',
  },
  storeCard: {
    backgroundColor: '#0E0E1C', borderRadius: 16, padding: 20,
    alignItems: 'center', marginBottom: 16, borderWidth: 1,
    borderColor: 'rgba(79,110,247,0.15)',
  },
  storeIcon: { fontSize: 48, marginBottom: 10 },
  storeName: {
    fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 4,
  },
  storeAddr: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  storeRow: {
    backgroundColor: '#0E0E1C', borderRadius: 14, padding: 16,
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8, borderWidth: 1,
    borderColor: 'rgba(79,110,247,0.15)',
  },
  storeRowLabel: { fontSize: 14, color: 'rgba(255,255,255,0.5)' },
  storeRowValue: { fontSize: 14, color: '#fff', fontWeight: '600' },
  storeFeatures: {
    marginTop: 16, backgroundColor: '#0E0E1C', borderRadius: 16,
    padding: 16, borderWidth: 1,
    borderColor: 'rgba(79,110,247,0.15)',
  },
  storeFeatTitle: {
    fontSize: 14, fontWeight: 'bold', color: '#fff', marginBottom: 12,
  },
  storeFeatureBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1,
    borderBottomColor: 'rgba(79,110,247,0.08)',
  },
  storeFeatureBtnIcon: { fontSize: 22 },
  storeFeatureBtnText: {
    flex: 1, fontSize: 14, color: '#fff', fontWeight: '600',
  },
  storeFeatureBtnArrow: { fontSize: 16, color: '#4F6EF7' },
  floatingWA: {
    position: 'absolute', bottom: 70, right: 16,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#25D366', alignItems: 'center',
    justifyContent: 'center', elevation: 8, zIndex: 999,
    shadowColor: '#25D366', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4, shadowRadius: 6,
  },
  floatingWAIcon: { fontSize: 26 },
  modalHeader: {
    backgroundColor: '#0E0E1C', padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(79,110,247,0.15)',
  },
  modalBack: {
    backgroundColor: 'rgba(79,110,247,0.1)', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1,
    borderColor: 'rgba(79,110,247,0.2)',
  },
  modalBackText: { color: '#4F6EF7', fontSize: 14, fontWeight: 'bold' },
  modalTitle: {
    flex: 1, fontSize: 16, fontWeight: 'bold', color: '#fff',
  },
  modalActions: {
    flexDirection: 'row', gap: 10, alignItems: 'center',
  },
  heroBox: {
    height: 180, backgroundColor: '#0E0E1C', alignItems: 'center',
    justifyContent: 'center',
  },
  heroIcon: { fontSize: 80 },
  oemBadge: {
    position: 'absolute', bottom: 12,
    backgroundColor: 'rgba(74,222,128,0.12)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 5, borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.3)',
  },
  oemText: { fontSize: 12, color: '#4ADE80', fontWeight: 'bold' },
  detailName: {
    fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4,
  },
  detailNameTe: {
    fontSize: 14, color: 'rgba(79,110,247,0.6)', marginBottom: 6,
  },
  detailSku: {
    fontSize: 11, color: 'rgba(255,255,255,0.3)',
    letterSpacing: 2, marginBottom: 14,
  },
  mechBox: {
    backgroundColor: 'rgba(255,193,7,0.08)', borderRadius: 12,
    padding: 12, marginBottom: 14, borderWidth: 1,
    borderColor: 'rgba(255,193,7,0.2)',
  },
  mechBoxText: {
    color: '#FFC107', fontWeight: 'bold', fontSize: 13,
  },
  priceBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0E0E1C', borderRadius: 14, padding: 16,
    gap: 16, marginBottom: 14, borderWidth: 1,
    borderColor: 'rgba(255,193,7,0.15)',
  },
  priceLabel: {
    fontSize: 10, color: 'rgba(255,255,255,0.3)',
    marginBottom: 4, textTransform: 'uppercase',
  },
  priceMrp: {
    fontSize: 18, color: 'rgba(255,255,255,0.25)',
    textDecorationLine: 'line-through',
  },
  priceDivider: {
    width: 1, height: 40, backgroundColor: 'rgba(255,193,7,0.15)',
  },
  priceSelling: {
    fontSize: 28, fontWeight: 'bold', color: '#FFC107',
  },
  saveBadge: {
    marginLeft: 'auto', backgroundColor: 'rgba(74,222,128,0.1)',
    borderRadius: 10, padding: 10, borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.2)', alignItems: 'center',
  },
  saveText: {
    fontSize: 11, color: '#4ADE80', fontWeight: 'bold',
    textAlign: 'center',
  },
  stockRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, marginBottom: 16,
  },
  stockDot: { width: 10, height: 10, borderRadius: 5 },
  stockLabel: { fontSize: 14, fontWeight: '600' },
  notifCard: {
    backgroundColor: '#0E0E1C', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: 'rgba(79,110,247,0.15)',
    marginBottom: 10,
  },
  notifCardUnread: { borderColor: 'rgba(79,110,247,0.4)' },
  notifIcon2: { fontSize: 26 },
  notifTitle2: {
    fontSize: 14, fontWeight: 'bold', color: '#fff', marginBottom: 2,
  },
  notifBody2: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  notifTime: {
    fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 2,
  },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#4F6EF7',
  },
  ratingOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center', justifyContent: 'center', padding: 30,
  },
  ratingCard: {
    backgroundColor: '#0E0E1C', borderRadius: 24, padding: 28,
    width: '100%', alignItems: 'center', borderWidth: 1,
    borderColor: 'rgba(255,193,7,0.25)',
  },
  ratingEmoji: { fontSize: 48, marginBottom: 12 },
  ratingTitle: {
    fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4,
  },
  ratingTe: {
    fontSize: 13, color: 'rgba(79,110,247,0.5)', marginBottom: 20,
  },
  starsRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  star: { fontSize: 36 },
  ratingBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  laterBtn: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14, padding: 14, alignItems: 'center',
  },
  laterText: { color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' },
  submitRating: {
    flex: 2, backgroundColor: '#FFC107', borderRadius: 14,
    padding: 14, alignItems: 'center',
  },
  submitRatingText: {
    color: '#06060E', fontWeight: 'bold', fontSize: 15,
  },
});