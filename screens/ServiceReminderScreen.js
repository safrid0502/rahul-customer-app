import { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  SafeAreaView, StatusBar, ScrollView,
  TextInput, Alert, Animated, Switch
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const REMINDER_KEY = 'service_reminders_v2';

const SERVICE_TYPES = [
  {
    id: 'oil', icon: '🛢️', label: 'Engine Oil Change',
    labelTe: 'ఇంజన్ ఆయిల్ మార్పు',
    defaultKm: 2500, color: '#FF6B35',
    tip: 'Change every 2000-3000 km'
  },
  {
    id: 'filter', icon: '🔧', label: 'Air Filter Clean',
    labelTe: 'ఎయిర్ ఫిల్టర్ శుభ్రం',
    defaultKm: 6000, color: '#4F6EF7',
    tip: 'Clean every 6000 km or 6 months'
  },
  {
    id: 'chain', icon: '🔗', label: 'Chain Lubrication',
    labelTe: 'చైన్ లూబ్రికేషన్',
    defaultKm: 600, color: '#FFC107',
    tip: 'Lubricate every 500-700 km'
  },
  {
    id: 'spark', icon: '⚡', label: 'Spark Plug Check',
    labelTe: 'స్పార్క్ ప్లగ్ చెక్',
    defaultKm: 8000, color: '#A78BFA',
    tip: 'Check every 8000 km'
  },
  {
    id: 'tyres', icon: '🏍️', label: 'Tyre Pressure Check',
    labelTe: 'టైర్ ప్రెషర్ చెక్',
    defaultKm: 500, color: '#4ADE80',
    tip: 'Check every month or 500 km'
  },
  {
    id: 'brakes', icon: '🛑', label: 'Brake Shoe Check',
    labelTe: 'బ్రేక్ షూ చెక్',
    defaultKm: 10000, color: '#EF4444',
    tip: 'Check every 10000 km'
  },
];

function ReminderCard({ service, reminder, onUpdate, onDelete }) {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1, tension: 50, friction: 7, useNativeDriver: true
      }),
      Animated.timing(opacityAnim, {
        toValue: 1, duration: 300, useNativeDriver: true
      }),
    ]).start();
  }, []);

  const isDue = reminder.currentKm >= reminder.targetKm;
  const progress = Math.min(
    (reminder.currentKm / reminder.targetKm) * 100, 100
  );
  const kmLeft = Math.max(0, reminder.targetKm - reminder.currentKm);

  return (
    <Animated.View style={[styles.reminderCard,
      {
        transform: [{ scale: scaleAnim }],
        opacity: opacityAnim,
        borderColor: isDue
          ? service.color + '80'
          : service.color + '30'
      }
    ]}>
      {isDue && (
        <View style={[styles.dueBanner,
          { backgroundColor: service.color + '20' }]}>
          <Text style={[styles.dueText,
            { color: service.color }]}>
            ⚠️ Service Due Now! · ఇప్పుడు సర్వీస్ అవసరం!
          </Text>
        </View>
      )}

      <View style={styles.cardHeader}>
        <View style={[styles.serviceIconBox,
          { backgroundColor: service.color + '20' }]}>
          <Text style={styles.serviceIcon}>{service.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.serviceName}>{service.label}</Text>
          <Text style={styles.serviceNameTe}>{service.labelTe}</Text>
          <Text style={styles.serviceTip}>{service.tip}</Text>
        </View>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => onDelete(service.id)}
        >
          <Text style={styles.deleteBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* PROGRESS BAR */}
      <View style={styles.progressSection}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>
            {reminder.currentKm.toLocaleString()} km
          </Text>
          <Text style={[styles.progressLabel,
            { color: service.color }]}>
            {reminder.targetKm.toLocaleString()} km
          </Text>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill,
            {
              width: `${progress}%`,
              backgroundColor: isDue ? '#EF4444' : service.color
            }]} />
        </View>
        <Text style={[styles.kmLeft,
          { color: isDue ? '#EF4444' : service.color }]}>
          {isDue
            ? '🚨 Overdue! Get service now!'
            : `${kmLeft.toLocaleString()} km left`}
        </Text>
      </View>

      {/* UPDATE KM */}
      <TouchableOpacity
        style={[styles.updateKmBtn,
          { borderColor: service.color + '40' }]}
        onPress={() => onUpdate(service.id, reminder)}
      >
        <Text style={[styles.updateKmBtnText,
          { color: service.color }]}>
          📍 Update Current KM
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ServiceReminderScreen({ onBack, vehicle }) {
  const [reminders, setReminders] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [currentKm, setCurrentKm] = useState('');
  const [targetKm, setTargetKm] = useState('');

  useEffect(() => { loadReminders(); }, []);

  const loadReminders = async () => {
    try {
      const saved = await AsyncStorage.getItem(REMINDER_KEY);
      if (saved) setReminders(JSON.parse(saved));
    } catch {}
  };

  const saveReminders = async (data) => {
    await AsyncStorage.setItem(REMINDER_KEY, JSON.stringify(data));
    setReminders(data);
  };

  const addReminder = async () => {
    if (!selectedService) {
      Alert.alert('❌', 'Select a service type'); return;
    }
    if (!currentKm || !targetKm) {
      Alert.alert('❌', 'Enter current and target KM'); return;
    }
    const curr = parseInt(currentKm);
    const target = parseInt(targetKm);
    if (isNaN(curr) || isNaN(target)) {
      Alert.alert('❌', 'Enter valid numbers'); return;
    }
    if (target <= curr) {
      Alert.alert('❌', 'Target KM must be higher than current KM');
      return;
    }

    await Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success
    );
    const updated = {
      ...reminders,
      [selectedService.id]: {
        serviceId: selectedService.id,
        currentKm: curr,
        targetKm: target,
        createdAt: new Date().toISOString()
      }
    };
    await saveReminders(updated);
    setShowAddForm(false);
    setSelectedService(null);
    setCurrentKm('');
    setTargetKm('');
  };

  const updateKm = (serviceId, reminder) => {
    Alert.prompt
      ? Alert.prompt(
          '📍 Update Current KM',
          `Enter your bike's current odometer reading:`,
          async (newKm) => {
            const km = parseInt(newKm);
            if (isNaN(km)) return;
            const updated = {
              ...reminders,
              [serviceId]: { ...reminder, currentKm: km }
            };
            await saveReminders(updated);
            await Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success
            );
          },
          'plain-text',
          reminder.currentKm.toString(),
          'numeric'
        )
      : Alert.alert(
          '📍 Update KM',
          'Use the form below to update',
          [{ text: 'OK' }]
        );
  };

  const deleteReminder = async (serviceId) => {
    Alert.alert('Delete Reminder?', 'Remove this service reminder?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const updated = { ...reminders };
          delete updated[serviceId];
          await saveReminders(updated);
        }
      }
    ]);
  };

  const markServiced = async (serviceId, reminder) => {
    Alert.alert(
      '✅ Mark as Serviced?',
      'Reset the reminder after service?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: '✅ Yes, Serviced!',
          onPress: async () => {
            const service = SERVICE_TYPES.find(
              s => s.id === serviceId
            );
            const updated = {
              ...reminders,
              [serviceId]: {
                ...reminder,
                currentKm: reminder.currentKm,
                targetKm: reminder.currentKm + (service?.defaultKm || 2500),
                lastServiced: new Date().toISOString()
              }
            };
            await saveReminders(updated);
            await Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success
            );
            Alert.alert('✅ Great!',
              'Reminder reset for next service!');
          }
        }
      ]
    );
  };

  const activeReminders = Object.entries(reminders);
  const dueCount = activeReminders.filter(([id, r]) =>
    r.currentKm >= r.targetKm
  ).length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#06060E" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>🔔 Service Reminders</Text>
          {vehicle && (
            <Text style={styles.headerSub}>
              🏍️ {vehicle.brand} {vehicle.model}
            </Text>
          )}
        </View>
        {dueCount > 0 && (
          <View style={styles.dueBadge}>
            <Text style={styles.dueBadgeText}>{dueCount} Due!</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>

        {/* INFO CARD */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>💡</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>
              Track your bike maintenance!
            </Text>
            <Text style={styles.infoText}>
              Set reminders for oil change, chain lube, air filter
              and more. Never miss a service!
            </Text>
          </View>
        </View>

        {/* ACTIVE REMINDERS */}
        {activeReminders.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={{ fontSize: 60, marginBottom: 16 }}>🔧</Text>
            <Text style={styles.emptyTitle}>
              No reminders set yet!
            </Text>
            <Text style={styles.emptyText}>
              Add your first service reminder below
            </Text>
          </View>
        ) : (
          activeReminders.map(([serviceId, reminder]) => {
            const service = SERVICE_TYPES.find(
              s => s.id === serviceId
            );
            if (!service) return null;
            return (
              <View key={serviceId}>
                <ReminderCard
                  service={service}
                  reminder={reminder}
                  onUpdate={updateKm}
                  onDelete={deleteReminder}
                />
                {reminder.currentKm >= reminder.targetKm && (
                  <TouchableOpacity
                    style={[styles.servicedBtn,
                      { borderColor: service.color + '40' }]}
                    onPress={() => markServiced(serviceId, reminder)}
                  >
                    <Text style={[styles.servicedBtnText,
                      { color: service.color }]}>
                      ✅ Mark as Serviced
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}

        {/* ADD REMINDER */}
        {!showAddForm ? (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowAddForm(true)}
          >
            <Text style={styles.addBtnText}>
              + Add Service Reminder
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.addForm}>
            <Text style={styles.formTitle}>
              🔧 Add New Reminder
            </Text>

            {/* SERVICE TYPE SELECT */}
            <Text style={styles.formLabel}>
              Select Service Type
            </Text>
            <ScrollView
              horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.serviceTypeRow}
            >
              {SERVICE_TYPES.filter(s =>
                !reminders[s.id]
              ).map(service => (
                <TouchableOpacity
                  key={service.id}
                  style={[styles.serviceTypeCard,
                    selectedService?.id === service.id && {
                      borderColor: service.color,
                      backgroundColor: service.color + '15'
                    }]}
                  onPress={() => {
                    setSelectedService(service);
                    setTargetKm(
                      (parseInt(currentKm || '0') +
                        service.defaultKm).toString()
                    );
                    Haptics.impactAsync(
                      Haptics.ImpactFeedbackStyle.Light
                    );
                  }}
                >
                  <Text style={styles.serviceTypeIcon}>
                    {service.icon}
                  </Text>
                  <Text style={[styles.serviceTypeLabel,
                    selectedService?.id === service.id &&
                    { color: service.color }]}>
                    {service.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* KM INPUTS */}
            <Text style={styles.formLabel}>
              Current Odometer (KM)
            </Text>
            <TextInput
              style={styles.formInput}
              value={currentKm}
              onChangeText={(v) => {
                setCurrentKm(v);
                if (selectedService && v) {
                  setTargetKm(
                    (parseInt(v) +
                      selectedService.defaultKm).toString()
                  );
                }
              }}
              placeholder="e.g. 15000"
              placeholderTextColor="rgba(255,255,255,0.25)"
              keyboardType="numeric"
            />

            <Text style={styles.formLabel}>
              Next Service At (KM)
            </Text>
            <TextInput
              style={styles.formInput}
              value={targetKm}
              onChangeText={setTargetKm}
              placeholder="e.g. 17500"
              placeholderTextColor="rgba(255,255,255,0.25)"
              keyboardType="numeric"
            />

            {selectedService && (
              <View style={styles.tipBox}>
                <Text style={styles.tipText}>
                  💡 {selectedService.tip}
                </Text>
              </View>
            )}

            <View style={styles.formBtns}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setShowAddForm(false);
                  setSelectedService(null);
                  setCurrentKm('');
                  setTargetKm('');
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn,
                  (!selectedService || !currentKm || !targetKm)
                    && { opacity: 0.4 }]}
                onPress={addReminder}
                disabled={!selectedService || !currentKm || !targetKm}
              >
                <Text style={styles.saveBtnText}>
                  🔔 Set Reminder
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06060E' },
  header: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    paddingTop: 8, gap: 12, borderBottomWidth: 1,
    borderBottomColor: 'rgba(79,110,247,0.15)',
  },
  backBtn: {
    backgroundColor: 'rgba(79,110,247,0.1)', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1,
    borderColor: 'rgba(79,110,247,0.2)',
  },
  backBtnText: { color: '#4F6EF7', fontSize: 14, fontWeight: 'bold' },
  headerTitle: { fontSize: 17, fontWeight: 'bold', color: '#fff' },
  headerSub: {
    fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2,
  },
  dueBadge: {
    backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  dueBadgeText: {
    color: '#EF4444', fontSize: 12, fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: 'rgba(79,110,247,0.08)', borderRadius: 16,
    padding: 14, flexDirection: 'row', gap: 12, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(79,110,247,0.2)',
  },
  infoIcon: { fontSize: 28 },
  infoTitle: {
    fontSize: 14, fontWeight: 'bold', color: '#fff', marginBottom: 4,
  },
  infoText: { fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 18 },
  emptyBox: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: {
    fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 6,
  },
  emptyText: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  reminderCard: {
    backgroundColor: '#0E0E1C', borderRadius: 18, padding: 16,
    marginBottom: 12, borderWidth: 1.5, overflow: 'hidden',
  },
  dueBanner: {
    borderRadius: 8, padding: 8, marginBottom: 12, alignItems: 'center',
  },
  dueText: { fontSize: 13, fontWeight: 'bold' },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14,
  },
  serviceIconBox: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  serviceIcon: { fontSize: 26 },
  serviceName: { fontSize: 15, fontWeight: 'bold', color: '#fff', marginBottom: 2 },
  serviceNameTe: { fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 2 },
  serviceTip: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  deleteBtn: {
    backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 8,
    width: 32, height: 32, alignItems: 'center', justifyContent: 'center',
  },
  deleteBtnText: { color: '#EF4444', fontSize: 14 },
  progressSection: { marginBottom: 12 },
  progressRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8,
  },
  progressLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  progressBg: {
    height: 8, backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4, overflow: 'hidden', marginBottom: 6,
  },
  progressFill: { height: '100%', borderRadius: 4 },
  kmLeft: { fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
  updateKmBtn: {
    borderRadius: 12, padding: 10, alignItems: 'center',
    borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.03)',
  },
  updateKmBtnText: { fontSize: 13, fontWeight: 'bold' },
  servicedBtn: {
    borderRadius: 14, padding: 12, alignItems: 'center',
    borderWidth: 1, marginTop: -8, marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  servicedBtnText: { fontSize: 14, fontWeight: 'bold' },
  addBtn: {
    backgroundColor: 'rgba(79,110,247,0.1)', borderRadius: 16,
    padding: 16, alignItems: 'center', borderWidth: 1,
    borderColor: 'rgba(79,110,247,0.3)', borderStyle: 'dashed',
    marginTop: 8,
  },
  addBtnText: { color: '#4F6EF7', fontSize: 15, fontWeight: 'bold' },
  addForm: {
    backgroundColor: '#0E0E1C', borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: 'rgba(79,110,247,0.2)', marginTop: 8,
  },
  formTitle: {
    fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 16,
  },
  formLabel: {
    fontSize: 11, color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase',
  },
  serviceTypeRow: { gap: 10, paddingBottom: 14 },
  serviceTypeCard: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12,
    padding: 12, alignItems: 'center', gap: 6, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)', minWidth: 90,
  },
  serviceTypeIcon: { fontSize: 28 },
  serviceTypeLabel: {
    fontSize: 10, color: 'rgba(255,255,255,0.5)',
    textAlign: 'center', fontWeight: 'bold',
  },
  formInput: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14,
    padding: 14, color: '#fff', fontSize: 16, borderWidth: 1,
    borderColor: 'rgba(79,110,247,0.2)', marginBottom: 14,
  },
  tipBox: {
    backgroundColor: 'rgba(255,193,7,0.08)', borderRadius: 10,
    padding: 10, marginBottom: 16, borderWidth: 1,
    borderColor: 'rgba(255,193,7,0.2)',
  },
  tipText: { fontSize: 12, color: 'rgba(255,193,7,0.7)' },
  formBtns: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14, padding: 14, alignItems: 'center',
  },
  cancelBtnText: { color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' },
  saveBtn: {
    flex: 2, backgroundColor: '#4F6EF7', borderRadius: 14,
    padding: 14, alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
});