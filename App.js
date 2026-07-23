import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'react-native';
import LoginScreen from './screens/LoginScreen';
import VehicleSelectScreen from './screens/VehicleSelectScreen';
import MainApp from './screens/MainApp';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://fb89cb16b91e14af3fc96f039ae8f1b4@o4511731723534336.ingest.us.sentry.io/4511731727728640',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

const API_URL = 'https://rahul-auto-spares-backend.onrender.com';
const API_SECRET_KEY = 'zFWqAraDGYhsNzIe76vXOm0hifitH1bxLmQ6S-8qeN8';

const originalFetch = global.fetch;
global.fetch = (url, options = {}) => {
  if (typeof url === 'string' && url.startsWith(API_URL)) {
    options.headers = { ...(options.headers || {}), 'x-api-key': API_SECRET_KEY };
  }
  return originalFetch(url, options);
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('order-ready', {
      name: 'Order Updates',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#C9A84C',
    });
  }
}

async function registerForPushNotifications(phone) {
  if (!phone) return;
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    await setupNotificationChannel();

    const tokenResponse = await Notifications.getExpoPushTokenAsync();
    const pushToken = tokenResponse.data;

    await fetch(`${API_URL}/customer-tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, token: pushToken }),
    });
  } catch (e) {
    console.log('Push notification registration failed:', e);
  }
}

export default Sentry.wrap(function App() {
  const [appReady, setAppReady] = useState(false);
  const [screen, setScreen]     = useState('login');
  const [customer, setCustomer] = useState(null);
  const [isMechanic, setIsMechanic] = useState(false);
  const [vehicle, setVehicle]   = useState(null);
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => { initApp(); }, []);

  const initApp = async () => {
    try {
      await AsyncStorage.setItem('onboarding_done', 'true');
      const saved = await AsyncStorage.getItem('customer_profile');
      const savedVehicle = await AsyncStorage.getItem('vehicle_profile');
      const savedVehicles = await AsyncStorage.getItem('vehicles_list');
      const savedMechanic = await AsyncStorage.getItem('mechanic_profile');

      if (savedMechanic) {
        const m = JSON.parse(savedMechanic);
        if (m.status === 'approved') {
          setCustomer(m);
          setIsMechanic(true);
          if (savedVehicle) setVehicle(JSON.parse(savedVehicle));
          if (savedVehicles) setVehicles(JSON.parse(savedVehicles));
          setScreen('main');
          registerForPushNotifications(m.phone);
        } else {
          setScreen('login');
        }
      } else if (saved) {
        const parsedCustomer = JSON.parse(saved);
        setCustomer(parsedCustomer);
        if (savedVehicle) setVehicle(JSON.parse(savedVehicle));
        if (savedVehicles) setVehicles(JSON.parse(savedVehicles));
        setScreen('main');
        registerForPushNotifications(parsedCustomer.phone);
      } else {
        setScreen('login');
      }
    } catch (e) {
      setScreen('login');
    }
    setAppReady(true);
  };

  const handleCustomerLogin = async (user) => {
    setCustomer(user);
    setIsMechanic(false);
    await AsyncStorage.setItem('customer_profile', JSON.stringify(user));
    registerForPushNotifications(user.phone);
    setScreen('vehicle');
  };

  const handleMechanicLogin = async (user) => {
    setCustomer(user);
    setIsMechanic(true);
    await AsyncStorage.setItem('mechanic_profile', JSON.stringify(user));
    registerForPushNotifications(user.phone);
    setScreen('vehicle');
  };

  const handleMechanicPending = (user, status) => {
    setScreen('login');
  };

  const handleVehicleSelect = async (v) => {
    setVehicle(v);
    if (v) {
      await AsyncStorage.setItem('vehicle_profile', JSON.stringify(v));
      const list = vehicles.find(x => x.model === v.model)
        ? vehicles
        : [...vehicles, v].slice(0, 3);
      setVehicles(list);
      await AsyncStorage.setItem('vehicles_list', JSON.stringify(list));
    }
    setScreen('main');
  };

  const handleVehicleChange = async (v) => {
    setVehicle(v);
    if (v) await AsyncStorage.setItem('vehicle_profile', JSON.stringify(v));
  };

  const handleVehicleAdd = () => setScreen('vehicle');

  const handleLogout = async () => {
    await AsyncStorage.multiRemove([
      'customer_profile', 'vehicle_profile',
      'vehicles_list', 'mechanic_profile'
    ]);
    setCustomer(null);
    setVehicle(null);
    setVehicles([]);
    setIsMechanic(false);
    setScreen('login');
  };

  if (!appReady) {
    return (
      <LinearGradient colors={['#07111F', '#0D1F3C', '#07111F']} style={s.loading}>
        <StatusBar barStyle="light-content" backgroundColor="#07111F" />
        <View style={s.loadingShield}>
          <View style={s.loadingShieldInner}>
            <Text style={s.loadingRAS}>RAS</Text>
          </View>
        </View>
        <Text style={s.loadingBrand}>New Rahul Auto Spares</Text>
        <Text style={s.loadingLocation}>Telugu Peta, Nandyal</Text>
      </LinearGradient>
    );
  }

  if (screen === 'login') {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="#07111F" />
        <LoginScreen
          onCustomerLogin={handleCustomerLogin}
          onMechanicLogin={handleMechanicLogin}
          onMechanicPending={handleMechanicPending}
        />
      </>
    );
  }

  if (screen === 'vehicle') {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="#07111F" />
        <VehicleSelectScreen
          onSelect={handleVehicleSelect}
          currentVehicle={vehicle}
        />
      </>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#07111F" />
      <MainApp
        customer={customer}
        isMechanic={isMechanic}
        vehicle={vehicle}
        vehicles={vehicles}
        onVehicleChange={handleVehicleChange}
        onVehicleAdd={handleVehicleAdd}
        onLogout={handleLogout}
      />
    </>
  );
});

const s = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  loadingShield: {
    width: 110, height: 130,
    backgroundColor: '#0D1F3C',
    borderWidth: 2.5, borderColor: '#C9A84C',
    borderRadius: 20, borderBottomLeftRadius: 55,
    borderBottomRightRadius: 55,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#C9A84C', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 10,
  },
  loadingShieldInner: { alignItems: 'center' },
  loadingRAS: { fontSize: 32, fontWeight: '900', color: '#C9A84C', letterSpacing: 4 },
  loadingBrand: { fontSize: 17, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  loadingLocation: { fontSize: 12, color: 'rgba(201,168,76,0.7)', letterSpacing: 1 },
});
