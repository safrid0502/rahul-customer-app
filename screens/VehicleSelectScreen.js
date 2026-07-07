// ════════════════════════════════════════════════════════════════
// VehicleSelectScreen.js — New Rahul Auto Spares
// Professional dropdown-style bike selector
// ════════════════════════════════════════════════════════════════

import { useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  SafeAreaView, StatusBar, ScrollView, Animated
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

const BRANDS = [
  {
    id: 'hero', name: 'Hero MotoCorp', short: 'Hero',
    color: '#E31837', skuPrefix: 'HRO',
    models: [
      { name: 'Splendor+',      sku: 'HRO-SPL', type: 'Commuter' },
      { name: 'Splendor Pro',   sku: 'HRO-SPP', type: 'Commuter' },
      { name: 'HF Deluxe',      sku: 'HRO-HFD', type: 'Commuter' },
      { name: 'Passion Pro',    sku: 'HRO-PAS', type: 'Commuter' },
      { name: 'Glamour',        sku: 'HRO-GLA', type: 'Commuter' },
      { name: 'Xtreme 160R',    sku: 'HRO-XTR', type: 'Sports' },
      { name: 'Super Splendor', sku: 'HRO-SSP', type: 'Commuter' },
      { name: 'Maestro Edge',   sku: 'HRO-MAE', type: 'Scooter' },
      { name: 'Destini 125',    sku: 'HRO-DES', type: 'Scooter' },
    ]
  },
  {
    id: 'honda', name: 'Honda', short: 'Honda',
    color: '#CC0000', skuPrefix: 'HND',
    models: [
      { name: 'CB Shine',    sku: 'HND-CBS', type: 'Commuter' },
      { name: 'Activa 6G',   sku: 'HND-ACT', type: 'Scooter' },
      { name: 'SP 125',      sku: 'HND-SP1', type: 'Commuter' },
      { name: 'Unicorn',     sku: 'HND-UNI', type: 'Commuter' },
      { name: 'Livo',        sku: 'HND-LIV', type: 'Commuter' },
      { name: 'Hornet 2.0',  sku: 'HND-HRN', type: 'Sports' },
      { name: 'Dio',         sku: 'HND-DIO', type: 'Scooter' },
      { name: 'Dream Yuga',  sku: 'HND-DYG', type: 'Commuter' },
      { name: 'CB350',       sku: 'HND-CB3', type: 'Cruiser' },
    ]
  },
  {
    id: 'tvs', name: 'TVS Motor', short: 'TVS',
    color: '#0050A0', skuPrefix: 'TVS',
    models: [
      { name: 'Apache RTR 160', sku: 'TVS-APR', type: 'Sports' },
      { name: 'Jupiter',        sku: 'TVS-JPT', type: 'Scooter' },
      { name: 'Sport',          sku: 'TVS-SPT', type: 'Commuter' },
      { name: 'Star City+',     sku: 'TVS-STC', type: 'Commuter' },
      { name: 'Raider 125',     sku: 'TVS-RAI', type: 'Commuter' },
      { name: 'Radeon',         sku: 'TVS-RAD', type: 'Commuter' },
      { name: 'XL100',          sku: 'TVS-XL1', type: 'Moped' },
      { name: 'NTORQ 125',      sku: 'TVS-NTQ', type: 'Scooter' },
    ]
  },
  {
    id: 'bajaj', name: 'Bajaj Auto', short: 'Bajaj',
    color: '#003DA5', skuPrefix: 'BAJ',
    models: [
      { name: 'Pulsar 150',    sku: 'BAJ-P15', type: 'Sports' },
      { name: 'Pulsar NS200',  sku: 'BAJ-PNS', type: 'Sports' },
      { name: 'Platina 100',   sku: 'BAJ-PLT', type: 'Commuter' },
      { name: 'CT 100',        sku: 'BAJ-CT1', type: 'Commuter' },
      { name: 'Avenger 220',   sku: 'BAJ-AVG', type: 'Cruiser' },
    ]
  },
  {
    id: 'yamaha', name: 'Yamaha', short: 'Yamaha',
    color: '#0A2755', skuPrefix: 'YAM',
    models: [
      { name: 'FZ-S',       sku: 'YAM-FZS', type: 'Sports' },
      { name: 'MT-15',      sku: 'YAM-MT1', type: 'Sports' },
      { name: 'R15',        sku: 'YAM-R15', type: 'Sports' },
      { name: 'Fascino',    sku: 'YAM-FAS', type: 'Scooter' },
      { name: 'RayZR 125', sku: 'YAM-RAY', type: 'Scooter' },
    ]
  },
];

const TYPE_COLORS = {
  Commuter: '#4F6EF7',
  Sports:   '#EF4444',
  Scooter:  '#10B981',
  Cruiser:  '#F59E0B',
  Moped:    '#6B7280',
};

export default function VehicleSelectScreen({ onSelect, currentVehicle }) {
  const [expandedBrand, setExpandedBrand] = useState(null);
  const [selectedModel, setSelectedModel] = useState(currentVehicle || null);

  const handleBrandPress = (brand) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedBrand(expandedBrand?.id === brand.id ? null : brand);
  };

  const handleModelSelect = (brand, model) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const vehicle = {
      brand: brand.short,
      model: model.name,
      sku: model.sku,
      type: model.type,
      brandColor: brand.color,
    };
    setSelectedModel(vehicle);
    setTimeout(() => onSelect(vehicle), 300);
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#07111F" />

      {/* HEADER */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Select Your Bike</Text>
          <Text style={s.headerSub}>We'll show parts that fit your bike</Text>
        </View>
        {currentVehicle && (
          <TouchableOpacity style={s.skipBtn} onPress={() => onSelect(currentVehicle)}>
            <Text style={s.skipBtnText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* SELECTED VEHICLE BANNER */}
      {selectedModel && (
        <View style={[s.selectedBanner, { borderColor: selectedModel.brandColor + '40' }]}>
          <Ionicons name="checkmark-circle" size={20} color="#4ADE80" />
          <Text style={s.selectedBannerText}>
            {selectedModel.brand} {selectedModel.model} selected
          </Text>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>

        <Text style={s.sectionLabel}>SELECT BRAND</Text>

        {BRANDS.map((brand) => {
          const isExpanded = expandedBrand?.id === brand.id;
          return (
            <View key={brand.id} style={s.brandWrapper}>

              {/* BRAND HEADER (Dropdown trigger) */}
              <TouchableOpacity
                style={[s.brandRow, isExpanded && { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottomWidth: 0 }]}
                onPress={() => handleBrandPress(brand)}
                activeOpacity={0.8}>
                <View style={[s.brandColorBar, { backgroundColor: brand.color }]} />
                <View style={s.brandInfo}>
                  <Text style={s.brandName}>{brand.name}</Text>
                  <Text style={s.brandCount}>{brand.models.length} models available</Text>
                </View>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={isExpanded ? brand.color : 'rgba(255,255,255,0.3)'}
                />
              </TouchableOpacity>

              {/* MODELS DROPDOWN */}
              {isExpanded && (
                <View style={s.modelsDropdown}>
                  {brand.models.map((model, idx) => {
                    const isSelected = selectedModel?.sku === model.sku;
                    return (
                      <TouchableOpacity
                        key={model.sku}
                        style={[
                          s.modelRow,
                          isSelected && s.modelRowSelected,
                          idx === brand.models.length - 1 && s.modelRowLast,
                        ]}
                        onPress={() => handleModelSelect(brand, model)}
                        activeOpacity={0.7}>

                        {/* Model name */}
                        <View style={s.modelLeft}>
                          <View style={[s.modelDot, { backgroundColor: isSelected ? brand.color : 'rgba(255,255,255,0.1)' }]} />
                          <View>
                            <Text style={[s.modelName, isSelected && { color: '#fff', fontWeight: '700' }]}>
                              {model.name}
                            </Text>
                            <View style={s.modelTypeBadge}>
                              <Text style={[s.modelType, { color: TYPE_COLORS[model.type] || '#4F6EF7' }]}>
                                {model.type}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Selected checkmark */}
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={20} color={brand.color} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}

        {/* SKIP WITHOUT SELECTING */}
        {!currentVehicle && (
          <TouchableOpacity style={s.skipLink} onPress={() => onSelect(null)}>
            <Text style={s.skipLinkText}>Skip for now — Browse all parts</Text>
            <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07111F' },

  // Header
  header: {
    padding: 20, paddingBottom: 16,
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201,168,76,0.15)',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  skipBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  skipBtnText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '600' },

  // Selected banner
  selectedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(74,222,128,0.08)',
    marginHorizontal: 16, marginTop: 12,
    borderRadius: 10, padding: 12, borderWidth: 1,
  },
  selectedBannerText: { fontSize: 13, color: '#4ADE80', fontWeight: '600' },

  // Section label
  sectionLabel: {
    fontSize: 11, color: 'rgba(201,168,76,0.7)',
    letterSpacing: 2.5, fontWeight: '700',
    marginBottom: 14, marginTop: 4,
  },

  // Brand wrapper
  brandWrapper: { marginBottom: 10 },

  // Brand row (dropdown trigger)
  brandRow: {
    backgroundColor: '#0D1F3C', borderRadius: 14,
    flexDirection: 'row', alignItems: 'center',
    overflow: 'hidden', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  brandColorBar: { width: 4, alignSelf: 'stretch' },
  brandInfo: { flex: 1, padding: 16 },
  brandName: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 2 },
  brandCount: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },

  // Models dropdown
  modelsDropdown: {
    backgroundColor: '#0A1828', borderWidth: 1,
    borderTopWidth: 0, borderColor: 'rgba(255,255,255,0.07)',
    borderBottomLeftRadius: 14, borderBottomRightRadius: 14,
    overflow: 'hidden',
  },
  modelRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: 14,
    paddingLeft: 20, borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  modelRowSelected: { backgroundColor: 'rgba(201,168,76,0.06)' },
  modelRowLast: { borderBottomWidth: 0 },
  modelLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  modelDot: { width: 8, height: 8, borderRadius: 4 },
  modelName: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginBottom: 2 },
  modelTypeBadge: {},
  modelType: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  // Skip link
  skipLink: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 20, padding: 14,
  },
  skipLinkText: { fontSize: 13, color: 'rgba(255,255,255,0.3)' },
});
