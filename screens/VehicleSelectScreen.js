import { useState, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  SafeAreaView, StatusBar, ScrollView,
  Animated, Image
} from 'react-native';
import * as Haptics from 'expo-haptics';

const BRANDS = [
  {
    id: 'hero', name: 'Hero', emoji: '🏍️',
    color: '#E31837', skuPrefix: 'HRO',
    models: [
      { name: 'Splendor+',    sku: 'HRO-SPL', icon: '🏍️' },
      { name: 'Splendor Pro', sku: 'HRO-SPP', icon: '🏍️' },
      { name: 'HF Deluxe',   sku: 'HRO-HFD', icon: '🏍️' },
      { name: 'Passion Pro',  sku: 'HRO-PAS', icon: '🏍️' },
      { name: 'Glamour',      sku: 'HRO-GLA', icon: '🏍️' },
      { name: 'Xtreme 160R', sku: 'HRO-XTR', icon: '🏍️' },
      { name: 'Super Splendor', sku: 'HRO-SSP', icon: '🏍️' },
      { name: 'Maestro Edge', sku: 'HRO-MAE', icon: '🛵' },
      { name: 'Destini 125', sku: 'HRO-DES', icon: '🛵' },
    ]
  },
  {
    id: 'honda', name: 'Honda', emoji: '🏍️',
    color: '#CC0000', skuPrefix: 'HND',
    models: [
      { name: 'CB Shine',    sku: 'HND-CBS', icon: '🏍️' },
      { name: 'Activa 6G',   sku: 'HND-ACT', icon: '🛵' },
      { name: 'SP 125',      sku: 'HND-SP1', icon: '🏍️' },
      { name: 'Unicorn',     sku: 'HND-UNI', icon: '🏍️' },
      { name: 'Livo',        sku: 'HND-LIV', icon: '🏍️' },
      { name: 'Hornet 2.0',  sku: 'HND-HRN', icon: '🏍️' },
      { name: 'Dio',         sku: 'HND-DIO', icon: '🛵' },
      { name: 'CB350',       sku: 'HND-CB3', icon: '🏍️' },
    ]
  },
  {
    id: 'tvs', name: 'TVS', emoji: '🛵',
    color: '#0050A0', skuPrefix: 'TVS',
    models: [
      { name: 'Apache RTR 160', sku: 'TVS-APR', icon: '🏍️' },
      { name: 'Jupiter',        sku: 'TVS-JPT', icon: '🛵' },
      { name: 'Sport',          sku: 'TVS-SPT', icon: '🏍️' },
      { name: 'Star City+',     sku: 'TVS-STC', icon: '🏍️' },
      { name: 'Raider 125',     sku: 'TVS-RAI', icon: '🏍️' },
      { name: 'Radeon',         sku: 'TVS-RAD', icon: '🏍️' },
      { name: 'XL100',          sku: 'TVS-XL1', icon: '🛵' },
      { name: 'NTORQ 125',      sku: 'TVS-NTQ', icon: '🛵' },
    ]
  },
  {
    id: 'bajaj', name: 'Bajaj', emoji: '🏍️',
    color: '#003DA5', skuPrefix: 'BAJ',
    models: [
      { name: 'Pulsar 150',   sku: 'BAJ-P15', icon: '🏍️' },
      { name: 'Pulsar NS200', sku: 'BAJ-PNS', icon: '🏍️' },
      { name: 'Platina 100',  sku: 'BAJ-PLT', icon: '🏍️' },
      { name: 'CT 100',       sku: 'BAJ-CT1', icon: '🏍️' },
      { name: 'Discover 125', sku: 'BAJ-DIS', icon: '🏍️' },
      { name: 'Avenger 220',  sku: 'BAJ-AVG', icon: '🏍️' },
      { name: 'Dominar 400',  sku: 'BAJ-DOM', icon: '🏍️' },
      { name: 'Chetak',       sku: 'BAJ-CHT', icon: '🛵' },
    ]
  },
  {
    id: 'yamaha', name: 'Yamaha', emoji: '🏍️',
    color: '#0047AB', skuPrefix: 'YAM',
    models: [
      { name: 'FZ-S V3',    sku: 'YAM-FZS', icon: '🏍️' },
      { name: 'MT-15',      sku: 'YAM-MT1', icon: '🏍️' },
      { name: 'R15 V4',     sku: 'YAM-R15', icon: '🏍️' },
      { name: 'Fascino 125',sku: 'YAM-FAS', icon: '🛵' },
      { name: 'Ray-ZR',     sku: 'YAM-RAY', icon: '🛵' },
      { name: 'Saluto 125', sku: 'YAM-SAL', icon: '🏍️' },
      { name: 'Fazer 25',   sku: 'YAM-FAZ', icon: '🏍️' },
      { name: 'SZ-RR',      sku: 'YAM-SZR', icon: '🏍️' },
    ]
  },
  {
    id: 'suzuki', name: 'Suzuki', emoji: '🏍️',
    color: '#E8000D', skuPrefix: 'SUZ',
    models: [
      { name: 'Access 125',   sku: 'SUZ-ACC', icon: '🛵' },
      { name: 'Gixxer SF',    sku: 'SUZ-GIX', icon: '🏍️' },
      { name: 'Intruder 150', sku: 'SUZ-INT', icon: '🏍️' },
      { name: 'Burgman',      sku: 'SUZ-BRG', icon: '🛵' },
      { name: 'Hayate',       sku: 'SUZ-HAY', icon: '🏍️' },
      { name: 'Let\'s',       sku: 'SUZ-LET', icon: '🛵' },
    ]
  },
];

