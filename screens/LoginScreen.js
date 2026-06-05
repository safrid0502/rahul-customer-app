import { useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  SafeAreaView, StatusBar, TextInput,
  KeyboardAvoidingView, Platform,
  ScrollView, Alert, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const API_URL = 'https://rahul-auto-spares-backend.onrender.com';

export default function LoginScreen({
  onCustomerLogin, onMechanicLogin, onMechanicPending
}) {
  const [mode, setMode] = useState('select');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [shopName, setShopName] = useState('');
  const [area, setArea] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCustomerLogin = async () => {
    if (!name.trim()) {
      Alert.alert('❌', 'Please enter your name'); return;
    }
    if (phone.length < 10) {
      Alert.alert('❌', 'Enter valid 10 digit phone'); return;
    }
    await Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success
    );
    const user = {
      name: name.trim(), phone: phone.trim(), type: 'customer'
    };
    await AsyncStorage.setItem(
      'customer_profile', JSON.stringify(user)
    );
    onCustomerLogin(user);
  };

  const handleMechanicPhoneCheck = async () => {
    if (phone.length < 10) {
      Alert.alert('❌', 'Enter valid 10 digit phone'); return;
    }
    setLoading(true);
    try {
      const r = await fetch(
        `${API_URL}/mechanics/check/${phone.trim()}`
      );
      const d = await r.json();
      setLoading(false);
      if (d.status === 'approved') {
        const m = {
          name: d.name, phone: d.phone,
          shop_name: d.shop_name, area: d.area,
          type: 'mechanic', status: 'approved'
        };
        await AsyncStorage.setItem(
          'mechanic_profile', JSON.stringify(m)
        );
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
        onMechanicLogin(m);
      } else if (
        d.status === 'pending' || d.status === 'rejected'
      ) {
        const m = {
          name: d.name, phone: d.phone,
          shop_name: d.shop_name, area: d.area,
          type: 'mechanic', status: d.status
        };
        await AsyncStorage.setItem(
          'mechanic_profile', JSON.stringify(m)
        );
        onMechanicPending(m, d.status);
      } else {
        setMode('mechanic_register');
      }
    } catch {
      setLoading(false);
      setMode('mechanic_register');
    }
  };

  const handleMechanicRegister = async () => {
    if (!name.trim()) {
      Alert.alert('❌', 'Please enter your name'); return;
    }
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/mechanics/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(), phone: phone.trim(),
          shop_name: shopName.trim(), area: area.trim()
        })
      });
      const d = await r.json();
      setLoading(false);
      const m = {
        name: name.trim(), phone: phone.trim(),
        shop_name: shopName.trim(), area: area.trim(),
        type: 'mechanic', status: d.status || 'pending'
      };
      await AsyncStorage.setItem(
        'mechanic_profile', JSON.stringify(m)
      );
      if (d.status === 'approved') {
        onMechanicLogin(m);
      } else {
        onMechanicPending(m, d.status || 'pending');
      }
    } catch {
      setLoading(false);
      Alert.alert('❌ Error', 'Check your internet connection');
    }
  };

  // ── SELECT MODE ──
  if (mode === 'select') {
    return (
      <SafeAreaView style={s.container}>
        <StatusBar barStyle="light-content"
          backgroundColor="#06060E" />
        <View style={s.body}>
          <View style={s.logoSection}>
            <View style={s.logoRing}>
              <Text style={s.logoIcon}>🏍️</Text>
            </View>
            <Text style={s.logoSub}>WELCOME TO</Text>
            <Text style={s.logoName}>
              NEW RAHUL AUTO SPARES
            </Text>
            <Text style={s.logoLocation}>
              📍 Telugu Peta, Nandyal
            </Text>
          </View>

          <Text style={s.selectLabel}>Who are you?</Text>

          <TouchableOpacity
            style={s.modeCard}
            onPress={() => {
              Haptics.impactAsync(
                Haptics.ImpactFeedbackStyle.Light
              );
              setMode('customer');
            }}
          >
            <View style={[s.modeIconBox,
              { backgroundColor: 'rgba(79,110,247,0.15)' }]}>
              <Text style={s.modeIcon}>🛍️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.modeTitle}>Customer</Text>
              <Text style={s.modeSub}>
                Browse parts · Place orders · Track delivery
              </Text>
              <Text style={s.modeSubTe}>
                స్పేర్ పార్ట్స్ కొనండి
              </Text>
            </View>
            <Text style={s.modeArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.modeCard,
              { borderColor: 'rgba(255,193,7,0.3)' }]}
            onPress={() => {
              Haptics.impactAsync(
                Haptics.ImpactFeedbackStyle.Light
              );
              setMode('mechanic');
            }}
          >
            <View style={[s.modeIconBox,
              { backgroundColor: 'rgba(255,193,7,0.12)' }]}>
              <Text style={s.modeIcon}>🔧</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.modeTitle, { color: '#FFC107' }]}>
                Mechanic
              </Text>
              <Text style={s.modeSub}>
                Get 5% discount · Wholesale prices
              </Text>
              <Text style={s.modeSubTe}>
                మెకానిక్ ఖాతా · 5% డిస్కౌంట్
              </Text>
            </View>
            <Text style={[s.modeArrow,
              { color: '#FFC107' }]}>→</Text>
          </TouchableOpacity>

          <View style={s.hoursBox}>
            <Text style={s.hoursText}>
              🕐 Mon–Sat: 10AM–9PM · Sun: 10AM–3PM
            </Text>
            <Text style={s.hoursPhone}>📞 08514-244944</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── CUSTOMER MODE ──
  if (mode === 'customer') {
    return (
      <SafeAreaView style={s.container}>
        <StatusBar barStyle="light-content"
          backgroundColor="#06060E" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={s.formBody}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableOpacity
              style={s.backChip}
              onPress={() => setMode('select')}
            >
              <Text style={s.backChipText}>← Back</Text>
            </TouchableOpacity>

            <View style={s.formHeader}>
              <Text style={s.formHeaderIcon}>🛍️</Text>
              <Text style={s.formHeaderTitle}>Customer Login</Text>
              <Text style={s.formHeaderSub}>
                Enter once · Saved automatically!
              </Text>
            </View>

            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Your Name</Text>
              <View style={s.inputBox}>
                <Text style={s.inputPrefix}>👤</Text>
                <TextInput
                  style={s.input}
                  placeholder="Enter your full name"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Phone Number</Text>
              <View style={s.inputBox}>
                <Text style={s.inputPrefix}>+91</Text>
                <TextInput
                  style={s.input}
                  placeholder="10 digit mobile number"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[s.submitBtn,
                { backgroundColor: '#4F6EF7' },
                (!name || phone.length < 10) && { opacity: 0.4 }
              ]}
              onPress={handleCustomerLogin}
              disabled={!name || phone.length < 10}
            >
              <Text style={s.submitBtnText}>🚀 Start Shopping</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── MECHANIC PHONE CHECK ──
  if (mode === 'mechanic') {
    return (
      <SafeAreaView style={s.container}>
        <StatusBar barStyle="light-content"
          backgroundColor="#06060E" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={s.formBody}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableOpacity
              style={s.backChip}
              onPress={() => setMode('select')}
            >
              <Text style={s.backChipText}>← Back</Text>
            </TouchableOpacity>

            <View style={s.formHeader}>
              <Text style={s.formHeaderIcon}>🔧</Text>
              <Text style={[s.formHeaderTitle,
                { color: '#FFC107' }]}>
                Mechanic Login
              </Text>
              <Text style={s.formHeaderSub}>
                Enter phone to check your account
              </Text>
            </View>

            <View style={s.benefitsBox}>
              {[
                '✅ 5% discount on all parts',
                '✅ Wholesale pricing',
                '✅ Priority order processing',
              ].map((b, i) => (
                <Text key={i} style={s.benefitText}>{b}</Text>
              ))}
              <Text style={s.benefitNote}>
                ⚠️ Requires store approval
              </Text>
            </View>

            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Your Phone Number</Text>
              <View style={[s.inputBox,
                { borderColor: 'rgba(255,193,7,0.3)' }]}>
                <Text style={s.inputPrefix}>+91</Text>
                <TextInput
                  style={s.input}
                  placeholder="10 digit mobile number"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[s.submitBtn,
                { backgroundColor: '#FFC107' },
                (phone.length < 10 || loading) && { opacity: 0.4 }
              ]}
              onPress={handleMechanicPhoneCheck}
              disabled={phone.length < 10 || loading}
            >
              {loading
                ? <ActivityIndicator color="#06060E" />
                : <Text style={[s.submitBtnText,
                    { color: '#06060E' }]}>
                    🔍 Check My Account
                  </Text>
              }
            </TouchableOpacity>

            <View style={s.dividerRow}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>New Mechanic?</Text>
              <View style={s.dividerLine} />
            </View>

            <TouchableOpacity
              style={[s.outlineBtn,
                { borderColor: 'rgba(255,193,7,0.3)' }]}
              onPress={() => setMode('mechanic_register')}
            >
              <Text style={[s.outlineBtnText,
                { color: '#FFC107' }]}>
                📝 Register as New Mechanic
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── MECHANIC REGISTER ──
  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content"
        backgroundColor="#06060E" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={s.formBody}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={s.backChip}
            onPress={() => setMode('mechanic')}
          >
            <Text style={s.backChipText}>← Back</Text>
          </TouchableOpacity>

          <View style={s.formHeader}>
            <Text style={s.formHeaderIcon}>📝</Text>
            <Text style={[s.formHeaderTitle,
              { color: '#FFC107' }]}>
              Register as Mechanic
            </Text>
            <Text style={s.formHeaderSub}>
              Fill details · Owner will approve you!
            </Text>
          </View>

          {[
            {
              label: 'Your Name *', icon: '🔧',
              value: name, setter: setName,
              placeholder: 'Full name', caps: 'words'
            },
            {
              label: 'Phone Number *', icon: '+91',
              value: phone, setter: setPhone,
              placeholder: '10 digit number',
              keyboard: 'phone-pad', max: 10
            },
            {
              label: 'Garage / Shop Name',
              icon: '🏪', value: shopName,
              setter: setShopName,
              placeholder: 'Your shop name (optional)',
              caps: 'words'
            },
            {
              label: 'Area in Nandyal',
              icon: '📍', value: area,
              setter: setArea,
              placeholder: 'Your area (optional)',
              caps: 'words'
            },
          ].map((field, i) => (
            <View key={i} style={s.inputGroup}>
              <Text style={s.inputLabel}>{field.label}</Text>
              <View style={[s.inputBox,
                { borderColor: 'rgba(255,193,7,0.25)' }]}>
                <Text style={s.inputPrefix}>{field.icon}</Text>
                <TextInput
                  style={s.input}
                  placeholder={field.placeholder}
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  value={field.value}
                  onChangeText={field.setter}
                  keyboardType={field.keyboard || 'default'}
                  autoCapitalize={field.caps || 'none'}
                  maxLength={field.max}
                />
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={[s.submitBtn,
              { backgroundColor: '#FFC107' },
              (!name || phone.length < 10 || loading) &&
              { opacity: 0.4 }
            ]}
            onPress={handleMechanicRegister}
            disabled={!name || phone.length < 10 || loading}
          >
            {loading
              ? <ActivityIndicator color="#06060E" />
              : <Text style={[s.submitBtnText,
                  { color: '#06060E' }]}>
                  🔧 Submit for Approval
                </Text>
            }
          </TouchableOpacity>

          <Text style={s.approvalNote}>
            ✅ Store will approve within 24 hours{'\n'}
            📱 You'll get notified when approved!
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06060E' },
  body: { flex: 1, padding: 20 },
  logoSection: { alignItems: 'center', paddingVertical: 30 },
  logoRing: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(79,110,247,0.1)', borderWidth: 2,
    borderColor: 'rgba(79,110,247,0.3)', alignItems: 'center',
    justifyContent: 'center', marginBottom: 16,
  },
  logoIcon: { fontSize: 52 },
  logoSub: {
    fontSize: 10, color: 'rgba(255,255,255,0.3)',
    letterSpacing: 4, marginBottom: 4,
  },
  logoName: {
    fontSize: 18, fontWeight: 'bold', color: '#ffffff',
    letterSpacing: 1, textAlign: 'center', marginBottom: 6,
  },
  logoLocation: {
    fontSize: 12, color: 'rgba(255,255,255,0.3)',
  },
  selectLabel: {
    fontSize: 13, color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2, marginBottom: 14, textTransform: 'uppercase',
  },
  modeCard: {
    backgroundColor: '#0E0E1C', borderRadius: 20, padding: 18,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 1, borderColor: 'rgba(79,110,247,0.2)',
    marginBottom: 12,
  },
  modeIconBox: {
    width: 52, height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  modeIcon: { fontSize: 26 },
  modeTitle: {
    fontSize: 17, fontWeight: 'bold',
    color: '#ffffff', marginBottom: 3,
  },
  modeSub: {
    fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 2,
  },
  modeSubTe: { fontSize: 11, color: 'rgba(79,110,247,0.5)' },
  modeArrow: {
    fontSize: 20, color: '#4F6EF7', fontWeight: 'bold',
  },
  hoursBox: { marginTop: 20, alignItems: 'center', gap: 6 },
  hoursText: { fontSize: 12, color: 'rgba(255,255,255,0.2)' },
  hoursPhone: { fontSize: 12, color: 'rgba(255,255,255,0.2)' },
  formBody: { flexGrow: 1, padding: 20 },
  backChip: {
    backgroundColor: 'rgba(79,110,247,0.1)', alignSelf: 'flex-start',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(79,110,247,0.2)',
    marginBottom: 20,
  },
  backChipText: {
    color: '#4F6EF7', fontSize: 14, fontWeight: 'bold',
  },
  formHeader: { alignItems: 'center', marginBottom: 24 },
  formHeaderIcon: { fontSize: 48, marginBottom: 12 },
  formHeaderTitle: {
    fontSize: 24, fontWeight: 'bold',
    color: '#ffffff', marginBottom: 6,
  },
  formHeaderSub: {
    fontSize: 13, color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
  },
  benefitsBox: {
    backgroundColor: 'rgba(255,193,7,0.06)', borderRadius: 16,
    padding: 14, marginBottom: 20, borderWidth: 1,
    borderColor: 'rgba(255,193,7,0.15)', gap: 6,
  },
  benefitText: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  benefitNote: {
    fontSize: 11, color: 'rgba(255,193,7,0.5)', marginTop: 4,
  },
  inputGroup: { marginBottom: 14 },
  inputLabel: {
    fontSize: 11, color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase',
  },
  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0E0E1C', borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1,
    borderColor: 'rgba(79,110,247,0.2)', gap: 10,
  },
  inputPrefix: {
    fontSize: 15, color: 'rgba(255,255,255,0.3)', fontWeight: 'bold',
  },
  input: { flex: 1, color: '#ffffff', fontSize: 16 },
  submitBtn: {
    borderRadius: 20, padding: 18, alignItems: 'center',
    marginTop: 8, marginBottom: 14,
  },
  submitBtnText: {
    color: '#ffffff', fontSize: 17, fontWeight: 'bold',
  },
  dividerRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, marginVertical: 16,
  },
  dividerLine: {
    flex: 1, height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dividerText: { fontSize: 12, color: 'rgba(255,255,255,0.3)' },
  outlineBtn: {
    borderRadius: 20, padding: 16, borderWidth: 1,
    alignItems: 'center',
  },
  outlineBtnText: { fontSize: 15, fontWeight: 'bold' },
  approvalNote: {
    fontSize: 12, color: 'rgba(255,255,255,0.25)',
    textAlign: 'center', lineHeight: 20, marginTop: 8,
  },
});