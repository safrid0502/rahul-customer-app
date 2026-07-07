// ════════════════════════════════════════════════════════════════
// CustomerProfileScreen.js — New Rahul Auto Spares
// Customer can view and edit their profile details
// ════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, Image,
  SafeAreaView, StatusBar, ScrollView, TextInput,
  Alert, ActivityIndicator, Switch
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

const API_URL = 'https://rahul-auto-spares-backend.onrender.com';
const PROFILE_KEY = 'customer_profile';

export default function CustomerProfileScreen({ customer, vehicle, loyaltyPoints, onBack, onLogout }) {

  // ── PROFILE STATE ──
  const [name, setName]           = useState(customer?.name || '');
  const [phone, setPhone]         = useState(customer?.phone || '');
  const [email, setEmail]         = useState('');
  const [address, setAddress]     = useState('');
  const [city, setCity]           = useState('Nandyal');
  const [pincode, setPincode]     = useState('');
  const [upiId, setUpiId]         = useState('');
  const [whatsapp, setWhatsapp]   = useState(customer?.phone || '');
  const [birthday, setBirthday]   = useState('');
  const [notes, setNotes]         = useState('');

  // ── PREFERENCES ──
  const [prefWhatsapp, setPrefWhatsapp]   = useState(true);
  const [prefNotifs, setPrefNotifs]       = useState(true);
  const [prefOffers, setPrefOffers]       = useState(true);

  // ── UI STATE ──
  const [saving, setSaving]         = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [editing, setEditing]     = useState(false);
  const [orderCount, setOrderCount] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);

  // ── LOAD SAVED PROFILE ──
  useEffect(() => {
    loadProfile();
    fetchOrderStats();
  }, []);

  const loadProfile = async () => {
    try {
      const saved = await AsyncStorage.getItem(PROFILE_KEY);
      if (saved) {
        const p = JSON.parse(saved);
        // Always use latest name/phone from login
        setName(p.name || customer?.name || '');
        setPhone(p.phone || customer?.phone || '');
        setName(p.name || customer?.name || '');
        setPhone(p.phone || customer?.phone || '');
        setEmail(p.email || '');
        setAddress(p.address || '');
        setCity(p.city || 'Nandyal');
        setPincode(p.pincode || '');
        setUpiId(p.upiId || '');
        setWhatsapp(p.whatsapp || customer?.phone || '');
        setBirthday(p.birthday || '');
        setNotes(p.notes || '');
        setProfileImage(p.profileImage || null);
        setPrefWhatsapp(p.prefWhatsapp ?? true);
        setPrefNotifs(p.prefNotifs ?? true);
        setPrefOffers(p.prefOffers ?? true);
      }
    } catch {}
  };

  const fetchOrderStats = async () => {
    try {
      const r = await fetch(`${API_URL}/orders/customer/${customer?.phone}`);
      const d = await r.json();
      const orders = d.orders || [];
      setOrderCount(orders.length);
      setTotalSpent(orders.reduce((s, o) => s + (o.total_amount || 0), 0));
    } catch {}
  };

  // ── SAVE PROFILE ──
  const pickProfileImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Please allow photo access');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets?.[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Could not pick image');
    }
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('❌', 'Name is required'); return; }
    if (!phone.trim()) { Alert.alert('❌', 'Phone is required'); return; }
    if (email && !email.includes('@')) { Alert.alert('❌', 'Invalid email address'); return; }
    if (upiId && !upiId.includes('@')) { Alert.alert('❌', 'Invalid UPI ID (e.g. name@upi)'); return; }

    setSaving(true);
    try {
      const profile = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
        upiId: upiId.trim(),
        whatsapp: whatsapp.trim(),
        birthday: birthday.trim(),
        notes: notes.trim(),
        profileImage: profileImage,
        prefWhatsapp,
        prefNotifs,
        prefOffers,
        updatedAt: new Date().toISOString(),
      };

      // Save locally — merge with existing login data
      const existing = await AsyncStorage.getItem(PROFILE_KEY);
      const existingData = existing ? JSON.parse(existing) : {};
      const merged = { ...existingData, ...profile };
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(merged));

      // Save to backend
      await fetch(`${API_URL}/customers/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
          email: profile.email,
          address: profile.address,
          city: profile.city,
          pincode: profile.pincode,
          upi_id: profile.upiId,
          whatsapp: profile.whatsapp,
        }),
      }).catch(() => {}); // silent fail — local save is enough

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEditing(false);
      Alert.alert('✅ Saved!', 'Your profile has been updated.');
    } catch {
      Alert.alert('❌ Error', 'Could not save profile. Try again.');
    }
    setSaving(false);
  };

  // ── RENDER ──
  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#06060E" />

      {/* HEADER */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={onBack}>
          <Text style={s.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>👤 My Profile</Text>
        <TouchableOpacity
          style={[s.editBtn, editing && s.editBtnActive]}
          onPress={() => editing ? handleSave() : setEditing(true)}
          disabled={saving}>
          {saving
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={s.editBtnText}>{editing ? '💾 Save' : '✏️ Edit'}</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>

        {/* ── PROFILE SUMMARY CARD ── */}
        <LinearGradient
          colors={['#1A1A2E', '#0E0E1C']}
          style={s.summaryCard}>
          <TouchableOpacity style={s.avatarBox} onPress={pickProfileImage}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={s.avatarImage} />
            ) : (
              <Text style={s.avatar}>
                {(name || customer?.name || '?')[0].toUpperCase()}
              </Text>
            )}
            <View style={s.avatarEditBadge}>
              <Text style={s.avatarEditText}>Edit</Text>
            </View>
          </TouchableOpacity>
          <Text style={s.summaryName}>{name || customer?.name}</Text>
          <Text style={s.summaryPhone}>📱 +91 {phone || customer?.phone}</Text>
          {vehicle && (
            <View style={s.summaryVehicle}>
              <Text style={s.summaryVehicleText}>
                🏍️ {vehicle.brand} {vehicle.model}
              </Text>
            </View>
          )}

          {/* STATS ROW */}
          <View style={s.statsRow}>
            <View style={s.statItem}>
              <Text style={s.statValue}>{orderCount}</Text>
              <Text style={s.statLabel}>Orders</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={s.statValue}>₹{totalSpent.toFixed(0)}</Text>
              <Text style={s.statLabel}>Total Spent</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={s.statValue}>{loyaltyPoints || 0}</Text>
              <Text style={s.statLabel}>💎 Points</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── PERSONAL DETAILS ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>👤 Personal Details</Text>

          <Text style={s.label}>Full Name *</Text>
          <TextInput style={[s.input, !editing && s.inputDisabled]}
            value={name} onChangeText={setName}
            placeholder="Your full name"
            placeholderTextColor="rgba(255,255,255,0.25)"
            editable={editing} />

          <Text style={s.label}>Phone Number *</Text>
          <TextInput style={[s.input, !editing && s.inputDisabled]}
            value={phone} onChangeText={setPhone}
            placeholder="10-digit mobile number"
            placeholderTextColor="rgba(255,255,255,0.25)"
            keyboardType="phone-pad"
            editable={editing}
            maxLength={10} />

          <Text style={s.label}>Email Address</Text>
          <TextInput style={[s.input, !editing && s.inputDisabled]}
            value={email} onChangeText={setEmail}
            placeholder="your@email.com (optional)"
            placeholderTextColor="rgba(255,255,255,0.25)"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={editing} />

          <Text style={s.label}>WhatsApp Number</Text>
          <TextInput style={[s.input, !editing && s.inputDisabled]}
            value={whatsapp} onChangeText={setWhatsapp}
            placeholder="WhatsApp number (if different)"
            placeholderTextColor="rgba(255,255,255,0.25)"
            keyboardType="phone-pad"
            editable={editing}
            maxLength={10} />

          <Text style={s.label}>Birthday (DD/MM)</Text>
          <TextInput style={[s.input, !editing && s.inputDisabled]}
            value={birthday} onChangeText={setBirthday}
            placeholder="e.g. 15/08 (for birthday offers!)"
            placeholderTextColor="rgba(255,255,255,0.25)"
            editable={editing} />
        </View>

        {/* ── ADDRESS ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>📍 Address</Text>

          <Text style={s.label}>Street / Area</Text>
          <TextInput style={[s.input, s.inputMulti, !editing && s.inputDisabled]}
            value={address} onChangeText={setAddress}
            placeholder="House no., Street, Area"
            placeholderTextColor="rgba(255,255,255,0.25)"
            multiline numberOfLines={2}
            editable={editing} />

          <Text style={s.label}>City</Text>
          <TextInput style={[s.input, !editing && s.inputDisabled]}
            value={city} onChangeText={setCity}
            placeholder="City"
            placeholderTextColor="rgba(255,255,255,0.25)"
            editable={editing} />

          <Text style={s.label}>PIN Code</Text>
          <TextInput style={[s.input, !editing && s.inputDisabled]}
            value={pincode} onChangeText={setPincode}
            placeholder="6-digit PIN code"
            placeholderTextColor="rgba(255,255,255,0.25)"
            keyboardType="numeric"
            editable={editing}
            maxLength={6} />
        </View>

        {/* ── PAYMENT DETAILS ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>💳 Payment Details</Text>

          <Text style={s.paymentNote}>
            💡 Add your UPI ID so staff can send payment requests directly
          </Text>

          <Text style={s.label}>UPI ID</Text>
          <TextInput style={[s.input, !editing && s.inputDisabled]}
            value={upiId} onChangeText={setUpiId}
            placeholder="e.g. yourname@upi / phone@paytm"
            placeholderTextColor="rgba(255,255,255,0.25)"
            autoCapitalize="none"
            editable={editing} />

          {/* PAYMENT METHODS INFO */}
          <Text style={s.label}>Accepted Payment Methods</Text>
          <View style={s.paymentMethods}>
            {['💵 Cash', '📱 UPI', '💳 Paytm', '🏦 NEFT'].map((method, i) => (
              <View key={i} style={s.paymentMethod}>
                <Text style={s.paymentMethodText}>{method}</Text>
              </View>
            ))}
          </View>


        </View>

        {/* ── PREFERENCES ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>🔔 Preferences</Text>

          <View style={s.prefRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.prefLabel}>WhatsApp Notifications</Text>
              <Text style={s.prefSub}>Order updates via WhatsApp</Text>
            </View>
            <Switch
              value={prefWhatsapp}
              onValueChange={v => { if (editing) setPrefWhatsapp(v); }}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: '#25D366' }}
              thumbColor={prefWhatsapp ? '#fff' : 'rgba(255,255,255,0.4)'}
              disabled={!editing}
            />
          </View>

          <View style={s.prefRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.prefLabel}>Push Notifications</Text>
              <Text style={s.prefSub}>App alerts when order is ready</Text>
            </View>
            <Switch
              value={prefNotifs}
              onValueChange={v => { if (editing) setPrefNotifs(v); }}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: '#4F6EF7' }}
              thumbColor={prefNotifs ? '#fff' : 'rgba(255,255,255,0.4)'}
              disabled={!editing}
            />
          </View>

          <View style={s.prefRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.prefLabel}>Offers & Deals</Text>
              <Text style={s.prefSub}>Flash deals and discount alerts</Text>
            </View>
            <Switch
              value={prefOffers}
              onValueChange={v => { if (editing) setPrefOffers(v); }}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: '#FFC107' }}
              thumbColor={prefOffers ? '#fff' : 'rgba(255,255,255,0.4)'}
              disabled={!editing}
            />
          </View>
        </View>

        {/* ── NOTES ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>📝 Notes</Text>
          <Text style={s.label}>Personal Notes (for your reference)</Text>
          <TextInput style={[s.input, s.inputMulti, !editing && s.inputDisabled]}
            value={notes} onChangeText={setNotes}
            placeholder="e.g. Bike service due in June, need chain kit..."
            placeholderTextColor="rgba(255,255,255,0.25)"
            multiline numberOfLines={3}
            editable={editing} />
        </View>

        {/* ── ACCOUNT ACTIONS ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>⚙️ Account</Text>

          <TouchableOpacity style={s.actionRow}
            onPress={async () => {
              Alert.alert(
                '🗑️ Clear Cache',
                'This will clear locally saved products cache. Your profile will be kept.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Clear', style: 'destructive', onPress: async () => {
                    await AsyncStorage.removeItem('products_cache_v4');
                    Alert.alert('✅ Done', 'Cache cleared! Products will reload fresh.');
                  }},
                ]
              );
            }}>
            <Text style={s.actionIcon}>🗑️</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.actionLabel}>Clear Products Cache</Text>
              <Text style={s.actionSub}>Force reload fresh products from server</Text>
            </View>
            <Text style={s.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.actionRow}
            onPress={async () => {
              Alert.alert(
                '🗑️ Clear Profile',
                'This will delete all your saved profile details.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: async () => {
                    await AsyncStorage.removeItem(PROFILE_KEY);
                    setEmail(''); setAddress(''); setCity('Nandyal');
                    setPincode(''); setUpiId(''); setBirthday(''); setNotes('');
                    Alert.alert('✅ Done', 'Profile data cleared.');
                  }},
                ]
              );
            }}>
            <Text style={s.actionIcon}>🔄</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.actionLabel}>Reset Profile Data</Text>
              <Text style={s.actionSub}>Clear all saved personal details</Text>
            </View>
            <Text style={s.actionArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* LOGOUT */}
        <TouchableOpacity style={s.logoutBtn}
          onPress={() => Alert.alert(
            'Logout?',
            'You will need to login again.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Logout', style: 'destructive', onPress: onLogout },
            ]
          )}>
          <Text style={s.logoutText}>← Logout</Text>
        </TouchableOpacity>

        {/* EDIT HINT */}
        {!editing && (
          <Text style={s.editHint}>
            Tap ✏️ Edit to update your details
          </Text>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06060E' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(79,110,247,0.15)',
    backgroundColor: '#0E0E1C',
  },
  backBtn: {
    backgroundColor: 'rgba(79,110,247,0.1)', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(79,110,247,0.2)',
  },
  backBtnText: { color: '#4F6EF7', fontSize: 14, fontWeight: 'bold' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: 'bold', color: '#fff' },
  editBtn: {
    backgroundColor: 'rgba(79,110,247,0.1)', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(79,110,247,0.2)',
  },
  editBtnActive: { backgroundColor: '#4F6EF7', borderColor: '#4F6EF7' },
  editBtnText: { color: '#4F6EF7', fontSize: 13, fontWeight: 'bold' },

  // Summary card
  summaryCard: {
    borderRadius: 20, padding: 20, marginBottom: 14,
    alignItems: 'center', borderWidth: 1,
    borderColor: 'rgba(79,110,247,0.2)',
  },
  avatarImage: { width: 72, height: 72, borderRadius: 36 },
  avatarEditBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: '#C9A84C', borderRadius: 10,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  avatarEditText: { fontSize: 9, fontWeight: 'bold', color: '#07111F' },
  avatarBox: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#4F6EF7', alignItems: 'center',
    justifyContent: 'center', marginBottom: 10,
  },
  avatar: { fontSize: 32, color: '#fff', fontWeight: 'bold' },
  summaryName: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  summaryPhone: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8 },
  summaryVehicle: {
    backgroundColor: 'rgba(79,110,247,0.15)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 4, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(79,110,247,0.3)',
  },
  summaryVehicleText: { color: '#4F6EF7', fontSize: 12, fontWeight: 'bold' },
  statsRow: {
    flexDirection: 'row', width: '100%',
    borderTopWidth: 1, borderTopColor: 'rgba(79,110,247,0.15)',
    paddingTop: 14, gap: 0,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#FFC107' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  statDivider: { width: 1, backgroundColor: 'rgba(79,110,247,0.15)' },

  // Cards
  card: {
    backgroundColor: '#0E0E1C', borderRadius: 16, padding: 16,
    marginBottom: 14, borderWidth: 1, borderColor: 'rgba(79,110,247,0.12)',
  },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#fff', marginBottom: 12 },

  // Form
  label: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10,
    padding: 12, color: '#fff', fontSize: 14,
    borderWidth: 1, borderColor: 'rgba(79,110,247,0.2)',
  },
  inputDisabled: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(79,110,247,0.08)',
    color: 'rgba(255,255,255,0.6)',
  },
  inputMulti: { height: 70, textAlignVertical: 'top' },

  // Payment
  paymentNote: {
    fontSize: 12, color: '#FFC107',
    backgroundColor: 'rgba(255,193,7,0.08)', borderRadius: 8,
    padding: 10, marginBottom: 4,
    borderWidth: 1, borderColor: 'rgba(255,193,7,0.2)',
  },
  paymentMethods: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  paymentMethod: {
    backgroundColor: 'rgba(79,110,247,0.08)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(79,110,247,0.15)',
  },
  paymentMethodText: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  storeUpiBox: {
    backgroundColor: 'rgba(37,211,102,0.08)', borderRadius: 10,
    padding: 10, marginTop: 10, flexDirection: 'row',
    alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: 'rgba(37,211,102,0.2)',
  },
  storeUpiLabel: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  storeUpiValue: { fontSize: 13, color: '#25D366', fontWeight: 'bold' },

  // Preferences
  prefRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1,
    borderBottomColor: 'rgba(79,110,247,0.08)',
  },
  prefLabel: { fontSize: 14, color: '#fff', fontWeight: '600', marginBottom: 2 },
  prefSub: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },

  // Actions
  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, borderBottomWidth: 1,
    borderBottomColor: 'rgba(79,110,247,0.08)',
  },
  actionIcon: { fontSize: 22 },
  actionLabel: { fontSize: 14, color: '#fff', fontWeight: '600', marginBottom: 2 },
  actionSub: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  actionArrow: { color: '#4F6EF7', fontSize: 18, fontWeight: 'bold' },

  // Logout
  logoutBtn: {
    backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 14,
    padding: 14, alignItems: 'center', marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
  },
  logoutText: { color: '#EF4444', fontWeight: 'bold', fontSize: 15 },
  editHint: {
    textAlign: 'center', fontSize: 12,
    color: 'rgba(255,255,255,0.2)', marginBottom: 10,
  },
});
