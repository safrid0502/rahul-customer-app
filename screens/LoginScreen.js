// ════════════════════════════════════════════════════════════════
// LoginScreen.js — New Rahul Auto Spares Customer App
// Professional, modern design — Ready for Play Store
// ════════════════════════════════════════════════════════════════

import { useState, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  SafeAreaView, StatusBar, TextInput,
  KeyboardAvoidingView, Platform,
  ScrollView, Alert, ActivityIndicator,
  Animated, Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const API_URL = 'https://rahul-auto-spares-backend.onrender.com';

export default function LoginScreen({ onCustomerLogin, onMechanicLogin, onMechanicPending }) {
  const [mode, setMode]         = useState('select');
  const [name, setName]         = useState('');
  const [phone, setPhone]       = useState('');
  const [shopName, setShopName] = useState('');
  const [area, setArea]         = useState('');
  const [loading, setLoading]   = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const animateIn = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  };

  const goToMode = (m) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMode(m);
    setTimeout(animateIn, 10);
  };

  const handleCustomerLogin = async () => {
    if (!name.trim())       { Alert.alert('', 'Please enter your name'); return; }
    if (phone.length < 10)  { Alert.alert('', 'Enter valid 10-digit phone number'); return; }
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const user = { name: name.trim(), phone: phone.trim(), type: 'customer' };
    await AsyncStorage.setItem('customer_profile', JSON.stringify(user));
    onCustomerLogin(user);
  };

  const handleMechanicCheck = async () => {
    if (phone.length < 10) { Alert.alert('', 'Enter valid 10-digit phone number'); return; }
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/mechanics/check/${phone.trim()}`);
      const d = await r.json();
      setLoading(false);
      if (d.status === 'approved') {
        const m = { name: d.name, phone: d.phone, shop_name: d.shop_name, area: d.area, type: 'mechanic', status: 'approved' };
        await AsyncStorage.setItem('mechanic_profile', JSON.stringify(m));
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onMechanicLogin(m);
      } else if (d.status === 'pending' || d.status === 'rejected') {
        const m = { name: d.name, phone: d.phone, shop_name: d.shop_name, area: d.area, type: 'mechanic', status: d.status };
        await AsyncStorage.setItem('mechanic_profile', JSON.stringify(m));
        onMechanicPending(m, d.status);
      } else {
        setMode('mechanic_register');
        setTimeout(animateIn, 10);
      }
    } catch {
      setLoading(false);
      setMode('mechanic_register');
      setTimeout(animateIn, 10);
    }
  };

  const handleMechanicRegister = async () => {
    if (!name.trim())      { Alert.alert('', 'Please enter your name'); return; }
    if (phone.length < 10) { Alert.alert('', 'Enter valid 10-digit phone number'); return; }
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/mechanics/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), shop_name: shopName.trim(), area: area.trim() })
      });
      const d = await r.json();
      setLoading(false);
      const m = { name: name.trim(), phone: phone.trim(), shop_name: shopName.trim(), area: area.trim(), type: 'mechanic', status: d.status || 'pending' };
      await AsyncStorage.setItem('mechanic_profile', JSON.stringify(m));
      if (d.status === 'approved') onMechanicLogin(m);
      else onMechanicPending(m, d.status || 'pending');
    } catch {
      setLoading(false);
      Alert.alert('Error', 'Check your internet connection');
    }
  };

  // ══════════════════════════════════════
  // SELECT SCREEN
  // ══════════════════════════════════════
  if (mode === 'select') {
    return (
      <SafeAreaView style={s.container}>
        <StatusBar barStyle="light-content" backgroundColor="#07111F" />
        <ScrollView contentContainerStyle={s.selectScroll} showsVerticalScrollIndicator={false}>

          {/* HERO SECTION */}
          <View style={s.hero}>
            {/* Shield Logo */}
            <View style={s.shieldWrap}>
              <View style={s.shield}>
                <Text style={s.shieldRAS}>RAS</Text>
                <Text style={s.shieldBike}>🏍️</Text>
              </View>
            </View>
            <Text style={s.heroTagline}>YOUR TRUSTED SPARES PARTNER</Text>
            <Text style={s.heroName}>New Rahul Auto Spares</Text>
            <Text style={s.heroLocation}>📍 Telugu Peta, Nandyal · Est. 2002</Text>

            {/* STATS ROW */}
            <View style={s.statsRow}>
              {[
                { num: '500+', label: 'Products' },
                { num: '20+', label: 'Bike Models' },
                { num: '5★', label: 'Rating' },
              ].map((stat, i) => (
                <View key={i} style={s.statBox}>
                  <Text style={s.statNum}>{stat.num}</Text>
                  <Text style={s.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* WHO ARE YOU */}
          <Text style={s.sectionLabel}>SELECT YOUR ACCOUNT TYPE</Text>

          {/* CUSTOMER CARD */}
          <TouchableOpacity style={s.roleCard} onPress={() => goToMode('customer')} activeOpacity={0.8}>
            <View style={[s.roleIconBox, { backgroundColor: 'rgba(79,110,247,0.12)' }]}>
              <Text style={s.roleIconEmoji}>🛍️</Text>
            </View>
            <View style={s.roleInfo}>
              <Text style={s.roleTitle}>Customer</Text>
              <Text style={s.roleSub}>Browse · Order · Track</Text>
              <Text style={s.roleTe}>స్పేర్ పార్ట్స్ కొనండి</Text>
              <View style={s.roleTagRow}>
                {['Free', 'All Bikes', 'Fast Pickup'].map((tag, i) => (
                  <View key={i} style={[s.roleTag, { backgroundColor: 'rgba(79,110,247,0.1)' }]}>
                    <Text style={[s.roleTagText, { color: '#4F6EF7' }]}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={s.roleArrow}>
              <Text style={s.roleArrowText}>→</Text>
            </View>
          </TouchableOpacity>

          {/* MECHANIC CARD */}
          <TouchableOpacity style={[s.roleCard, s.mechCard]} onPress={() => goToMode('mechanic')} activeOpacity={0.8}>
            <View style={[s.roleIconBox, { backgroundColor: 'rgba(255,193,7,0.12)' }]}>
              <Text style={s.roleIconEmoji}>🔧</Text>
            </View>
            <View style={s.roleInfo}>
              <Text style={[s.roleTitle, { color: '#FFC107' }]}>Mechanic</Text>
              <Text style={s.roleSub}>Wholesale Prices · 5% Discount</Text>
              <Text style={s.roleTe}>మెకానిక్ ఖాతా · 5% తగ్గింపు</Text>
              <View style={s.roleTagRow}>
                {['5% OFF', 'Wholesale', 'Priority'].map((tag, i) => (
                  <View key={i} style={[s.roleTag, { backgroundColor: 'rgba(255,193,7,0.1)' }]}>
                    <Text style={[s.roleTagText, { color: '#FFC107' }]}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={[s.roleArrow, { backgroundColor: 'rgba(255,193,7,0.1)' }]}>
              <Text style={[s.roleArrowText, { color: '#FFC107' }]}>→</Text>
            </View>
          </TouchableOpacity>

          {/* STORE INFO */}
          <View style={s.storeInfoBox}>
            <View style={s.storeInfoRow}>
              <Text style={s.storeInfoIcon}>🕐</Text>
              <Text style={s.storeInfoText}>Mon–Sat: 10AM–9PM · Sun: 10AM–3PM</Text>
            </View>
            <View style={s.storeInfoRow}>
              <Text style={s.storeInfoIcon}>📞</Text>
              <Text style={s.storeInfoText}>08514-244944</Text>
            </View>
            <View style={s.storeInfoRow}>
              <Text style={s.storeInfoIcon}>💬</Text>
              <Text style={s.storeInfoText}>WhatsApp: +91 6300281504</Text>
            </View>
          </View>

          <View style={{ height: 30 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ══════════════════════════════════════
  // CUSTOMER LOGIN
  // ══════════════════════════════════════
  if (mode === 'customer') {
    return (
      <SafeAreaView style={s.container}>
        <StatusBar barStyle="light-content" backgroundColor="#07111F" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={s.formScroll} keyboardShouldPersistTaps="handled">

            <TouchableOpacity style={s.backBtn} onPress={() => setMode('select')}>
              <Text style={s.backBtnText}>← Back</Text>
            </TouchableOpacity>

            {/* HEADER */}
            <View style={s.formHeader}>
              <View style={[s.formHeaderIcon, { backgroundColor: 'rgba(79,110,247,0.1)', borderColor: 'rgba(79,110,247,0.3)' }]}>
                <Text style={{ fontSize: 36 }}>🛍️</Text>
              </View>
              <Text style={s.formTitle}>Customer Login</Text>
              <Text style={s.formSub}>Enter once · Saved for next time</Text>
            </View>

            {/* INPUTS */}
            <View style={s.inputCard}>
              <Text style={s.inputCardTitle}>Your Details</Text>

              <Text style={s.inputLabel}>FULL NAME</Text>
              <View style={s.inputRow}>
                <Text style={s.inputIcon}>👤</Text>
                <TextInput
                  style={s.inputField}
                  placeholder="e.g. Rahul Kumar"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  value={name} onChangeText={setName}
                  autoCapitalize="words" />
              </View>

              <Text style={[s.inputLabel, { marginTop: 16 }]}>PHONE NUMBER</Text>
              <View style={s.inputRow}>
                <Text style={s.inputIcon}>+91</Text>
                <TextInput
                  style={s.inputField}
                  placeholder="10-digit mobile number"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  value={phone} onChangeText={setPhone}
                  keyboardType="phone-pad" maxLength={10} />
              </View>
              {phone.length === 10 && (
                <Text style={s.validText}>✅ Valid number</Text>
              )}
            </View>

            {/* FEATURES */}
            <View style={s.featuresBox}>
              {[
                { icon: '🏍️', text: 'Browse parts by your bike model' },
                { icon: '📦', text: 'Track your order in real-time' },
                { icon: '🔔', text: 'Get notified when order is ready' },
                { icon: '💎', text: 'Earn loyalty points on every order' },
              ].map((f, i) => (
                <View key={i} style={s.featureRow}>
                  <Text style={s.featureIcon}>{f.icon}</Text>
                  <Text style={s.featureText}>{f.text}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[s.submitBtn, { backgroundColor: '#4F6EF7' }, (!name || phone.length < 10) && { opacity: 0.4 }]}
              onPress={handleCustomerLogin}
              disabled={!name || phone.length < 10}>
              <Text style={s.submitBtnText}>🚀 Start Shopping</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ══════════════════════════════════════
  // MECHANIC LOGIN
  // ══════════════════════════════════════
  if (mode === 'mechanic') {
    return (
      <SafeAreaView style={s.container}>
        <StatusBar barStyle="light-content" backgroundColor="#07111F" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={s.formScroll} keyboardShouldPersistTaps="handled">

            <TouchableOpacity style={s.backBtn} onPress={() => setMode('select')}>
              <Text style={s.backBtnText}>← Back</Text>
            </TouchableOpacity>

            <View style={s.formHeader}>
              <View style={[s.formHeaderIcon, { backgroundColor: 'rgba(255,193,7,0.1)', borderColor: 'rgba(255,193,7,0.3)' }]}>
                <Text style={{ fontSize: 36 }}>🔧</Text>
              </View>
              <Text style={[s.formTitle, { color: '#FFC107' }]}>Mechanic Login</Text>
              <Text style={s.formSub}>Check your approved account</Text>
            </View>

            {/* BENEFITS */}
            <View style={s.mechBenefitsCard}>
              <Text style={s.mechBenefitsTitle}>🎁 Mechanic Benefits</Text>
              {[
                { icon: '💰', text: '5% discount on all parts' },
                { icon: '📦', text: 'Wholesale pricing for bulk orders' },
                { icon: '⚡', text: 'Priority order processing' },
                { icon: '📱', text: 'Dedicated mechanic support' },
              ].map((b, i) => (
                <View key={i} style={s.mechBenefitRow}>
                  <Text style={s.mechBenefitIcon}>{b.icon}</Text>
                  <Text style={s.mechBenefitText}>{b.text}</Text>
                </View>
              ))}
            </View>

            <View style={s.inputCard}>
              <Text style={s.inputCardTitle}>Enter Your Phone</Text>
              <Text style={s.inputLabel}>REGISTERED PHONE NUMBER</Text>
              <View style={[s.inputRow, { borderColor: 'rgba(255,193,7,0.3)' }]}>
                <Text style={s.inputIcon}>+91</Text>
                <TextInput
                  style={s.inputField}
                  placeholder="10-digit mobile number"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  value={phone} onChangeText={setPhone}
                  keyboardType="phone-pad" maxLength={10} />
              </View>
            </View>

            <TouchableOpacity
              style={[s.submitBtn, { backgroundColor: '#FFC107' }, (phone.length < 10 || loading) && { opacity: 0.4 }]}
              onPress={handleMechanicCheck}
              disabled={phone.length < 10 || loading}>
              {loading
                ? <ActivityIndicator color="#07111F" />
                : <Text style={[s.submitBtnText, { color: '#07111F' }]}>🔍 Check My Account</Text>}
            </TouchableOpacity>

            <View style={s.divider}>
              <View style={s.dividerLine} />
              <Text style={s.dividerLabel}>New Mechanic?</Text>
              <View style={s.dividerLine} />
            </View>

            <TouchableOpacity
              style={[s.outlineBtn, { borderColor: 'rgba(255,193,7,0.3)' }]}
              onPress={() => goToMode('mechanic_register')}>
              <Text style={[s.outlineBtnText, { color: '#FFC107' }]}>📝 Register as New Mechanic</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ══════════════════════════════════════
  // MECHANIC REGISTER
  // ══════════════════════════════════════
  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#07111F" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.formScroll} keyboardShouldPersistTaps="handled">

          <TouchableOpacity style={s.backBtn} onPress={() => goToMode('mechanic')}>
            <Text style={s.backBtnText}>← Back</Text>
          </TouchableOpacity>

          <View style={s.formHeader}>
            <View style={[s.formHeaderIcon, { backgroundColor: 'rgba(255,193,7,0.1)', borderColor: 'rgba(255,193,7,0.3)' }]}>
              <Text style={{ fontSize: 36 }}>📝</Text>
            </View>
            <Text style={[s.formTitle, { color: '#FFC107' }]}>Register as Mechanic</Text>
            <Text style={s.formSub}>Fill details · Owner will approve you!</Text>
          </View>

          <View style={s.inputCard}>
            <Text style={s.inputCardTitle}>Your Details</Text>

            {[
              { label: 'FULL NAME *', icon: '🔧', value: name, setter: setName, placeholder: 'Your full name', caps: 'words' },
              { label: 'PHONE NUMBER *', icon: '+91', value: phone, setter: setPhone, placeholder: '10-digit number', keyboard: 'phone-pad', max: 10 },
              { label: 'GARAGE / SHOP NAME', icon: '🏪', value: shopName, setter: setShopName, placeholder: 'Your shop name (optional)', caps: 'words' },
              { label: 'AREA IN NANDYAL', icon: '📍', value: area, setter: setArea, placeholder: 'Your area (optional)', caps: 'words' },
            ].map((field, i) => (
              <View key={i} style={{ marginBottom: 14 }}>
                <Text style={s.inputLabel}>{field.label}</Text>
                <View style={[s.inputRow, { borderColor: 'rgba(255,193,7,0.25)' }]}>
                  <Text style={s.inputIcon}>{field.icon}</Text>
                  <TextInput
                    style={s.inputField}
                    placeholder={field.placeholder}
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={field.value} onChangeText={field.setter}
                    keyboardType={field.keyboard || 'default'}
                    autoCapitalize={field.caps || 'none'}
                    maxLength={field.max} />
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[s.submitBtn, { backgroundColor: '#FFC107' }, (!name || phone.length < 10 || loading) && { opacity: 0.4 }]}
            onPress={handleMechanicRegister}
            disabled={!name || phone.length < 10 || loading}>
            {loading
              ? <ActivityIndicator color="#07111F" />
              : <Text style={[s.submitBtnText, { color: '#07111F' }]}>🔧 Submit for Approval</Text>}
          </TouchableOpacity>

          <View style={s.approvalCard}>
            <Text style={s.approvalTitle}>What happens next?</Text>
            {[
              { icon: '1️⃣', text: 'Your request is sent to the store owner' },
              { icon: '2️⃣', text: 'Owner reviews and approves within 24 hours' },
              { icon: '3️⃣', text: 'You get 5% discount on all parts!' },
            ].map((step, i) => (
              <View key={i} style={s.approvalStep}>
                <Text style={s.approvalStepIcon}>{step.icon}</Text>
                <Text style={s.approvalStepText}>{step.text}</Text>
              </View>
            ))}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07111F' },

  // Select screen
  selectScroll: { padding: 20 },

  // Hero
  hero: { alignItems: 'center', paddingVertical: 24 },
  shieldWrap: { marginBottom: 16 },
  shield: {
    width: 110, height: 130, backgroundColor: '#0D1F3C',
    borderWidth: 2.5, borderColor: '#C9A84C',
    borderRadius: 20, borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50, alignItems: 'center',
    justifyContent: 'center', gap: 4,
    shadowColor: '#C9A84C', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
  },
  shieldRAS: { fontSize: 28, fontWeight: 'bold', color: '#fff', letterSpacing: 4 },
  shieldBike: { fontSize: 22 },
  heroTagline: { fontSize: 9, color: '#C9A84C', letterSpacing: 4, marginBottom: 6 },
  heroName: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 4, textAlign: 'center' },
  heroLocation: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 20 },

  // Stats
  statsRow: {
    flexDirection: 'row', gap: 0,
    backgroundColor: '#0D1F3C', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)',
    overflow: 'hidden', width: width - 40,
  },
  statBox: { flex: 1, alignItems: 'center', padding: 14 },
  statNum: { fontSize: 18, fontWeight: 'bold', color: '#C9A84C', marginBottom: 2 },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)' },

  // Section label
  sectionLabel: {
    fontSize: 10, color: 'rgba(255,255,255,0.3)',
    letterSpacing: 3, marginBottom: 14, marginTop: 8,
  },

  // Role cards
  roleCard: {
    backgroundColor: '#0D1F3C', borderRadius: 20,
    padding: 18, flexDirection: 'row', alignItems: 'center',
    gap: 14, marginBottom: 12, borderWidth: 1,
    borderColor: 'rgba(79,110,247,0.25)',
    shadowColor: '#4F6EF7', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 6, elevation: 4,
  },
  mechCard: {
    borderColor: 'rgba(255,193,7,0.25)',
    shadowColor: '#FFC107',
  },
  roleIconBox: {
    width: 56, height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  roleIconEmoji: { fontSize: 28 },
  roleInfo: { flex: 1 },
  roleTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 2 },
  roleSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 2 },
  roleTe: { fontSize: 11, color: 'rgba(79,110,247,0.5)', marginBottom: 8 },
  roleTagRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  roleTag: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  roleTagText: { fontSize: 10, fontWeight: 'bold' },
  roleArrow: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(79,110,247,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  roleArrowText: { fontSize: 18, color: '#4F6EF7', fontWeight: 'bold' },

  // Store info
  storeInfoBox: {
    backgroundColor: '#0D1F3C', borderRadius: 16,
    padding: 14, marginTop: 8, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)', gap: 10,
  },
  storeInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  storeInfoIcon: { fontSize: 16, width: 24 },
  storeInfoText: { fontSize: 12, color: 'rgba(255,255,255,0.4)', flex: 1 },

  // Form screens
  formScroll: { flexGrow: 1, padding: 20 },
  backBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)', alignSelf: 'flex-start',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 24,
  },
  backBtnText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 'bold' },

  formHeader: { alignItems: 'center', marginBottom: 24 },
  formHeaderIcon: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, marginBottom: 14,
  },
  formTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 6 },
  formSub: { fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },

  // Input card
  inputCard: {
    backgroundColor: '#0D1F3C', borderRadius: 20,
    padding: 16, marginBottom: 16, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  inputCardTitle: { fontSize: 13, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  inputLabel: {
    fontSize: 10, color: 'rgba(255,255,255,0.35)',
    letterSpacing: 2, marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: 'rgba(79,110,247,0.2)', gap: 10,
  },
  inputIcon: { fontSize: 15, color: 'rgba(255,255,255,0.35)', fontWeight: 'bold', minWidth: 28 },
  inputField: { flex: 1, color: '#fff', fontSize: 16 },
  validText: { fontSize: 11, color: '#4ADE80', marginTop: 6, marginLeft: 4 },

  // Features box
  featuresBox: {
    backgroundColor: '#0D1F3C', borderRadius: 16,
    padding: 14, marginBottom: 16, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)', gap: 12,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIcon: { fontSize: 20, width: 28 },
  featureText: { fontSize: 13, color: 'rgba(255,255,255,0.6)', flex: 1 },

  // Submit button
  submitBtn: {
    borderRadius: 20, padding: 18, alignItems: 'center',
    marginBottom: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  submitBtnText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },

  // Mechanic benefits
  mechBenefitsCard: {
    backgroundColor: 'rgba(255,193,7,0.06)', borderRadius: 16,
    padding: 14, marginBottom: 16, borderWidth: 1,
    borderColor: 'rgba(255,193,7,0.15)',
  },
  mechBenefitsTitle: { fontSize: 14, fontWeight: 'bold', color: '#FFC107', marginBottom: 12 },
  mechBenefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  mechBenefitIcon: { fontSize: 18, width: 26 },
  mechBenefitText: { fontSize: 13, color: 'rgba(255,255,255,0.6)', flex: 1 },

  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  dividerLabel: { fontSize: 12, color: 'rgba(255,255,255,0.3)' },

  // Outline button
  outlineBtn: {
    borderRadius: 16, padding: 16, borderWidth: 1,
    alignItems: 'center', marginBottom: 10,
  },
  outlineBtnText: { fontSize: 15, fontWeight: 'bold' },

  // Approval card
  approvalCard: {
    backgroundColor: 'rgba(255,193,7,0.06)', borderRadius: 16,
    padding: 14, borderWidth: 1, borderColor: 'rgba(255,193,7,0.15)',
  },
  approvalTitle: { fontSize: 13, fontWeight: 'bold', color: '#FFC107', marginBottom: 12 },
  approvalStep: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 10 },
  approvalStepIcon: { fontSize: 18 },
  approvalStepText: { fontSize: 13, color: 'rgba(255,255,255,0.6)', flex: 1, lineHeight: 20 },
});
