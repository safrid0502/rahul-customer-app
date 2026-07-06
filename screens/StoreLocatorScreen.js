import { useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  SafeAreaView, StatusBar, ScrollView,
  Linking, Animated, Platform, Share
} from 'react-native';
import * as Haptics from 'expo-haptics';

const STORE = {
  name: 'New Rahul Auto Spares',
  nameTe: 'న్యూ రాహుల్ ఆటో స్పేర్స్',
  address: 'Telugu Peta, Nandyal - 518501',
  addressTe: 'తెలుగు పేట, నంద్యాల - 518501',
  phone: '08514-244944',
  mobile: '6300281504',
  whatsapp: '916300281504',
  plusCode: 'FFQH+76',
  lat: 15.4770,
  lng: 78.4820,
  timings: [
    { day: 'Monday - Saturday', time: '10:00 AM - 9:00 PM', open: true },
    { day: 'Sunday',            time: '10:00 AM - 3:00 PM', open: true },
  ],
  landmarks: [
    '📍 Telugu Peta, Nandyal - 518501',
    '🗺️ Plus Code: FFQH+76 Nandyala',
    '🏍️ Two Wheeler Spare Parts Shop',
    '🏪 Nayara Petrol Bunk Nearby',
  ],
  features: [
    '✅ All Major Bike Brands',
    '✅ Hero · Honda · TVS · Bajaj',
    '✅ Yamaha · Suzuki Parts',
    '✅ Engine Oils & Lubricants',
    '✅ Original OEM Parts Only',
    '✅ Home Delivery Available',
  ]
};

