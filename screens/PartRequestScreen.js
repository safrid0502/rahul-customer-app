import { useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  SafeAreaView, StatusBar, ScrollView,
  TextInput, Alert, Linking,
  KeyboardAvoidingView, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const WHATSAPP = '916300281504';

const BIKE_BRANDS = [
  { id: 'hero',   label: 'Hero',   icon: '🏍️' },
  { id: 'honda',  label: 'Honda',  icon: '🏍️' },
  { id: 'tvs',    label: 'TVS',    icon: '🛵' },
  { id: 'bajaj',  label: 'Bajaj',  icon: '🏍️' },
  { id: 'yamaha', label: 'Yamaha', icon: '🏍️' },
  { id: 'suzuki', label: 'Suzuki', icon: '🏍️' },
  { id: 'other',  label: 'Other',  icon: '🔧' },
];

const URGENCY_OPTIONS = [
  { id: 'today',  label: '🔴 Need Today',    color: '#EF4444' },
  { id: 'week',   label: '🟡 Within a Week', color: '#F59E0B' },
  { id: 'anytime',label: '🟢 No Rush',       color: '#22C55E' },
];

export default function PartRequestScreen({ onBack, customer }) {
  const [partName, setPartName] = useState('');
  const [partDetail, setPartDetail] = useState('');
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [bikeModel, setBikeModel] = useState('');
  const [urgency, setUrgency] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!partName.trim()) {
      Alert.alert('❌', 'Please enter part name'); return;
    }
    if (!selectedBrand) {
      Alert.alert('❌', 'Please select your bike brand'); return;
    }
    if (!urgency) {
      Alert.alert('❌', 'Please select urgency'); return;
    }

    setSubmitting(true);
    await Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success
    );

    const msg =
      `🔍 *Part Request*\n\n` +
      `👤 Customer: ${customer?.name}\n` +
      `📱 Phone: +91 ${customer?.phone}\n\n` +
      `🔩 Part Needed: ${partName.trim()}\n` +
      `${partDetail ? `📝 Details: ${partDetail.trim()}\n` : ''}` +
      `🏍️ Bike: ${selectedBrand?.label}` +
      `${bikeModel ? ` ${bikeModel.trim()}` : ''}\n` +
      `⏰ Urgency: ${urgency?.label}\n\n` +
      `_Sent from New Rahul Auto Spares App_`;

    // Save locally
    try {
      const existing = await AsyncStorage.getItem('part_requests');
      const requests = existing ? JSON.parse(existing) : [];
      requests.push({
        id: Date.now(),
        partName: partName.trim(),
        brand: selectedBrand?.label,
        model: bikeModel,
        urgency: urgency?.id,
        date: new Date().toLocaleDateString(),
        status: 'pending'
      });
      await AsyncStorage.setItem(
        'part_requests', JSON.stringify(requests)
      );
    } catch {}

    // Send to owner via WhatsApp
    await Linking.openURL(
      `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`
    );

    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <SafeAreaView style={s.container}>
        <StatusBar barStyle="light-content"
          backgroundColor="#06060E" />
        <View style={s.successBox}>
          <Text style={s.successEmoji}>✅</Text>
          <Text style={s.successTitle}>Request Sent!</Text>
          <Text style={s.successTitleTe}>
            అభ్యర్థన పంపబడింది!
          </Text>
          <Text style={s.successText}>
            Your part request was sent to the store via WhatsApp.
            We will contact you at {customer?.phone} when
            the part is available!
          </Text>
          <View style={s.successCard}>
            <Text style={s.successCardItem}>
              🔩 {partName}
            </Text>
            <Text style={s.successCardItem}>
              🏍️ {selectedBrand?.label} {bikeModel}
            </Text>
            <Text style={s.successCardItem}>
              ⏰ {urgency?.label}
            </Text>
          </View>
          <TouchableOpacity
            style={s.doneBtn} onPress={onBack}>
            <Text style={s.doneBtnText}>← Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content"
        backgroundColor="#06060E" />

      {/* HEADER */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={onBack}>
          <Text style={s.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>🔍 Request a Part</Text>
          <Text style={s.headerSub}>
            పార్ట్ అందుబాటులో లేదా? మాకు చెప్పండి!
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ padding: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* INFO */}
          <View style={s.infoCard}>
            <Text style={s.infoEmoji}>💡</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.infoTitle}>
                Can't find your part?
              </Text>
              <Text style={s.infoText}>
                Fill this form and we'll source it for you!
                We'll call you when it's available.
              </Text>
            </View>
          </View>

          {/* PART NAME */}
          <Text style={s.label}>Part Name / పార్ట్ పేరు *</Text>
          <TextInput
            style={s.input}
            value={partName}
            onChangeText={setPartName}
            placeholder="e.g. Piston Kit, Gear Box, Clutch Plate"
            placeholderTextColor="rgba(255,255,255,0.25)"
            autoCapitalize="words"
          />

          {/* PART DETAILS */}
          <Text style={s.label}>
            Additional Details (Optional)
          </Text>
          <TextInput
            style={[s.input, { height: 80, textAlignVertical: 'top' }]}
            value={partDetail}
            onChangeText={setPartDetail}
            placeholder="Part number, color, size, year model..."
            placeholderTextColor="rgba(255,255,255,0.25)"
            multiline
          />

          {/* BIKE BRAND */}
          <Text style={s.label}>Your Bike Brand *</Text>
          <View style={s.brandGrid}>
            {BIKE_BRANDS.map(brand => (
              <TouchableOpacity
                key={brand.id}
                style={[s.brandBtn,
                  selectedBrand?.id === brand.id &&
                  s.brandBtnActive]}
                onPress={() => {
                  setSelectedBrand(brand);
                  Haptics.impactAsync(
                    Haptics.ImpactFeedbackStyle.Light
                  );
                }}
              >
                <Text style={s.brandBtnIcon}>{brand.icon}</Text>
                <Text style={[s.brandBtnLabel,
                  selectedBrand?.id === brand.id &&
                  { color: '#4F6EF7' }]}>
                  {brand.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* BIKE MODEL */}
          <Text style={s.label}>
            Bike Model (Optional)
          </Text>
          <TextInput
            style={s.input}
            value={bikeModel}
            onChangeText={setBikeModel}
            placeholder="e.g. Splendor+, CB Shine, Apache 160"
            placeholderTextColor="rgba(255,255,255,0.25)"
            autoCapitalize="words"
          />

          {/* URGENCY */}
          <Text style={s.label}>How Urgent? *</Text>
          <View style={s.urgencyRow}>
            {URGENCY_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.id}
                style={[s.urgencyBtn,
                  urgency?.id === opt.id && {
                    backgroundColor: opt.color + '20',
                    borderColor: opt.color
                  }]}
                onPress={() => {
                  setUrgency(opt);
                  Haptics.impactAsync(
                    Haptics.ImpactFeedbackStyle.Light
                  );
                }}
              >
                <Text style={[s.urgencyBtnText,
                  urgency?.id === opt.id &&
                  { color: opt.color }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* CUSTOMER INFO */}
          <View style={s.customerBox}>
            <Text style={s.customerBoxTitle}>
              📱 Your Contact Details
            </Text>
            <Text style={s.customerBoxText}>
              Name: {customer?.name}
            </Text>
            <Text style={s.customerBoxText}>
              Phone: +91 {customer?.phone}
            </Text>
            <Text style={s.customerBoxNote}>
              We will call you on this number!
            </Text>
          </View>

          {/* SUBMIT */}
          <TouchableOpacity
            style={[s.submitBtn,
              (submitting || !partName || !selectedBrand
                || !urgency) && { opacity: 0.5 }]}
            onPress={handleSubmit}
            disabled={submitting || !partName
              || !selectedBrand || !urgency}
          >
            <Text style={s.submitBtnText}>
              {submitting
                ? '⏳ Sending...'
                : '📤 Send Request via WhatsApp'}
            </Text>
          </TouchableOpacity>

          <Text style={s.note}>
            Your request will be sent to our store WhatsApp
            directly. We will respond within 2 hours!
          </Text>

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06060E' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, gap: 12, borderBottomWidth: 1,
    borderBottomColor: 'rgba(79,110,247,0.15)',
  },
  backBtn: {
    backgroundColor: 'rgba(79,110,247,0.1)', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1,
    borderColor: 'rgba(79,110,247,0.2)',
  },
  backBtnText: {
    color: '#4F6EF7', fontSize: 14, fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 17, fontWeight: 'bold', color: '#fff',
  },
  headerSub: {
    fontSize: 11, color: 'rgba(79,110,247,0.5)', marginTop: 2,
  },
  infoCard: {
    backgroundColor: 'rgba(79,110,247,0.08)', borderRadius: 14,
    padding: 14, flexDirection: 'row', gap: 10, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(79,110,247,0.2)',
  },
  infoEmoji: { fontSize: 28 },
  infoTitle: {
    fontSize: 14, fontWeight: 'bold', color: '#fff', marginBottom: 4,
  },
  infoText: {
    fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 18,
  },
  label: {
    fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 1,
    marginBottom: 8, textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#0E0E1C', borderRadius: 14, padding: 14,
    color: '#fff', fontSize: 14, borderWidth: 1,
    borderColor: 'rgba(79,110,247,0.2)', marginBottom: 14,
  },
  brandGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 8, marginBottom: 14,
  },
  brandBtn: {
    backgroundColor: '#0E0E1C', borderRadius: 12, padding: 10,
    alignItems: 'center', gap: 4, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)', minWidth: 70,
  },
  brandBtnActive: {
    backgroundColor: 'rgba(79,110,247,0.1)',
    borderColor: '#4F6EF7',
  },
  brandBtnIcon: { fontSize: 22 },
  brandBtnLabel: {
    fontSize: 11, fontWeight: 'bold',
    color: 'rgba(255,255,255,0.5)',
  },
  urgencyRow: { gap: 8, marginBottom: 14 },
  urgencyBtn: {
    backgroundColor: '#0E0E1C', borderRadius: 12,
    padding: 14, alignItems: 'center', borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  urgencyBtnText: {
    fontSize: 14, fontWeight: 'bold',
    color: 'rgba(255,255,255,0.5)',
  },
  customerBox: {
    backgroundColor: 'rgba(74,222,128,0.06)', borderRadius: 14,
    padding: 14, marginBottom: 14, borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.2)',
  },
  customerBoxTitle: {
    fontSize: 13, fontWeight: 'bold', color: '#4ADE80', marginBottom: 8,
  },
  customerBoxText: {
    fontSize: 13, color: '#fff', marginBottom: 2,
  },
  customerBoxNote: {
    fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 6,
  },
  submitBtn: {
    backgroundColor: '#25D366', borderRadius: 18,
    padding: 16, alignItems: 'center', marginBottom: 10,
  },
  submitBtnText: {
    color: '#fff', fontSize: 16, fontWeight: 'bold',
  },
  note: {
    fontSize: 11, color: 'rgba(255,255,255,0.3)',
    textAlign: 'center', lineHeight: 18,
  },
  successBox: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 32,
  },
  successEmoji: { fontSize: 80, marginBottom: 16 },
  successTitle: {
    fontSize: 28, fontWeight: 'bold', color: '#4ADE80', marginBottom: 4,
  },
  successTitleTe: {
    fontSize: 14, color: 'rgba(74,222,128,0.5)', marginBottom: 16,
  },
  successText: {
    fontSize: 14, color: 'rgba(255,255,255,0.5)',
    textAlign: 'center', lineHeight: 22, marginBottom: 20,
  },
  successCard: {
    backgroundColor: '#0E0E1C', borderRadius: 16, padding: 16,
    width: '100%', gap: 8, marginBottom: 24, borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.2)',
  },
  successCardItem: { fontSize: 14, color: '#fff' },
  doneBtn: {
    backgroundColor: '#4F6EF7', borderRadius: 16,
    paddingHorizontal: 32, paddingVertical: 14,
  },
  doneBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});