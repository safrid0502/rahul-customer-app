import { useState, useEffect, useRef, memo, useCallback } from 'react';
import {
  StyleSheet, Text, View, FlatList,
  TouchableOpacity, SafeAreaView, StatusBar,
  ScrollView, TextInput, Modal, Linking,
  Alert, Share, RefreshControl, Image,
  Animated, Dimensions, PanResponder
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import CustomerProfileScreen from './CustomerProfileScreen';
import BikeHealthScreen from './BikeHealthScreen';
import ConfettiEffect from '../components/ConfettiEffect';
import FlashDealBanner from '../components/FlashDealBanner';

const { width } = Dimensions.get('window');
const API_URL = 'https://rahul-auto-spares-backend.onrender.com';
const WHATSAPP = '916300281504';
const STORE_UPI = 'rahulautospares@paytm';
const PRODUCTS_KEY = 'products_cache_v4';

const getPartLabel = (sku) => {
  if (!sku) return { label: 'PART', color: '#4F6EF7', bg: 'rgba(79,110,247,0.15)' };
  if (sku.includes('BRK')) return { label: 'BRAKE', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' };
  if (sku.includes('AIR')) return { label: 'AIR', color: '#06B6D4', bg: 'rgba(6,182,212,0.12)' };
  if (sku.includes('CHN')) return { label: 'CHAIN', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' };
  if (sku.includes('SPK')) return { label: 'SPARK', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' };
  if (sku.includes('CLT')) return { label: 'CLUTCH', color: '#10B981', bg: 'rgba(16,185,129,0.12)' };
  if (sku.includes('CAM')) return { label: 'CAM', color: '#F97316', bg: 'rgba(249,115,22,0.12)' };
  if (sku.includes('SUS')) return { label: 'SUSP', color: '#6366F1', bg: 'rgba(99,102,241,0.12)' };
  if (sku.includes('MTR')) return { label: 'METER', color: '#14B8A6', bg: 'rgba(20,184,166,0.12)' };
  if (sku.includes('LCK')) return { label: 'LOCK', color: '#EC4899', bg: 'rgba(236,72,153,0.12)' };
  if (sku.startsWith('OIL')) return { label: 'OIL', color: '#D97706', bg: 'rgba(217,119,6,0.12)' };
  if (sku.includes('HRO')) return { label: 'HERO', color: '#E31837', bg: 'rgba(227,24,55,0.12)' };
  if (sku.includes('HND')) return { label: 'HONDA', color: '#CC0000', bg: 'rgba(204,0,0,0.12)' };
  if (sku.includes('TVS')) return { label: 'TVS', color: '#0050A0', bg: 'rgba(0,80,160,0.12)' };
  if (sku.includes('BAJ')) return { label: 'BAJAJ', color: '#1A237E', bg: 'rgba(26,35,126,0.12)' };
  return { label: 'PART', color: '#4F6EF7', bg: 'rgba(79,110,247,0.12)' };
};
const getIcon = (sku) => getPartLabel(sku).label;

const CATEGORIES = [
  { id: 'all',     label: '🔩 All Parts' },
  { id: 'OIL',     label: '🛢️ Oils' },
  { id: 'HRO-SPL', label: '⚙️ Splendor' },
  { id: 'HRO-PAS', label: '🏍️ Passion' },
  { id: 'HRO-GLA', label: '✨ Glamour' },
  { id: 'HRO-HFD', label: '🔧 HF Deluxe' },
  { id: 'HND-CBS', label: '🔴 CB Shine' },
  { id: 'HND-ACT', label: '🛵 Activa' },
  { id: 'HND-DYG', label: '🟠 Dream Yuga' },
  { id: 'TVS-APR', label: '🏁 Apache' },
  { id: 'BAJ-P15', label: '⚡ Pulsar 150' },
  { id: 'BAJ-PLT', label: '🔵 Platina' },
];

const getSkuForVehicle = (v) => {
  if (!v) return null;
  const m = v.model?.toLowerCase();
  const b = v.brand?.toLowerCase();
  // Honda models
  if (m?.includes('shine') || m?.includes('cb shine')) return 'HND-CBS';
  if (m?.includes('activa')) return 'HND-ACT';
  if (m?.includes('dream yuga')) return 'HND-DYG';
  if (m?.includes('sp 125')) return 'HND-SP1';
  if (m?.includes('unicorn')) return 'HND-UNI';
  if (m?.includes('livo')) return 'HND-LIV';
  if (m?.includes('hornet')) return 'HND-HRN';
  if (m?.includes('dio')) return 'HND-DIO';
  if (m?.includes('cb350')) return 'HND-CB3';
  // Hero models
  if (m?.includes('splendor+') || m?.includes('splendor plus')) return 'HRO-SPL';
  if (m?.includes('splendor pro')) return 'HRO-SPP';
  if (m?.includes('splendor')) return 'HRO-SPL';
  if (m?.includes('passion')) return 'HRO-PAS';
  if (m?.includes('glamour')) return 'HRO-GLA';
  if (m?.includes('hf deluxe')) return 'HRO-HFD';
  if (m?.includes('xtreme')) return 'HRO-XTR';
  if (m?.includes('super splendor')) return 'HRO-SSP';
  if (m?.includes('maestro')) return 'HRO-MAE';
  if (m?.includes('destini')) return 'HRO-DES';
  // TVS models
  if (m?.includes('apache')) return 'TVS-APR';
  if (m?.includes('jupiter')) return 'TVS-JPT';
  // Bajaj models
  if (m?.includes('pulsar 150')) return 'BAJ-P15';
  if (m?.includes('platina')) return 'BAJ-PLT';
  // fallback to vehicle SKU from VehicleSelectScreen
  return v.sku || null;
};

// ── BOTTOM NAV ──
function BottomNav({ active, onChange, cartCount, notifCount }) {
  const tabs = [
    { id: 'home',    icon: 'home-outline',       label: 'Home' },
    { id: 'browse',  icon: 'search-outline',      label: 'Browse' },
    { id: 'cart',    icon: 'cart-outline',        label: 'Cart', badge: cartCount },
    { id: 'orders',  icon: 'receipt-outline',     label: 'Orders' },
    { id: 'store',   icon: 'storefront-outline',  label: 'Store' },
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
            <Ionicons
              name={active === tab.id ? tab.icon.replace('-outline','') : tab.icon}
              size={24}
              color={active === tab.id ? '#C9A84C' : 'rgba(255,255,255,0.35)'}
            />
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
  labelActive: { color: '#C9A84C' },
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
  customer, isMechanic, vehicle, vehicles, onVehicleChange, onVehicleAdd, onLogout
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
  const [orderNote, setOrderNote] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [ratingStars, setRatingStars] = useState(0);
  const [offers, setOffers] = useState([]);

  // ── GEN Z FEATURES STATE ──
  const [showProfile, setShowProfile] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showBikeHealth, setShowBikeHealth] = useState(false);
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

  // Auto-set category when vehicle is selected
  useEffect(() => {
    const sku = getSkuForVehicle(vehicle);
    if (sku) setCategory(sku);
  }, [vehicle]);

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


  const reorderItems = async (order) => {
    try {
      const r = await fetch(`${API_URL}/orders/${order.id}/items`);
      const d = await r.json();
      const items = d.items || [];
      items.forEach(item => {
        const product = products.find(p => p.sku === item.sku);
        if (product) addToCart(product, item.quantity || item.qty || 1);
      });
      setTab('cart');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Error', 'Could not load order items');
    }
  };

  const placeOrder = async () => {
    if (!pickupTime) {
      Alert.alert('Pickup Time Required', 'Please enter when you will collect the order.\n\nExample: Today 5PM or Tomorrow 11AM');
      return;
    }
    if (cart.length === 0) {
      Alert.alert('Cart Empty', 'Please add parts to your cart before placing order.');
      return;
    }
    await Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success
    );
    const itemsList = cart.map((i, idx) =>
      `${idx+1}. ${i.name_en}\n   SKU: ${i.sku} · Qty: ${i.qty} · ₹${((i.mechanic_price || i.selling_price) * i.qty).toFixed(0)}`
    ).join('\n');

    const msg =
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🏪 *NEW RAHUL AUTO SPARES*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `📋 *NEW ORDER*${isMechanic ? ' · 🔧 MECHANIC' : ''}\n\n` +
      `👤 *Customer:* ${customer?.name}\n` +
      `📱 *Phone:* +91 ${customer?.phone}\n` +
      `📅 *Pickup:* ${pickupTime}\n` +
      (orderNote ? `📝 *Note:* ${orderNote}\n` : '') +
      `\n` +
      `🛒 *Items Ordered:*\n` +
      `${itemsList}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 *Total: ₹${finalTotal.toFixed(0)}*\n` +
      (applyPoints ? `🎁 Points Used: ₹${pointsDiscount.toFixed(0)}\n` : '') +
      `━━━━━━━━━━━━━━━━━━━━`;

    Alert.alert(
      '🎉 Order Confirmed!',
      `Total: ₹${finalTotal.toFixed(0)}\nPickup: ${pickupTime}`,
      [{
        text: 'OK 🙏',
        onPress: async () => {
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
          setOrderNote('');
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

  const vehicleSku = getSkuForVehicle(vehicle);

  const filtered = products
    .filter(p => {
      if (category !== 'all') return p.sku?.startsWith(category);
      if (vehicleSku) return p.sku?.startsWith(vehicleSku);
      return true;
    })
    .filter(p =>
      !search ||
      p.name_en?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase())
    );

  const favProducts = products.filter(
    p => favorites.includes(p.id)
  );

  const QUICK_ACTIONS = [  // Professional icon labels
    {
      icon: 'search', label: 'Browse Parts',
      labelTe: 'పార్ట్స్ చూడండి',
      color: '#4F6EF7', bg: 'rgba(79,110,247,0.15)',
      action: () => setTab('browse')
    },
    {
      icon: 'receipt-outline', label: 'Track Orders',
      labelTe: 'ఆర్డర్ ట్రాక్',
      color: '#4ADE80', bg: 'rgba(74,222,128,0.15)',
      action: () => setTab('orders')
    },
    {
      icon: 'build', label: 'Bike Health',
      labelTe: 'బైక్ హెల్త్',
      color: '#FFC107', bg: 'rgba(255,193,7,0.15)',
      action: () => setShowBikeHealth(true)
    },
    {
      icon: 'storefront-outline', label: 'Store Info',
      labelTe: 'స్టోర్ వివరాలు',
      color: '#00B4D8', bg: 'rgba(0,180,216,0.15)',
      action: () => setTab('store')
    },
    {
      icon: 'bookmark-outline', label: 'Saved Parts',
      labelTe: 'సేవ్ చేసినవి',
      color: '#EF4444', bg: 'rgba(239,68,68,0.15)',
      action: () => setTab('favorites')
    },
    {
      icon: 'chatbubble-ellipses-outline', label: 'WhatsApp Us',
      labelTe: 'వాట్సాప్',
      color: '#25D366', bg: 'rgba(37,211,102,0.15)',
      action: () => Linking.openURL(`https://wa.me/${WHATSAPP}?text=Hi! I need help with spare parts`)
    },
  ];

  // ── GEN Z SCREENS ──
  if (showProfile) return (
    <CustomerProfileScreen
      customer={customer}
      vehicle={vehicle}
      loyaltyPoints={loyaltyPoints}
      onBack={() => setShowProfile(false)}
      onLogout={onLogout}
    />
  );
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
          {/* SEARCH BOX */}
          <View style={s.searchBox}>
            <Ionicons name="search" size={18} color="rgba(255,255,255,0.4)" />
            <TextInput
              style={s.searchInput}
              placeholder="Search parts by name or SKU..."
              placeholderTextColor="rgba(255,255,255,0.2)"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.3)" />
              </TouchableOpacity>
            )}
          </View>

          {/* CATEGORY DROPDOWN */}
          <View style={s.dropdownWrapper}>
            <TouchableOpacity
              style={s.dropdownTrigger}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowCategoryDropdown(!showCategoryDropdown);
              }}>
              <Ionicons name="filter" size={16} color="#C9A84C" />
              <Text style={s.dropdownTriggerText}>
                {category === 'all'
                  ? 'All Parts'
                  : CATEGORIES.find(c => c.id === category)?.label || 'Select Category'}
              </Text>
              <Ionicons
                name={showCategoryDropdown ? 'chevron-up' : 'chevron-down'}
                size={16}
                color="rgba(255,255,255,0.4)"
              />
            </TouchableOpacity>

            {/* DROPDOWN LIST */}
            {showCategoryDropdown && (
              <View style={s.dropdownList}>
                <ScrollView
                  style={{ maxHeight: 300 }}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}>
                  {[
                    { id: 'all', label: 'All Parts', group: '' },
                    { id: 'OIL', label: 'Engine Oils', group: 'GENERAL' },
                    { id: 'HRO-SPL', label: 'Hero Splendor+', group: 'HERO' },
                    { id: 'HRO-HFD', label: 'Hero HF Deluxe', group: 'HERO' },
                    { id: 'HRO-PAS', label: 'Hero Passion Pro', group: 'HERO' },
                    { id: 'HRO-GLA', label: 'Hero Glamour', group: 'HERO' },
                    { id: 'HRO-XTR', label: 'Hero Xtreme 160R', group: 'HERO' },
                    { id: 'HND-CBS', label: 'Honda CB Shine', group: 'HONDA' },
                    { id: 'HND-ACT', label: 'Honda Activa', group: 'HONDA' },
                    { id: 'HND-SP1', label: 'Honda SP 125', group: 'HONDA' },
                    { id: 'HND-DYG', label: 'Honda Dream Yuga', group: 'HONDA' },
                    { id: 'TVS-APR', label: 'TVS Apache', group: 'TVS' },
                    { id: 'TVS-JPT', label: 'TVS Jupiter', group: 'TVS' },
                    { id: 'BAJ-P15', label: 'Bajaj Pulsar 150', group: 'BAJAJ' },
                    { id: 'BAJ-PLT', label: 'Bajaj Platina', group: 'BAJAJ' },
                  ].reduce((acc, item) => {
                    // Group header
                    if (item.group && (!acc.length || acc[acc.length-1].group !== item.group)) {
                      acc.push({ isHeader: true, group: item.group });
                    }
                    acc.push(item);
                    return acc;
                  }, []).map((item, i) => {
                    if (item.isHeader) {
                      return (
                        <View key={`header-${item.group}`} style={s.dropdownGroupHeader}>
                          <Text style={s.dropdownGroupLabel}>{item.group}</Text>
                        </View>
                      );
                    }
                    const isSelected = category === item.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[s.dropdownItem, isSelected && s.dropdownItemActive]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setCategory(item.id);
                          setShowCategoryDropdown(false);
                        }}>
                        <Text style={[s.dropdownItemText, isSelected && s.dropdownItemTextActive]}>
                          {item.label}
                        </Text>
                        {isSelected && (
                          <Ionicons name="checkmark" size={16} color="#C9A84C" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>

          {/* ACTIVE FILTER BADGE */}
          {category !== 'all' && (
            <View style={s.activeFilterRow}>
              <Text style={s.activeFilterText}>
                Showing: {CATEGORIES.find(c => c.id === category)?.label || category}
              </Text>
              <TouchableOpacity onPress={() => setCategory('all')}>
                <Text style={s.clearFilterBtn}>Clear ✕</Text>
              </TouchableOpacity>
            </View>
          )}
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
                tintColor="#C9A84C"
                colors={['#4F6EF7']}
              />
            }
          >
            {/* GREETING */}
            <View style={s.greeting}>
              <View style={{ flex: 1 }}>
                <Text style={s.greetName}>
                  Hello, {customer?.name?.split(' ')[0]}
                </Text>
                <Text style={s.greetSub}>
                  Find parts for your bike
                </Text>
                {vehicle && (
                  <TouchableOpacity
                    style={s.vehicleChip}
                    onPress={() => setTab('browse')}>
                    <Text style={s.vehicleChipText}>
                      {vehicle.brand} {vehicle.model} — Browse Parts →
                    </Text>
                  </TouchableOpacity>
                )}
                {/* MULTIPLE BIKES SWITCHER */}
                {vehicles && vehicles.length > 1 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}
                    style={{ marginTop: 6 }} contentContainerStyle={{ gap: 6 }}>
                    {vehicles.map((v, i) => (
                      <TouchableOpacity key={i}
                        style={[s.bikeSwitch, vehicle?.model === v.model && s.bikeSwitchActive]}
                        onPress={() => onVehicleChange(v)}>
                        <Text style={[s.bikeSwitchText, vehicle?.model === v.model && s.bikeSwitchTextActive]}>
                          {v.brand} {v.model}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    {vehicles.length < 3 && (
                      <TouchableOpacity style={s.bikeAddBtn}
                        onPress={() => onVehicleAdd && onVehicleAdd()}>
                        <Text style={s.bikeAddBtnText}>+ Add Bike</Text>
                      </TouchableOpacity>
                    )}
                  </ScrollView>
                )}
                {vehicles && vehicles.length === 1 && (
                  <TouchableOpacity style={s.bikeAddBtn}
                    onPress={() => onVehicleAdd && onVehicleAdd()}>
                    <Text style={s.bikeAddBtnText}>+ Add Another Bike</Text>
                  </TouchableOpacity>
                )}
              </View>
              {isMechanic && (
                <View style={s.mechBadge}>
                  <Ionicons name="construct" size={16} color="#FFC107" />
                  <Text style={s.mechBadgeText}>5% OFF</Text>
                </View>
              )}
            </View>

            {/* LOYALTY CARD */}
            <TouchableOpacity
              style={s.loyaltyCard}
              onPress={() => {}}
              activeOpacity={0.85}
            >
              <View style={s.loyaltyLeft}>
                <Ionicons name="star" size={28} color="#FFC107" />
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
                  View Rewards →
                </Text>
              </View>
            </TouchableOpacity>

            {/* ACTIVE DEALS — Only show if real deals exist */}
            {offers.length > 0 && (
              <View style={s.dealsSection}>
                <View style={s.dealsSectionHeader}>
                  <Text style={s.dealsSectionTitle}>TODAY'S OFFERS</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingBottom: 4 }}>
                  {offers.map(o => (
                    <TouchableOpacity key={o.id} style={s.offerCard}
                      onPress={() => setTab('browse')} activeOpacity={0.8}>
                      <View style={s.offerBadgeTop}>
                        <Text style={s.offerBadgeTopText}>
                          {o.discount_percent > 0 ? `${o.discount_percent}% OFF` : 'OFFER'}
                        </Text>
                      </View>
                      <Ionicons name="pricetag" size={18} color="#C9A84C" style={{ marginBottom: 6 }} />
                      <Text style={s.offerTitle}>{o.title}</Text>
                      {o.description ? (
                        <Text style={s.offerDesc} numberOfLines={2}>{o.description}</Text>
                      ) : null}
                      <Text style={s.offerShopNow}>Shop Now →</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* QUICK ACTIONS — 6 GRID */}
            <View style={s.qaSection}>
              <Text style={s.qaSectionTitle}>QUICK ACTIONS</Text>
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
                      <Ionicons name={a.icon} size={24} color={a.color} />
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



            {/* POPULAR PARTS */}
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Popular Parts</Text>
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
                    <Ionicons 
                      name={favorites.includes(item.id) ? 'heart' : 'heart-outline'}
                      size={18} 
                      color={favorites.includes(item.id) ? '#EF4444' : 'rgba(255,255,255,0.3)'}
                    />
                  </TouchableOpacity>
                  <View style={[s.miniCardIconBox, { backgroundColor: getPartLabel(item.sku).bg }]}>
                    <Text style={[s.miniCardIconText, { color: getPartLabel(item.sku).color }]}>
                      {getPartLabel(item.sku).label}
                    </Text>
                  </View>
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

            {/* RECENTLY ORDERED */}
            {recentlyViewed.length > 0 && (
              <View>
                <View style={s.sectionHeader}>
                  <Text style={s.sectionTitle}>Recently Viewed</Text>
                  <TouchableOpacity onPress={() => setRecentlyViewed([])}>
                    <Text style={s.seeAll}>Clear</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}
                  contentContainerStyle={s.hScroll}>
                  {recentlyViewed.slice(0, 6).map(item => (
                    <TouchableOpacity key={item.id} style={s.miniCard}
                      onPress={() => openProduct(item)} activeOpacity={0.8}>
                      <View style={[s.miniCardIconBox, { backgroundColor: getPartLabel(item.sku).bg }]}>
                        <Text style={[s.miniCardIconText, { color: getPartLabel(item.sku).color }]}>
                          {getPartLabel(item.sku).label}
                        </Text>
                      </View>
                      <Text style={s.miniCardName} numberOfLines={2}>{item.name_en}</Text>
                      <Text style={s.miniCardPrice}>₹{item.selling_price}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

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
                  tintColor="#C9A84C"
                />
              }
              ListHeaderComponent={() => (
                <View style={s.browseHeader}>
                  <Text style={s.countText}>
                    {filtered.length} products found
                  </Text>
                  {vehicle && category === 'all' && vehicleSku && (
                    <View style={s.vehicleFilterBadge}>
                      <Text style={s.vehicleFilterText}>
                        🏍️ {vehicle.brand} {vehicle.model}
                      </Text>
                      <TouchableOpacity onPress={() => setCategory('all')}>
                        <Text style={s.clearVehicle}> ✕</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
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
              <Ionicons name="heart-outline" size={56} color="rgba(255,255,255,0.2)" style={{ marginBottom: 12 }} />
              <Text style={s.emptyText}>No saved parts yet</Text>
              <Text style={s.emptySubText}>Tap the heart on any part to save it</Text>
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
                      <Ionicons name="heart" size={18} color="#EF4444" />
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
              <Ionicons name="cart-outline" size={56} color="rgba(255,255,255,0.2)" style={{ marginBottom: 12 }} />
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
                    🎁 Use {loyaltyPoints} points
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
                      🎁 Points Discount
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
                  ✅ Place Order · ₹{finalTotal.toFixed(0)}
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

            {/* PROFILE BUTTON */}
            <TouchableOpacity
              style={s.profileBtn}
              onPress={() => setShowProfile(true)}>
              <View style={s.profileBtnAvatar}>
                <Text style={s.profileBtnAvatarText}>
                  {(customer?.name || '?')[0].toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.profileBtnName}>{customer?.name}</Text>
                <Text style={s.profileBtnPhone}>+91 {customer?.phone}</Text>
              </View>
              <Text style={s.profileBtnArrow}>✏️ Edit Profile →</Text>
            </TouchableOpacity>

            <View style={s.storeCard}>
              <View style={s.storeIconBox}>
                <Ionicons name="storefront" size={28} color="#C9A84C" />
              </View>
              <Text style={s.storeName}>
                New Rahul Auto Spares
              </Text>
              <Text style={s.storeAddr}>
                Telugu Peta, Nandyal · 518501
              </Text>
            </View>
            <View style={{ backgroundColor: '#0D1F3C', borderRadius: 16, marginBottom: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' }}>
            {[
              {
                label: 'Phone', icon: 'call', value: '08514-244944',
                action: () => Linking.openURL('tel:08514244944')
              },
              {
                label: 'WhatsApp', icon: 'logo-whatsapp', value: '+91 6300281504',
                action: () => Linking.openURL(`https://wa.me/${WHATSAPP}`)
              },
              { label: 'Mon–Sat', icon: 'time', value: '10AM – 9PM' },
              { label: 'Sunday', icon: 'time', value: '10AM – 3PM' },
            ].map((r, i) => (
              <TouchableOpacity
                key={i} style={s.storeRow}
                onPress={r.action}
                disabled={!r.action}
              >
                <View style={s.storeRowLeft}>
                  <Ionicons name={r.icon} size={16} color="#C9A84C" style={{ width: 22 }} />
                  <Text style={s.storeRowLabel}>{r.label}</Text>
                </View>
                <Text style={[s.storeRowValue, r.action && { color: '#4ADE80' }]}>
                  {r.value}
                </Text>
              </TouchableOpacity>
            ))}
            </View>

            {/* MORE SERVICES */}
            <View style={s.servicesCard}>
              <Text style={s.servicesTitle}>OUR SERVICES</Text>
              {[
                { icon: 'build', label: 'Bike Health Check', sub: 'Free diagnosis for your bike', action: () => setShowBikeHealth(true) },
                { icon: 'location', label: 'Find Us on Map', sub: 'Telugu Peta, Nandyal', action: () => Linking.openURL('https://maps.google.com/?q=New+Rahul+Auto+Spares+Nandyal') },
                { icon: 'chatbubble', label: 'WhatsApp Support', sub: 'Chat with us anytime', action: () => Linking.openURL(`https://wa.me/${WHATSAPP}?text=Hi, I need help with spare parts`) },
                { icon: 'star', label: 'Rate Our App', sub: 'Share your feedback', action: () => {} },
              ].map((item, i) => (
                <TouchableOpacity key={i} style={s.serviceRow} onPress={item.action}>
                  <View style={s.serviceIconBox}>
                    <Ionicons name={item.icon} size={20} color="#C9A84C" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.serviceLabel}>{item.label}</Text>
                    <Text style={s.serviceSub}>{item.sub}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ height: 30 }} />
          </ScrollView>
        )}
      </View>

      {/* BOTTOM NAV */}
      {/* WHATSAPP FLOATING BUTTON */}
      <TouchableOpacity
        style={s.whatsappFab}
        onPress={() => Linking.openURL(`https://wa.me/${WHATSAPP}?text=Hi! I need help with spare parts`)}>
        <Ionicons name="logo-whatsapp" size={28} color="#fff" />
      </TouchableOpacity>

      <BottomNav
        active={tab}
        onChange={setTab}
        cartCount={cartCount}
        notifCount={unread}
      />


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
  const [orderSearch, setOrderSearch] = useState('');

  const API_URL = 'https://rahul-auto-spares-backend.onrender.com';

  const STATUS_STEPS = [
    { key: 'new', label: 'Placed', icon: '○', color: '#4F6EF7' },
    { key: 'packing', label: 'Packing', icon: '📦', color: '#FFC107' },
    { key: 'ready', label: 'Ready', icon: '◉', color: '#4ADE80' },
    { key: 'collected', label: 'Done', icon: '🏁', color: 'rgba(255,255,255,0.3)' },
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
  const searchFiltered = (filter === 'active' ? active : orders).filter(o => {
    if (!orderSearch) return true;
    const q = orderSearch.toLowerCase();
    return (
      (o.custom_id || '').toLowerCase().includes(q) ||
      String(o.total_amount).includes(q) ||
      (o.pickup_time || '').toLowerCase().includes(q) ||
      (o.customer_name || '').toLowerCase().includes(q)
    );
  });
  const displayed = searchFiltered;
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
            style={[os.filterBtn, filter === f.id && os.filterBtnActive]}
            onPress={() => setFilter(f.id)}
          >
            <Text style={[os.filterText, filter === f.id && os.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {displayed.length === 0 ? (
        <View style={os.centerBox}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>📋</Text>
          <Text style={os.emptyText}>
            {filter === 'active' ? 'No active orders!' : 'No orders yet!'}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#C9A84C"
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
                    <Text style={os.orderId}>{orderId(order)}</Text>
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
                        onPress={() => Linking.openURL('tel:08514244944')}
                      >
                        <Text style={os.callBtnText}>📞 Call</Text>
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

                <View style={os.timeline}>
                  {STATUS_STEPS.map((step, i) => {
                    const done = i < currentStep;
                    const current = i === currentStep;
                    const pending = i > currentStep;
                    return (
                      <View key={step.key} style={os.step}>
                        {i > 0 && (
                          <View style={[os.stepLine,
                            done && { backgroundColor: step.color }]} />
                        )}
                        <View style={[os.stepIcon,
                          done && { backgroundColor: step.color + '20', borderColor: step.color },
                          current && { backgroundColor: step.color + '20', borderColor: step.color },
                          pending && { borderColor: 'rgba(255,255,255,0.1)' }]}>
                          <Text style={[os.stepEmoji, pending && { opacity: 0.2 }]}>
                            {done ? '✓' : step.icon}
                          </Text>
                        </View>
                        <Text style={[os.stepLabel,
                          done && { color: '#4ADE80' },
                          current && { color: step.color },
                          pending && { color: 'rgba(255,255,255,0.2)' }]}>
                          {step.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {order.status !== 'collected' && (
                  <View style={os.qrSection}>
                    <Text style={os.qrTitle}>📱 Show QR at Pickup</Text>
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
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  loadingText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  emptyText: { fontSize: 16, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
  filterRow: { flexDirection: 'row', padding: 12, gap: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(79,110,247,0.15)' },
  filterBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(79,110,247,0.2)' },
  filterBtnActive: { backgroundColor: '#4F6EF7', borderColor: '#4F6EF7' },
  filterText: { fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: '700' },
  filterTextActive: { color: '#fff' },
  orderCard: { backgroundColor: '#0E0E1C', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(79,110,247,0.2)' },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  orderId: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  orderPickup: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  orderRight: { alignItems: 'flex-end', gap: 6 },
  orderAmount: { fontSize: 20, fontWeight: 'bold', color: '#FFC107' },
  callBtn: { backgroundColor: '#4ADE80', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  callBtnText: { color: '#06060E', fontWeight: 'bold', fontSize: 12 },
  readyBanner: { backgroundColor: 'rgba(74,222,128,0.1)', borderRadius: 10, padding: 10, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(74,222,128,0.3)' },
  readyText: { color: '#4ADE80', fontWeight: 'bold', fontSize: 13 },
  timeline: { flexDirection: 'row', marginBottom: 14 },
  step: { flex: 1, alignItems: 'center', position: 'relative' },
  stepLine: { position: 'absolute', top: 18, right: '50%', left: '-50%', height: 2, backgroundColor: 'rgba(79,110,247,0.1)' },
  stepIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 6, zIndex: 1, borderWidth: 2, borderColor: 'rgba(79,110,247,0.2)', backgroundColor: '#0E0E1C' },
  stepEmoji: { fontSize: 14 },
  stepLabel: { fontSize: 9, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  qrSection: { alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(79,110,247,0.15)' },
  qrTitle: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 10 },
  qrImage: { width: 140, height: 140, borderRadius: 8, marginBottom: 8 },
  qrId: { fontSize: 16, fontWeight: 'bold', color: '#4F6EF7', letterSpacing: 2 },
});

// ── MAIN STYLES ──
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07111F' },

  // WhatsApp FAB
  whatsappFab: {
    position: 'absolute', bottom: 80, right: 16,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#25D366',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#25D366', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 10,
    zIndex: 999,
  },

  // Deals section
  dealsSection: { marginBottom: 8 },
  dealsSectionHeader: {
    paddingHorizontal: 16, paddingBottom: 10,
    flexDirection: 'row', alignItems: 'center',
  },
  dealsSectionTitle: {
    fontSize: 11, color: 'rgba(201,168,76,0.8)',
    letterSpacing: 2.5, fontWeight: '800',
  },
  offerBadgeTop: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: '#C9A84C', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  offerBadgeTopText: { fontSize: 9, fontWeight: '800', color: '#07111F' },
  offerShopNow: { fontSize: 11, color: '#C9A84C', fontWeight: '700', marginTop: 6 },

  // Stock warnings
  stockBadgeLow: { backgroundColor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.3)' },
  stockTextLow: { color: '#F59E0B', fontWeight: '700' },

  // Product image
  productImage: {
    width: 52, height: 52, borderRadius: 8,
    backgroundColor: '#0D1F3C',
  },

  // Share button
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12,
    padding: 14, marginBottom: 10, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)', justifyContent: 'center',
  },
  shareBtnText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: '600' },

  // Order notes
  noteBox: {
    backgroundColor: '#0D1F3C', borderRadius: 12, padding: 14,
    marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  noteLabel: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8, fontWeight: '600' },
  noteInput: {
    color: '#fff', fontSize: 14, minHeight: 44,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingBottom: 8, textAlignVertical: 'top',
  },

  // UPI Payment
  upiSection: {
    backgroundColor: '#0D1F3C', borderRadius: 14, padding: 14,
    marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  upiLabel: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 10, fontWeight: '600' },
  upiRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  upiBtn: {
    flex: 1, borderRadius: 10, padding: 10, alignItems: 'center',
    borderWidth: 1.5, backgroundColor: 'rgba(255,255,255,0.03)',
  },
  upiBtnText: { fontWeight: '800', fontSize: 13 },
  upiNote: { fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'center' },

  // Multiple bikes
  bikeSwitch: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  bikeSwitchActive: { backgroundColor: '#C9A84C', borderColor: '#C9A84C' },
  bikeSwitchText: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  bikeSwitchTextActive: { color: '#07111F', fontWeight: '800' },
  bikeAddBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)',
    backgroundColor: 'rgba(201,168,76,0.06)',
  },
  bikeAddBtnText: { fontSize: 11, color: '#C9A84C', fontWeight: '700' },
  header: { backgroundColor: '#07111F', paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.15)' },
  headerBrand: { fontSize: 15, fontWeight: 'bold', color: '#fff', letterSpacing: 1.5, textTransform: 'uppercase' },
  offlineTag: { fontSize: 10, color: '#FFC107', marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mechanicTag: { backgroundColor: 'rgba(255,193,7,0.15)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(255,193,7,0.3)' },
  mechanicTagText: { color: '#FFC107', fontSize: 10, fontWeight: 'bold' },
  pointsTag: { backgroundColor: 'rgba(255,193,7,0.1)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(255,193,7,0.2)' },
  pointsTagText: { color: '#FFC107', fontSize: 10 },
  notifBtn: { position: 'relative', padding: 4 },
  notifIcon: { fontSize: 20 },
  notifBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#FF4757', borderRadius: 6, minWidth: 14, height: 14, alignItems: 'center', justifyContent: 'center' },
  notifBadgeText: { color: '#fff', fontSize: 8, fontWeight: 'bold' },
  exitBtn: { backgroundColor: 'rgba(255,71,87,0.1)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(255,71,87,0.2)' },
  exitText: { color: '#FF4757', fontSize: 11, fontWeight: 'bold' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0D1F3C', margin: 12, marginBottom: 8, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: 10 },
  dropdownWrapper: { marginHorizontal: 12, marginBottom: 8, zIndex: 999 },
  dropdownTrigger: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#0D1F3C', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)',
  },
  dropdownTriggerText: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '600' },
  dropdownList: {
    position: 'absolute', top: 52, left: 0, right: 0,
    backgroundColor: '#0D1F3C', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 10,
    zIndex: 1000,
  },
  dropdownGroupHeader: {
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
  },
  dropdownGroupLabel: {
    fontSize: 10, color: 'rgba(201,168,76,0.7)',
    fontWeight: '800', letterSpacing: 2,
  },
  dropdownItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  dropdownItemActive: { backgroundColor: 'rgba(201,168,76,0.08)' },
  dropdownItemText: { fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
  dropdownItemTextActive: { color: '#fff', fontWeight: '700' },
  activeFilterRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 12, marginBottom: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: 'rgba(201,168,76,0.06)', borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)',
  },
  activeFilterText: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  clearFilterBtn: { fontSize: 12, color: '#C9A84C', fontWeight: '700' },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, color: '#fff', fontSize: 14 },
  clearBtn: { color: 'rgba(255,255,255,0.3)', fontSize: 16 },
  catScroll: { maxHeight: 46 },
  catRow: { paddingHorizontal: 12, paddingBottom: 8, gap: 8, flexDirection: 'row', alignItems: 'center' },
  catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: '#0D1F3C' },
  catChipActive: { backgroundColor: '#C9A84C', borderColor: '#C9A84C' },
  catChipText: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '600', letterSpacing: 0.3 },
  catChipTextActive: { color: '#07111F', fontWeight: '700' },
  greeting: { padding: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  greetName: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  greetSub: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 10 },
  vehicleChip: { backgroundColor: 'rgba(79,110,247,0.1)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(79,110,247,0.2)' },
  vehicleChipText: { color: '#C9A84C', fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  mechBadge: { backgroundColor: 'rgba(255,193,7,0.1)', borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,193,7,0.2)' },
  mechBadgeIcon: { fontSize: 24 },
  mechBadgeText: { color: '#FFC107', fontSize: 10, fontWeight: 'bold' },
  loyaltyCard: { marginHorizontal: 16, marginBottom: 16, backgroundColor: '#0D1F3C', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(201,168,76,0.25)' },
  loyaltyLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loyaltyIcon: { fontSize: 28 },
  loyaltyTitle: { fontSize: 14, fontWeight: 'bold', color: '#FFC107' },
  loyaltyHint: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  loyaltyRight: { alignItems: 'flex-end' },
  loyaltyPts: { fontSize: 36, fontWeight: 'bold', color: '#FFC107' },
  loyaltyTapHint: { fontSize: 9, color: 'rgba(255,193,7,0.5)', marginTop: 2 },
  offersRow: { paddingHorizontal: 16, paddingBottom: 8, gap: 10 },
  offerCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,193,7,0.06)', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: 'rgba(255,193,7,0.2)', minWidth: 200 },
  offerEmoji: { fontSize: 24 },
  offerTitle: { fontSize: 13, fontWeight: 'bold', color: '#FFC107' },
  offerBadge: { backgroundColor: '#FFC107', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4, alignSelf: 'flex-start' },
  offerBadgeText: { fontSize: 10, color: '#06060E', fontWeight: 'bold' },
  qaSection: { paddingHorizontal: 16, marginBottom: 4 },
  qaSectionTitle: { fontSize: 13, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, marginBottom: 12, textTransform: 'uppercase' },
  qaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  qaCard: { width: (width - 52) / 3, backgroundColor: '#0D1F3C', borderRadius: 12, padding: 14, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  qaIconBox: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  qaIcon: { fontSize: 24 },
  qaLabel: { fontSize: 11, fontWeight: 'bold', textAlign: 'center' },
  qaLabelTe: { fontSize: 8, color: 'rgba(255,255,255,0.25)', textAlign: 'center' },
  promoRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  promoCard: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center', gap: 4, borderWidth: 1 },
  promoIcon: { fontSize: 32, marginBottom: 4 },
  promoTitle: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
  promoSub: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: 1.5, textTransform: 'uppercase' },
  seeAll: { fontSize: 13, color: '#4F6EF7', fontWeight: 'bold' },
  hScroll: { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  miniCard: { backgroundColor: '#0D1F3C', borderRadius: 12, padding: 14, width: 140, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', position: 'relative' },
  miniHeart: { position: 'absolute', top: 8, right: 8 },
  miniCardIcon: { fontSize: 30, marginBottom: 8, marginTop: 8 },
  miniCardName: { fontSize: 12, fontWeight: 'bold', color: '#fff', marginBottom: 4, lineHeight: 16 },
  miniCardMrp: { fontSize: 10, color: 'rgba(255,255,255,0.25)', textDecorationLine: 'line-through' },
  miniCardPrice: { fontSize: 16, fontWeight: 'bold', color: '#FFC107', marginBottom: 8 },
  miniAddBtn: { backgroundColor: '#4F6EF7', borderRadius: 8, padding: 6, alignItems: 'center' },
  miniAddText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  hoursCard: { margin: 16, backgroundColor: '#0E0E1C', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(79,110,247,0.15)' },
  hoursTitle: { fontSize: 14, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
  hoursRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(79,110,247,0.08)' },
  hoursDay: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  hoursTime: { fontSize: 13, color: '#fff', fontWeight: '600' },
  callBtn: { marginTop: 12, backgroundColor: 'rgba(74,222,128,0.1)', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(74,222,128,0.2)' },
  callBtnText: { color: '#4ADE80', fontSize: 14, fontWeight: 'bold' },
  browseHeader: { marginBottom: 8 },
  countText: { fontSize: 11, color: 'rgba(255,255,255,0.25)', paddingBottom: 4 },
  vehicleFilterBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(79,110,247,0.1)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(79,110,247,0.2)', marginBottom: 8 },
  vehicleFilterText: { color: '#4F6EF7', fontSize: 12, fontWeight: 'bold' },
  clearVehicle: { color: '#FF4757', fontSize: 12, fontWeight: 'bold' },
  productCard: { backgroundColor: '#0E0E1C', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(79,110,247,0.15)', marginBottom: 8, gap: 10 },
  productLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  productIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(79,110,247,0.08)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(79,110,247,0.12)' },
  productIconText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  productName: { fontSize: 13, fontWeight: '700', color: '#fff', marginBottom: 3, lineHeight: 18 },
  productNameTe: { fontSize: 10, color: 'rgba(79,110,247,0.5)', marginBottom: 2 },
  productSku: { fontSize: 9, color: 'rgba(79,110,247,0.5)', letterSpacing: 1, marginBottom: 4 },
  stockBadge: { backgroundColor: 'rgba(74,222,128,0.08)', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  stockBadgeOut: { backgroundColor: 'rgba(255,71,87,0.08)', borderColor: 'rgba(255,71,87,0.2)' },
  stockText: { fontSize: 9, color: '#4ADE80' },
  stockTextOut: { color: '#FF4757' },
  productRight: { alignItems: 'flex-end', gap: 4 },
  productMrp: { fontSize: 10, color: 'rgba(255,255,255,0.25)', textDecorationLine: 'line-through' },
  productPrice: { fontSize: 17, fontWeight: 'bold', color: '#FFC107' },
  mechDiscount: { fontSize: 9, color: '#FFC107' },
  addBtn: { backgroundColor: '#4F6EF7', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  addBtnText: { color: '#07111F', fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  emptyText: { fontSize: 16, color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' },
  clearSearchText: { color: '#4F6EF7', fontWeight: 'bold' },
  browseBtn: { backgroundColor: 'rgba(79,110,247,0.1)', borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(79,110,247,0.2)' },
  browseBtnText: { color: '#4F6EF7', fontWeight: 'bold' },
  cartCustomer: { backgroundColor: '#0E0E1C', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(79,110,247,0.15)' },
  cartCustomerName: { fontSize: 15, fontWeight: 'bold', color: '#fff', marginBottom: 2 },
  cartCustomerPhone: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  cartItem: { backgroundColor: '#0E0E1C', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(79,110,247,0.15)', marginBottom: 8, gap: 10 },
  cartItemIcon: { fontSize: 26 },
  cartItemName: { fontSize: 13, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  cartItemPrice: { fontSize: 18, fontWeight: 'bold', color: '#FFC107' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtySelector: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  qtyBtn: { width: 36, height: 36, backgroundColor: '#0E0E1C', borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(79,110,247,0.3)' },
  qtyBtnText: { fontSize: 18, color: '#4F6EF7', fontWeight: 'bold' },
  qtyNum: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  qtyTotal: { fontSize: 16, color: '#FFC107', fontWeight: 'bold' },
  loyaltyToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,193,7,0.05)', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,193,7,0.2)' },
  loyaltyToggleOn: { backgroundColor: 'rgba(74,222,128,0.06)', borderColor: 'rgba(74,222,128,0.3)' },
  loyaltyToggleText: { fontSize: 13, color: '#FFC107', fontWeight: 'bold', flex: 1 },
  toggleSwitch: { width: 44, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', padding: 2 },
  toggleSwitchOn: { backgroundColor: '#4ADE80' },
  toggleKnob: { width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.3)', alignSelf: 'flex-start' },
  toggleKnobOn: { backgroundColor: '#fff', alignSelf: 'flex-end' },
  pickupCard: { backgroundColor: '#0E0E1C', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(79,110,247,0.15)' },
  pickupTitle: { fontSize: 14, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
  pickupOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pickupChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(79,110,247,0.2)' },
  pickupChipActive: { backgroundColor: '#4F6EF7', borderColor: '#4F6EF7' },
  pickupChipText: { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
  pickupChipTextActive: { color: '#fff' },
  summaryCard: { backgroundColor: '#0E0E1C', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,193,7,0.15)' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  summaryValue: { fontSize: 13, color: '#fff', fontWeight: '600' },
  summaryTotal: { borderTopWidth: 1, borderTopColor: 'rgba(255,193,7,0.15)', paddingTop: 10, marginTop: 4 },
  summaryTotalLabel: { fontSize: 15, fontWeight: 'bold', color: '#fff' },
  summaryTotalValue: { fontSize: 22, fontWeight: 'bold', color: '#FFC107' },
  orderBtn: { backgroundColor: '#FF4757', borderRadius: 18, padding: 16, alignItems: 'center', marginBottom: 10 },
  orderBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  upiBtn: { backgroundColor: 'rgba(79,110,247,0.12)', borderRadius: 18, padding: 14, alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: 'rgba(79,110,247,0.3)' },
  upiBtnText: { color: '#4F6EF7', fontSize: 14, fontWeight: 'bold' },
  callStoreBtn: { backgroundColor: 'rgba(74,222,128,0.1)', borderRadius: 18, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(74,222,128,0.2)' },
  callStoreBtnText: { color: '#4ADE80', fontSize: 14, fontWeight: 'bold' },
  profileBtn: {
    backgroundColor: '#0E0E1C', borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginBottom: 14, borderWidth: 1, borderColor: 'rgba(79,110,247,0.3)',
  },
  profileBtnAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#4F6EF7', alignItems: 'center', justifyContent: 'center',
  },
  profileBtnAvatarText: { fontSize: 22, color: '#fff', fontWeight: 'bold' },
  profileBtnName: { fontSize: 15, fontWeight: 'bold', color: '#fff', marginBottom: 2 },
  profileBtnPhone: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  profileBtnArrow: { fontSize: 11, color: '#4F6EF7', fontWeight: 'bold' },
  storeIconBox: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: 'rgba(201,168,76,0.1)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8, borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
  },
  storeRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  servicesCard: {
    backgroundColor: '#0D1F3C', borderRadius: 16, padding: 16,
    marginTop: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  servicesTitle: {
    fontSize: 11, color: 'rgba(201,168,76,0.7)',
    letterSpacing: 2, fontWeight: '700', marginBottom: 14,
  },
  serviceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  serviceIconBox: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: 'rgba(201,168,76,0.08)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.15)',
  },
  serviceLabel: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 2 },
  serviceSub: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  emptySubText: { fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 4 },
  storeCard: { backgroundColor: '#0E0E1C', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(79,110,247,0.15)' },
  storeIcon: { fontSize: 48, marginBottom: 10 },
  storeName: { fontSize: 17, fontWeight: '800', color: '#fff', marginBottom: 4, letterSpacing: 0.5 },
  storeAddr: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  storeRow: { backgroundColor: '#0E0E1C', borderRadius: 14, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: 'rgba(79,110,247,0.15)' },
  storeRowLabel: { fontSize: 14, color: 'rgba(255,255,255,0.5)' },
  storeRowValue: { fontSize: 14, color: '#fff', fontWeight: '600' },
  storeFeatures: { marginTop: 16, backgroundColor: '#0E0E1C', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(79,110,247,0.15)' },
  storeFeatTitle: { fontSize: 14, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
  storeFeatureBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(79,110,247,0.08)' },
  storeFeatureBtnIcon: { fontSize: 22 },
  storeFeatureBtnText: { flex: 1, fontSize: 14, color: '#fff', fontWeight: '600' },
  storeFeatureBtnArrow: { fontSize: 16, color: '#4F6EF7' },
  floatingWA: { position: 'absolute', bottom: 70, right: 16, width: 52, height: 52, borderRadius: 26, backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center', elevation: 8, zIndex: 999, shadowColor: '#25D366', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 6 },
  floatingWAIcon: { fontSize: 26 },
  modalHeader: { backgroundColor: '#0E0E1C', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(79,110,247,0.15)' },
  modalBack: { backgroundColor: 'rgba(79,110,247,0.1)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(79,110,247,0.2)' },
  modalBackText: { color: '#4F6EF7', fontSize: 14, fontWeight: 'bold' },
  modalTitle: { flex: 1, fontSize: 16, fontWeight: 'bold', color: '#fff' },
  modalActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  heroBox: { height: 180, backgroundColor: '#0E0E1C', alignItems: 'center', justifyContent: 'center' },
  heroIcon: { fontSize: 80 },
  oemBadge: { position: 'absolute', bottom: 12, backgroundColor: 'rgba(74,222,128,0.12)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(74,222,128,0.3)' },
  oemText: { fontSize: 12, color: '#4ADE80', fontWeight: 'bold' },
  detailName: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  detailNameTe: { fontSize: 14, color: 'rgba(79,110,247,0.6)', marginBottom: 6 },
  detailSku: { fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, marginBottom: 14 },
  mechBox: { backgroundColor: 'rgba(255,193,7,0.08)', borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,193,7,0.2)' },
  mechBoxText: { color: '#FFC107', fontWeight: 'bold', fontSize: 13 },
  priceBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0E0E1C', borderRadius: 14, padding: 16, gap: 16, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,193,7,0.15)' },
  priceLabel: { fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 4, textTransform: 'uppercase' },
  priceMrp: { fontSize: 18, color: 'rgba(255,255,255,0.25)', textDecorationLine: 'line-through' },
  priceDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,193,7,0.15)' },
  priceSelling: { fontSize: 28, fontWeight: 'bold', color: '#FFC107' },
  saveBadge: { marginLeft: 'auto', backgroundColor: 'rgba(74,222,128,0.1)', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: 'rgba(74,222,128,0.2)', alignItems: 'center' },
  saveText: { fontSize: 11, color: '#4ADE80', fontWeight: 'bold', textAlign: 'center' },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  stockDot: { width: 10, height: 10, borderRadius: 5 },
  stockLabel: { fontSize: 14, fontWeight: '600' },
  notifCard: { backgroundColor: '#0E0E1C', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: 'rgba(79,110,247,0.15)', marginBottom: 10 },
  notifCardUnread: { borderColor: 'rgba(79,110,247,0.4)' },
  notifIcon2: { fontSize: 26 },
  notifTitle2: { fontSize: 14, fontWeight: 'bold', color: '#fff', marginBottom: 2 },
  notifBody2: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  notifTime: { fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 2 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4F6EF7' },
  ratingOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', alignItems: 'center', justifyContent: 'center', padding: 30 },
  ratingCard: { backgroundColor: '#0E0E1C', borderRadius: 24, padding: 28, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,193,7,0.25)' },
  ratingEmoji: { fontSize: 48, marginBottom: 12 },
  ratingTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  ratingTe: { fontSize: 13, color: 'rgba(79,110,247,0.5)', marginBottom: 20 },
  starsRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  star: { fontSize: 36 },
  ratingBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  laterBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 14, alignItems: 'center' },
  laterText: { color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' },
  submitRating: { flex: 2, backgroundColor: '#FFC107', borderRadius: 14, padding: 14, alignItems: 'center' },
  submitRatingText: { color: '#06060E', fontWeight: 'bold', fontSize: 15 },
});