export default function VehicleSelectScreen({
  onSelect, onSkip, currentVehicle
}) {
  const [selectedBrand, setSelectedBrand] = useState(
    currentVehicle
      ? BRANDS.find(b => b.name === currentVehicle.brand) || null
      : null
  );
  const [selectedModel, setSelectedModel] = useState(
    currentVehicle || null
  );

  const slideAnim = useRef(new Animated.Value(0)).current;

  const selectBrand = (brand) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedBrand(brand);
    setSelectedModel(null);
    Animated.spring(slideAnim, {
      toValue: 1, tension: 60, friction: 8, useNativeDriver: true
    }).start();
  };

  const selectModel = (model, brand) => {
    Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success
    );
    setSelectedModel(model);
    onSelect({
      brand: brand.name,
      model: model.name,
      sku: model.sku,
      icon: model.icon,
    });
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content"
        backgroundColor="#06060E" />

      {/* HEADER */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>
            🏍️ Select Your Bike
          </Text>
          <Text style={s.headerSub}>
            Get parts made for your model!
            మీ బైక్ ఎంచుకోండి!
          </Text>
        </View>
        <TouchableOpacity style={s.skipBtn} onPress={onSkip}>
          <Text style={s.skipText}>Skip →</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* BRAND SELECT */}
        <Text style={s.sectionLabel}>
          Select Brand / బ్రాండ్ ఎంచుకోండి
        </Text>
        <View style={s.brandGrid}>
          {BRANDS.map(brand => (
            <TouchableOpacity
              key={brand.id}
              style={[s.brandCard,
                selectedBrand?.id === brand.id && {
                  borderColor: brand.color,
                  backgroundColor: brand.color + '15'
                }]}
              onPress={() => selectBrand(brand)}
              activeOpacity={0.8}
            >
              <Text style={s.brandEmoji}>{brand.emoji}</Text>
              <Text style={[s.brandName,
                selectedBrand?.id === brand.id && {
                  color: brand.color
                }]}>
                {brand.name}
              </Text>
              {selectedBrand?.id === brand.id && (
                <View style={[s.selectedDot,
                  { backgroundColor: brand.color }]} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* MODEL SELECT */}
        {selectedBrand && (
          <Animated.View style={[s.modelSection,
            { opacity: slideAnim }]}>
            <Text style={s.sectionLabel}>
              Select {selectedBrand.name} Model
            </Text>
            <View style={s.modelGrid}>
              {selectedBrand.models.map((model, i) => (
                <TouchableOpacity
                  key={i}
                  style={[s.modelCard,
                    selectedModel?.sku === model.sku && {
                      borderColor: selectedBrand.color,
                      backgroundColor: selectedBrand.color + '15'
                    }]}
                  onPress={() =>
                    selectModel(model, selectedBrand)}
                  activeOpacity={0.8}
                >
                  <Text style={s.modelIcon}>{model.icon}</Text>
                  <Text style={[s.modelName,
                    selectedModel?.sku === model.sku && {
                      color: selectedBrand.color
                    }]}>
                    {selectedBrand.name}
                    {'\n'}{model.name}
                  </Text>
                  {selectedModel?.sku === model.sku && (
                    <View style={s.checkBadge}>
                      <Text style={s.checkBadgeText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {/* CURRENT VEHICLE */}
        {currentVehicle && (
          <View style={s.currentVehicleBox}>
            <Text style={s.cvLabel}>Current Vehicle:</Text>
            <Text style={s.cvValue}>
              🏍️ {currentVehicle.brand} {currentVehicle.model}
            </Text>
            <Text style={s.cvSku}>SKU: {currentVehicle.sku}</Text>
          </View>
        )}

        {/* NO BIKE OPTION */}
        <TouchableOpacity style={s.noBikeBtn} onPress={onSkip}>
          <Text style={s.noBikeBtnText}>
            I'll select later / తర్వాత ఎంచుకుంటాను
          </Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06060E' },
  header: {
    padding: 20, paddingBottom: 10, flexDirection: 'row',
    alignItems: 'flex-start', gap: 12,
  },
  headerTitle: {
    fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4,
  },
  headerSub: {
    fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 18,
  },
  skipBtn: {
    backgroundColor: 'rgba(79,110,247,0.1)', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1,
    borderColor: 'rgba(79,110,247,0.2)',
  },
  skipText: { color: '#4F6EF7', fontSize: 13, fontWeight: 'bold' },
  sectionLabel: {
    fontSize: 12, color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1, paddingHorizontal: 16,
    marginBottom: 12, textTransform: 'uppercase',
    marginTop: 8,
  },
  brandGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 12, gap: 10, marginBottom: 20,
  },
  brandCard: {
    width: '30%', backgroundColor: '#0E0E1C', borderRadius: 16,
    padding: 14, alignItems: 'center', gap: 6, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)', position: 'relative',
  },
  brandEmoji: { fontSize: 32 },
  brandName: {
    fontSize: 13, fontWeight: 'bold',
    color: 'rgba(255,255,255,0.6)',
  },
  selectedDot: {
    position: 'absolute', top: 8, right: 8, width: 8,
    height: 8, borderRadius: 4,
  },
  modelSection: { paddingBottom: 10 },
  modelGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 12, gap: 10, marginBottom: 10,
  },
  modelCard: {
    width: '47%', backgroundColor: '#0E0E1C', borderRadius: 14,
    padding: 14, alignItems: 'center', gap: 6, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)', position: 'relative',
  },
  modelIcon: { fontSize: 28 },
  modelName: {
    fontSize: 12, fontWeight: 'bold',
    color: 'rgba(255,255,255,0.5)', textAlign: 'center',
    lineHeight: 18,
  },
  checkBadge: {
    position: 'absolute', top: -8, right: -8, width: 22,
    height: 22, borderRadius: 11, backgroundColor: '#4ADE80',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#06060E',
  },
  checkBadgeText: {
    color: '#06060E', fontSize: 11, fontWeight: 'bold',
  },
  currentVehicleBox: {
    margin: 16, backgroundColor: 'rgba(79,110,247,0.08)',
    borderRadius: 14, padding: 14, borderWidth: 1,
    borderColor: 'rgba(79,110,247,0.2)',
  },
  cvLabel: {
    fontSize: 11, color: 'rgba(255,255,255,0.4)',
    marginBottom: 4, letterSpacing: 1,
  },
  cvValue: {
    fontSize: 15, fontWeight: 'bold', color: '#fff', marginBottom: 2,
  },
  cvSku: { fontSize: 11, color: 'rgba(79,110,247,0.5)' },
  noBikeBtn: {
    margin: 16, backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14, padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  noBikeBtnText: {
    color: 'rgba(255,255,255,0.3)', fontSize: 13,
  },
});