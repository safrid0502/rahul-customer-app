import { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  SafeAreaView, StatusBar, FlatList,
  ActivityIndicator
} from 'react-native';
import * as Haptics from 'expo-haptics';

const API_URL = 'https://rahul-auto-spares-backend.onrender.com';

const FALLBACK_BRANDS = [
  { id: 1, name: 'Hero', icon: '🏍️', sku_prefix: 'HRO' },
  { id: 2, name: 'Honda', icon: '🏍️', sku_prefix: 'HND' },
  { id: 3, name: 'TVS', icon: '🛵', sku_prefix: 'TVS' },
  { id: 4, name: 'Bajaj', icon: '🏍️', sku_prefix: 'BAJ' },
  { id: 5, name: 'Yamaha', icon: '🏍️', sku_prefix: 'YAM' },
  { id: 6, name: 'Suzuki', icon: '🏍️', sku_prefix: 'SUZ' },
];

const HERO_MODELS = [
  'Splendor+', 'Splendor Pro', 'HF Deluxe',
  'Passion Pro', 'Glamour', 'Super Splendor',
  'Xtreme 160R', 'Xpulse 200'
];

export default function VehicleSelectScreen({ onSelect, onSkip }) {
  const [step, setStep] = useState('brand');
  const [selectedBrand, setSelectedBrand] = useState(null);

  const selectBrand = async (brand) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedBrand(brand);
    setStep('model');
  };

  const selectModel = async (model) => {
    await Haptics.impactAsync(
      Haptics.NotificationFeedbackType.Success
    );
    onSelect({
      brand: selectedBrand.name,
      model,
      brandIcon: selectedBrand.icon,
      sku: selectedBrand.sku_prefix
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content"
        backgroundColor="#06060E" />

      {/* HEADER */}
      <View style={styles.header}>
        {step === 'model' && (
          <TouchableOpacity
            style={styles.backChip}
            onPress={() => setStep('brand')}
          >
            <Text style={styles.backChipText}>←</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>
            {step === 'brand'
              ? '🏍️ Select Your Bike'
              : `${selectedBrand?.icon} ${selectedBrand?.name}`}
          </Text>
          <Text style={styles.headerSub}>
            {step === 'brand'
              ? 'Get parts matched to your bike'
              : 'Choose your model'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={onSkip}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* BRAND STEP */}
      {step === 'brand' && (
        <FlatList
          data={FALLBACK_BRANDS}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.brandCard}
              onPress={() => selectBrand(item)}
            >
              <Text style={styles.brandIcon}>{item.icon}</Text>
              <Text style={styles.brandName}>{item.name}</Text>
              <Text style={styles.brandArrow}>→</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* MODEL STEP */}
      {step === 'model' && (
        <FlatList
          data={HERO_MODELS}
          keyExtractor={item => item}
          contentContainerStyle={styles.modelList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.modelCard}
              onPress={() => selectModel(item)}
            >
              <Text style={styles.modelIcon}>
                {selectedBrand?.icon}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.modelName}>
                  {selectedBrand?.name} {item}
                </Text>
              </View>
              <Text style={styles.modelArrow}>→</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06060E' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, paddingTop: 8, gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(79,110,247,0.15)',
  },
  backChip: {
    backgroundColor: 'rgba(79,110,247,0.1)', borderRadius: 10,
    width: 36, height: 36, alignItems: 'center',
    justifyContent: 'center', borderWidth: 1,
    borderColor: 'rgba(79,110,247,0.2)',
  },
  backChipText: {
    color: '#4F6EF7', fontSize: 18, fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18, fontWeight: 'bold', color: '#ffffff',
  },
  headerSub: {
    fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 2,
  },
  skipBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  skipText: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  grid: { padding: 16, gap: 12 },
  row: { gap: 12 },
  brandCard: {
    flex: 1, backgroundColor: '#0E0E1C', borderRadius: 20,
    padding: 20, alignItems: 'center', gap: 8, borderWidth: 1,
    borderColor: 'rgba(79,110,247,0.15)',
  },
  brandIcon: { fontSize: 40 },
  brandName: {
    fontSize: 15, fontWeight: 'bold', color: '#ffffff',
  },
  brandArrow: { fontSize: 14, color: '#4F6EF7' },
  modelList: { padding: 16, gap: 10 },
  modelCard: {
    backgroundColor: '#0E0E1C', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: 'rgba(79,110,247,0.15)',
  },
  modelIcon: { fontSize: 28 },
  modelName: {
    fontSize: 15, fontWeight: '600', color: '#ffffff',
  },
  modelArrow: {
    fontSize: 16, color: '#4F6EF7', fontWeight: 'bold',
  },
});