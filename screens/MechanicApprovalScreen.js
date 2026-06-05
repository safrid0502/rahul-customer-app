import { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  SafeAreaView, StatusBar, Alert, ActivityIndicator
} from 'react-native';
import * as Haptics from 'expo-haptics';

const API_URL = 'https://rahul-auto-spares-backend.onrender.com';

export default function MechanicApprovalScreen({
  mechanic, status, onApproved, onLogout, onReApply
}) {
  const [checking, setChecking] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(
    status || 'pending'
  );

  const checkStatus = async () => {
    setChecking(true);
    try {
      const r = await fetch(
        `${API_URL}/mechanics/check/${mechanic?.phone}`
      );
      const d = await r.json();
      setCurrentStatus(d.status);
      if (d.status === 'approved') {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
        onApproved({ ...mechanic, ...d });
      }
    } catch {}
    setChecking(false);
  };

  const isPending = currentStatus === 'pending';
  const isRejected = currentStatus === 'rejected';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content"
        backgroundColor="#06060E" />

      <View style={styles.body}>

        {/* STATUS ICON */}
        <View style={[styles.iconRing,
          {
            borderColor: isPending
              ? 'rgba(255,193,7,0.4)'
              : 'rgba(255,71,87,0.4)',
            backgroundColor: isPending
              ? 'rgba(255,193,7,0.08)'
              : 'rgba(255,71,87,0.08)'
          }]}>
          <Text style={styles.statusIcon}>
            {isPending ? '⏳' : '❌'}
          </Text>
        </View>

        {/* STATUS TEXT */}
        <Text style={styles.statusTitle}>
          {isPending
            ? 'Approval Pending'
            : 'Registration Rejected'}
        </Text>
        <Text style={styles.statusTe}>
          {isPending
            ? 'అనుమతి కోసం వేచి ఉంది'
            : 'తిరస్కరించబడింది'}
        </Text>

        {/* MECHANIC DETAILS */}
        <View style={styles.detailCard}>
          <Text style={styles.detailName}>{mechanic?.name}</Text>
          <Text style={styles.detailPhone}>
            📱 +91 {mechanic?.phone}
          </Text>
          {mechanic?.shop_name && (
            <Text style={styles.detailShop}>
              🏪 {mechanic?.shop_name}
            </Text>
          )}
          {mechanic?.area && (
            <Text style={styles.detailArea}>
              📍 {mechanic?.area}
            </Text>
          )}
        </View>

        {/* STATUS MESSAGE */}
        {isPending && (
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>
              ✅ Your request has been sent to the store
            </Text>
            <Text style={styles.messageText}>
              ⏳ Owner will approve within 24 hours
            </Text>
            <Text style={styles.messageText}>
              📱 You'll be notified when approved!
            </Text>
          </View>
        )}

        {isRejected && (
          <View style={[styles.messageBox,
            { borderColor: 'rgba(255,71,87,0.2)',
              backgroundColor: 'rgba(255,71,87,0.05)' }]}>
            <Text style={[styles.messageText,
              { color: '#FF4757' }]}>
              ❌ Your application was not approved
            </Text>
            <Text style={styles.messageText}>
              You can re-apply with correct details
            </Text>
          </View>
        )}

        {/* ACTIONS */}
        {isPending && (
          <TouchableOpacity
            style={styles.checkBtn}
            onPress={checkStatus}
            disabled={checking}
          >
            {checking
              ? <ActivityIndicator color="#06060E" />
              : <Text style={styles.checkBtnText}>
                  🔄 Check Status
                </Text>
            }
          </TouchableOpacity>
        )}

        {isRejected && (
          <TouchableOpacity
            style={[styles.checkBtn,
              { backgroundColor: '#FFC107' }]}
            onPress={onReApply}
          >
            <Text style={[styles.checkBtnText,
              { color: '#06060E' }]}>
              📝 Re-Apply
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => Alert.alert(
            'Logout?', 'Remove saved profile?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Logout', style: 'destructive',
                onPress: onLogout }
            ]
          )}
        >
          <Text style={styles.logoutText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06060E' },
  body: {
    flex: 1, alignItems: 'center',
    justifyContent: 'center', padding: 24,
  },
  iconRing: {
    width: 110, height: 110, borderRadius: 55,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, marginBottom: 20,
  },
  statusIcon: { fontSize: 56 },
  statusTitle: {
    fontSize: 24, fontWeight: 'bold',
    color: '#ffffff', marginBottom: 4,
  },
  statusTe: {
    fontSize: 14, color: 'rgba(255,255,255,0.3)',
    marginBottom: 24,
  },
  detailCard: {
    backgroundColor: '#0E0E1C', borderRadius: 16,
    padding: 16, width: '100%', gap: 6, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(79,110,247,0.15)',
  },
  detailName: {
    fontSize: 16, fontWeight: 'bold', color: '#ffffff',
  },
  detailPhone: {
    fontSize: 13, color: 'rgba(255,255,255,0.5)',
  },
  detailShop: {
    fontSize: 13, color: 'rgba(255,255,255,0.5)',
  },
  detailArea: {
    fontSize: 13, color: 'rgba(255,255,255,0.5)',
  },
  messageBox: {
    backgroundColor: 'rgba(255,193,7,0.06)', borderRadius: 16,
    padding: 16, width: '100%', gap: 8, marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(255,193,7,0.2)',
  },
  messageText: {
    fontSize: 13, color: 'rgba(255,255,255,0.5)',
  },
  checkBtn: {
    backgroundColor: '#FFC107', borderRadius: 20,
    padding: 16, width: '100%', alignItems: 'center',
    marginBottom: 12,
  },
  checkBtnText: {
    color: '#06060E', fontSize: 16, fontWeight: 'bold',
  },
  logoutBtn: {
    padding: 12,
  },
  logoutText: {
    color: 'rgba(255,255,255,0.3)', fontSize: 14,
  },
});