function ActionButton({ icon, label, color, onPress }) {
  return (
    <TouchableOpacity
      style={[ab.btn, { borderColor: color + '60' }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[ab.iconBox, { backgroundColor: color + '15' }]}>
        <Text style={ab.icon}>{icon}</Text>
      </View>
      <Text style={[ab.label, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const ab = StyleSheet.create({
  btn: {
    flex: 1, borderRadius: 16, padding: 12,
    alignItems: 'center', gap: 6, borderWidth: 1.5,
    backgroundColor: '#0E0E1C',
  },
  iconBox: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  icon: { fontSize: 22 },
  label: { fontSize: 11, fontWeight: 'bold', textAlign: 'center' },
});

function InfoRow({ icon, label, value, onPress, color, sublabel }) {
  return (
    <TouchableOpacity
      style={ir.row}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[ir.iconBox, { backgroundColor: (color || '#4F6EF7') + '15' }]}>
        <Text style={ir.icon}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={ir.label}>{label}</Text>
        <Text style={[ir.value, color && { color }]}>{value}</Text>
        {sublabel && <Text style={ir.sublabel}>{sublabel}</Text>}
      </View>
      {onPress && (
        <View style={[ir.arrow, { backgroundColor: (color || '#4F6EF7') + '15' }]}>
          <Text style={[ir.arrowText, { color: color || '#4F6EF7' }]}>→</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const ir = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, borderBottomWidth: 1,
    borderBottomColor: 'rgba(79,110,247,0.08)',
  },
  iconBox: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  icon: { fontSize: 20 },
  label: {
    fontSize: 10, color: 'rgba(255,255,255,0.35)',
    marginBottom: 2, textTransform: 'uppercase', letterSpacing: 1,
  },
  value: { fontSize: 14, fontWeight: '600', color: '#fff' },
  sublabel: { fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 },
  arrow: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  arrowText: { fontSize: 16, fontWeight: 'bold' },
});

export default function StoreLocatorScreen({ onBack }) {
  const slideAnim = useRef(new Animated.Value(30)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const isOpenNow = () => {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    const min = now.getMinutes();
    const time = hour + min / 60;
    if (day === 0) return time >= 10 && time < 15;
    return time >= 10 && time < 21;
  };

  const open = isOpenNow();

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0, tension: 60,
        friction: 8, useNativeDriver: true
      }),
      Animated.timing(opacityAnim, {
        toValue: 1, duration: 400, useNativeDriver: true
      }),
    ]).start();

    if (open) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.06, duration: 1000, useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1, duration: 1000, useNativeDriver: true
          }),
        ])
      ).start();
    }
  }, []);

  const openGoogleMaps = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(
      'https://www.google.com/maps/place/FFQH%2B76+Nandyala,+Andhra+Pradesh,+India'
    );
  };

  const openDirections = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(
      `https://www.google.com/maps/dir/?api=1` +
      `&destination=${STORE.lat},${STORE.lng}`
    );
  };

  const callStore = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(`tel:08514244944`);
  };

  const callMobile = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(`tel:${STORE.mobile}`);
  };

  const openWhatsApp = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(
      `https://wa.me/${STORE.whatsapp}?text=` +
      encodeURIComponent(
        `Hi! I need help finding your store.\n` +
        `Please share the directions to New Rahul Auto Spares, Nandyal.`
      )
    );
  };

  const shareLocation = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Share.share({
      message:
        `🏪 *New Rahul Auto Spares*\n` +
        `📍 Telugu Peta, Nandyal - 518501\n` +
        `🗺️ Plus Code: FFQH+76\n` +
        `📞 08514-244944\n` +
        `📱 +91 6300281504\n\n` +
        `🗺️ Google Maps:\n` +
        `https://www.google.com/maps/place/FFQH%2B76+Nandyala,+Andhra+Pradesh`,
      title: 'New Rahul Auto Spares Location',
    });
  };

  const openPlusCode = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(
      'https://plus.codes/FFQH%2B76%20Nandyala'
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#06060E" />

      {/* HEADER */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={onBack}>
          <Text style={s.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>📍 Find Our Store</Text>
          <Text style={s.headerSub}>దుకాణం ఎక్కడుందో చూడండి</Text>
        </View>
        <TouchableOpacity style={s.shareBtn} onPress={shareLocation}>
          <Text style={s.shareBtnText}>🔗 Share</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* MAP CARD */}
        <Animated.View style={[s.mapCard, {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim
        }]}>
          <TouchableOpacity
            style={s.mapPreview}
            onPress={openGoogleMaps}
            activeOpacity={0.9}
          >
            {/* Map Background */}
            <View style={s.mapBg}>
              {/* Grid lines for map feel */}
              <View style={s.gridH1} />
              <View style={s.gridH2} />
              <View style={s.gridV1} />
              <View style={s.gridV2} />

              {/* Center content */}
              <View style={s.mapCenter}>
                <Text style={s.mapEmoji}>🗺️</Text>
                <Text style={s.mapLabel}>New Rahul Auto Spares</Text>
                <Text style={s.mapAddr}>
                  Telugu Peta, Nandyal
                </Text>
                <View style={s.plusCodeBadge}>
                  <Text style={s.plusCodeText}>
                    📍 FFQH+76
                  </Text>
                </View>
                <Text style={s.tapHint}>
                  Tap to open in Google Maps →
                </Text>
              </View>

              {/* Location PIN */}
              <View style={s.pin}>
                <View style={s.pinHead} />
                <View style={s.pinTail} />
              </View>
            </View>

            {/* OPEN/CLOSED BADGE */}
            <Animated.View style={[
              s.statusBadge,
              open ? s.statusOpen : s.statusClosed,
              open && { transform: [{ scale: pulseAnim }] }
            ]}>
              <View style={[s.statusDot,
                { backgroundColor: open ? '#4ADE80' : '#EF4444' }]} />
              <Text style={[s.statusText,
                { color: open ? '#4ADE80' : '#EF4444' }]}>
                {open ? '🟢 Open Now' : '🔴 Closed Now'}
              </Text>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>

        {/* ACTION BUTTONS */}
        <View style={s.actionRow}>
          <ActionButton icon="🗺️" label="View Map"
            color="#4F6EF7" onPress={openGoogleMaps} />
          <ActionButton icon="🧭" label="Directions"
            color="#4ADE80" onPress={openDirections} />
          <ActionButton icon="📍" label="Plus Code"
            color="#A78BFA" onPress={openPlusCode} />
          <ActionButton icon="🔗" label="Share"
            color="#FFC107" onPress={shareLocation} />
        </View>

        {/* CALL/WHATSAPP ROW */}
        <View style={s.contactRow}>
          <TouchableOpacity style={s.callBigBtn} onPress={callStore}>
            <Text style={s.callBigIcon}>📞</Text>
            <View>
              <Text style={s.callBigLabel}>Landline</Text>
              <Text style={s.callBigNum}>08514-244944</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.callBigBtn, { borderColor: 'rgba(37,211,102,0.3)' }]}
            onPress={openWhatsApp}
          >
            <Text style={s.callBigIcon}>💬</Text>
            <View>
              <Text style={[s.callBigLabel, { color: '#25D366' }]}>WhatsApp</Text>
              <Text style={s.callBigNum}>+91 {STORE.mobile}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* STORE DETAILS CARD */}
        <View style={s.card}>
          <Text style={s.cardTitle}>🏪 Store Details</Text>

          <InfoRow
            icon="📍" label="Address (English)"
            value={STORE.address}
            onPress={openGoogleMaps}
            color="#4F6EF7"
          />
          <InfoRow
            icon="📍" label="చిరునామా (Telugu)"
            value={STORE.addressTe}
          />
          <InfoRow
            icon="🗺️" label="Google Plus Code"
            value="FFQH+76 Nandyala"
            sublabel="Tap to open in maps"
            onPress={openPlusCode}
            color="#A78BFA"
          />
          <InfoRow
            icon="📞" label="Landline"
            value="08514-244944"
            onPress={callStore}
            color="#FFC107"
          />
          <InfoRow
            icon="📱" label="Mobile / WhatsApp"
            value={`+91 ${STORE.mobile}`}
            onPress={callMobile}
            color="#4ADE80"
          />
          <InfoRow
            icon="💬" label="WhatsApp Chat"
            value="Chat with the store"
            onPress={openWhatsApp}
            color="#25D366"
          />
        </View>

        {/* TIMINGS CARD */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <Text style={s.cardTitle}>🕐 Store Timings</Text>
            <Animated.View style={[
              s.liveNow,
              open && { transform: [{ scale: pulseAnim }] }
            ]}>
              <View style={[s.liveDot,
                { backgroundColor: open ? '#4ADE80' : '#EF4444' }]} />
              <Text style={[s.liveText,
                { color: open ? '#4ADE80' : '#EF4444' }]}>
                {open ? 'OPEN' : 'CLOSED'}
              </Text>
            </Animated.View>
          </View>

          {STORE.timings.map((t, i) => {
            const isToday = i === 0
              ? new Date().getDay() !== 0
              : new Date().getDay() === 0;
            return (
              <View key={i} style={[s.timingRow,
                isToday && s.timingRowToday]}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.timingDay,
                    isToday && { color: '#fff' }]}>
                    {t.day}
                  </Text>
                  {isToday && (
                    <Text style={s.todayTag}>Today</Text>
                  )}
                </View>
                <Text style={[s.timingTime,
                  isToday && open && { color: '#4ADE80' },
                  isToday && !open && { color: '#EF4444' }]}>
                  {t.time}
                </Text>
              </View>
            );
          })}

          <View style={[s.todayStatus,
            open ? s.todayOpen : s.todayClosed]}>
            <Text style={[s.todayStatusText,
              { color: open ? '#4ADE80' : '#EF4444' }]}>
              {open
                ? '🟢 We are Open Right Now! · ఇప్పుడు తెరిచి ఉన్నాము!'
                : '🔴 We are Closed Right Now · ఇప్పుడు మూసి ఉన్నాము'}
            </Text>
          </View>
        </View>

        {/* HOW TO FIND US */}
        <View style={s.card}>
          <Text style={s.cardTitle}>🧭 How to Find Us</Text>
          {STORE.landmarks.map((l, i) => (
            <View key={i} style={s.landmarkRow}>
              <Text style={s.landmark}>{l}</Text>
            </View>
          ))}
          <TouchableOpacity
            style={s.directionsBtn}
            onPress={openDirections}
          >
            <Text style={s.directionsBtnText}>
              🧭 Get Turn-by-Turn Directions
            </Text>
          </TouchableOpacity>
        </View>

        {/* WHAT WE SELL */}
        <View style={s.card}>
          <Text style={s.cardTitle}>🏍️ What We Sell</Text>
          <View style={s.featuresGrid}>
            {STORE.features.map((f, i) => (
              <View key={i} style={s.featureChip}>
                <Text style={s.featureText}>{f}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* SHARE CARD */}
        <View style={[s.card, { borderColor: 'rgba(37,211,102,0.2)' }]}>
          <Text style={s.cardTitle}>📤 Share Store Location</Text>
          <Text style={s.shareSubtext}>
            Share our location with friends and family!
          </Text>
          <View style={s.shareBtnsRow}>
            <TouchableOpacity
              style={s.waShareBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                Linking.openURL(
                  `https://wa.me/?text=` +
                  encodeURIComponent(
                    `🏪 *New Rahul Auto Spares*\n` +
                    `📍 Telugu Peta, Nandyal - 518501\n` +
                    `🗺️ Plus Code: FFQH+76\n` +
                    `📞 08514-244944 · 📱 +91 6300281504\n\n` +
                    `🗺️ Open in Maps:\n` +
                    `https://www.google.com/maps/place/FFQH%2B76+Nandyala`
                  )
                );
              }}>
              <Text style={s.waShareBtnText}>💬 Share on WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.mapsShareBtn}
              onPress={openGoogleMaps}>
              <Text style={s.mapsShareBtnText}>🗺️ Open Maps</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06060E' },
  header: {
    backgroundColor: '#0E0E1C', paddingHorizontal: 16,
    paddingVertical: 14, flexDirection: 'row',
    alignItems: 'center', gap: 10, borderBottomWidth: 1,
    borderBottomColor: 'rgba(79,110,247,0.15)',
  },
  backBtn: {
    backgroundColor: 'rgba(79,110,247,0.1)', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1,
    borderColor: 'rgba(79,110,247,0.2)',
  },
  backBtnText: { color: '#4F6EF7', fontSize: 14, fontWeight: 'bold' },
  headerTitle: { fontSize: 17, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 10, color: 'rgba(79,110,247,0.4)', marginTop: 2 },
  shareBtn: {
    backgroundColor: 'rgba(255,193,7,0.1)', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1,
    borderColor: 'rgba(255,193,7,0.2)',
  },
  shareBtnText: { color: '#FFC107', fontSize: 12, fontWeight: 'bold' },
  mapCard: { margin: 16, marginBottom: 8 },
  mapPreview: {
    height: 220, backgroundColor: '#0E0E1C', borderRadius: 20,
    overflow: 'hidden', borderWidth: 1.5,
    borderColor: 'rgba(79,110,247,0.3)',
  },
  mapBg: {
    flex: 1, backgroundColor: '#0A0A1A',
    alignItems: 'center', justifyContent: 'center',
  },
  gridH1: {
    position: 'absolute', left: 0, right: 0, top: '33%',
    height: 1, backgroundColor: 'rgba(79,110,247,0.06)',
  },
  gridH2: {
    position: 'absolute', left: 0, right: 0, top: '66%',
    height: 1, backgroundColor: 'rgba(79,110,247,0.06)',
  },
  gridV1: {
    position: 'absolute', top: 0, bottom: 0, left: '33%',
    width: 1, backgroundColor: 'rgba(79,110,247,0.06)',
  },
  gridV2: {
    position: 'absolute', top: 0, bottom: 0, left: '66%',
    width: 1, backgroundColor: 'rgba(79,110,247,0.06)',
  },
  mapCenter: { alignItems: 'center', gap: 6, zIndex: 1 },
  mapEmoji: { fontSize: 40, marginBottom: 4 },
  mapLabel: {
    fontSize: 15, fontWeight: 'bold', color: '#fff', textAlign: 'center',
  },
  mapAddr: {
    fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center',
  },
  plusCodeBadge: {
    backgroundColor: 'rgba(79,110,247,0.2)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1,
    borderColor: 'rgba(79,110,247,0.4)', marginTop: 4,
  },
  plusCodeText: { color: '#4F6EF7', fontSize: 12, fontWeight: 'bold' },
  tapHint: { fontSize: 11, color: 'rgba(79,110,247,0.5)', marginTop: 4 },
  pin: { position: 'absolute', bottom: 20, alignItems: 'center' },
  pinHead: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#FF4757', borderWidth: 2, borderColor: '#fff',
  },
  pinTail: {
    width: 2, height: 8, backgroundColor: '#FF4757',
    marginTop: -1,
  },
  statusBadge: {
    position: 'absolute', top: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  statusOpen: { backgroundColor: 'rgba(74,222,128,0.15)', borderWidth: 1, borderColor: 'rgba(74,222,128,0.3)' },
  statusClosed: { backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  actionRow: {
    flexDirection: 'row', paddingHorizontal: 16,
    gap: 8, marginBottom: 12,
  },
  contactRow: {
    flexDirection: 'row', paddingHorizontal: 16,
    gap: 10, marginBottom: 12,
  },
  callBigBtn: {
    flex: 1, backgroundColor: '#0E0E1C', borderRadius: 16,
    padding: 14, flexDirection: 'row', alignItems: 'center',
    gap: 10, borderWidth: 1, borderColor: 'rgba(255,193,7,0.25)',
  },
  callBigIcon: { fontSize: 28 },
  callBigLabel: {
    fontSize: 10, color: '#FFC107', textTransform: 'uppercase',
    letterSpacing: 1, marginBottom: 2,
  },
  callBigNum: { fontSize: 13, fontWeight: 'bold', color: '#fff' },
  card: {
    marginHorizontal: 16, backgroundColor: '#0E0E1C',
    borderRadius: 20, padding: 18, marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(79,110,247,0.15)',
  },
  cardTitle: {
    fontSize: 15, fontWeight: 'bold', color: '#fff', marginBottom: 14,
  },
  cardTitleRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  liveNow: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(74,222,128,0.1)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.2)',
  },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  liveText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  timingRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1,
    borderBottomColor: 'rgba(79,110,247,0.08)', paddingHorizontal: 4,
  },
  timingRowToday: {
    backgroundColor: 'rgba(79,110,247,0.05)', borderRadius: 10,
    paddingHorizontal: 10, marginHorizontal: -6,
  },
  timingDay: { fontSize: 14, color: 'rgba(255,255,255,0.5)' },
  todayTag: { fontSize: 10, color: '#4F6EF7', marginTop: 2 },
  timingTime: { fontSize: 14, fontWeight: '600', color: '#fff' },
  todayStatus: {
    borderRadius: 12, padding: 12,
    alignItems: 'center', marginTop: 12,
  },
  todayOpen: { backgroundColor: 'rgba(74,222,128,0.08)', borderWidth: 1, borderColor: 'rgba(74,222,128,0.2)' },
  todayClosed: { backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
  todayStatusText: { fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
  landmarkRow: {
    paddingVertical: 10, borderBottomWidth: 1,
    borderBottomColor: 'rgba(79,110,247,0.08)',
  },
  landmark: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  directionsBtn: {
    backgroundColor: 'rgba(74,222,128,0.1)', borderRadius: 14,
    padding: 14, alignItems: 'center', marginTop: 14,
    borderWidth: 1, borderColor: 'rgba(74,222,128,0.25)',
  },
  directionsBtnText: { color: '#4ADE80', fontWeight: 'bold', fontSize: 14 },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  featureChip: {
    backgroundColor: 'rgba(79,110,247,0.08)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1,
    borderColor: 'rgba(79,110,247,0.15)',
  },
  featureText: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  shareSubtext: {
    fontSize: 12, color: 'rgba(255,255,255,0.4)',
    marginBottom: 14,
  },
  shareBtnsRow: { flexDirection: 'row', gap: 10 },
  waShareBtn: {
    flex: 2, backgroundColor: '#25D366', borderRadius: 14,
    padding: 14, alignItems: 'center',
  },
  waShareBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  mapsShareBtn: {
    flex: 1, backgroundColor: 'rgba(79,110,247,0.1)', borderRadius: 14,
    padding: 14, alignItems: 'center', borderWidth: 1,
    borderColor: 'rgba(79,110,247,0.3)',
  },
  mapsShareBtnText: { color: '#4F6EF7', fontWeight: 'bold', fontSize: 14 },
});