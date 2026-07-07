import { useState, useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform, Animated, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import OnboardingScreen from './screens/OnboardingScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import LoginScreen from './screens/LoginScreen';
import VehicleSelectScreen from './screens/VehicleSelectScreen';
import MainApp from './screens/MainApp';

const API_URL = 'https://rahul-auto-spares-backend.onrender.com';

// ── PUSH NOTIFICATION HANDLER ──
// Controls how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ── REGISTER FOR PUSH NOTIFICATIONS ──
async function registerForPushNotifications(phone) {
  if (!Device.isDevice) {
    // Simulators can't receive push notifications
    return null;
  }

  try {
    // Request permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return null;
    }

    // Get Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '02693dd5-74df-488e-ba61-7a16ab7b8965', // replace with your actual project ID
    });
    const token = tokenData.data;

    // Android channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('orders', {
        name: 'Order Updates',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#22C55E',
        sound: true,
      });
    }

    // Save token to backend
    if (phone && token) {
      await fetch(`${API_URL}/customer-tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, token }),
      }).catch(() => {});
    }

    return token;
  } catch (error) {
    console.log('Push notification setup error:', error);
    return null;
  }
}

export default function App() {
  const [appReady, setAppReady]   = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [screen, setScreen]       = useState('welcome');
  const [customer, setCustomer]   = useState(null);
  const [isMechanic, setIsMechanic] = useState(false);
  const [vehicle, setVehicle]     = useState(null);
  const [vehicles, setVehicles]   = useState([]);

  const notificationListener = useRef(null);
  const responseListener     = useRef(null);

  useEffect(() => {
    initApp();

    // Listen for incoming notifications (foreground)
    notificationListener.current = Notifications.addNotificationReceivedListener(
      notification => {
        console.log('Notification received:', notification.request.content.title);
        // You can show in-app alert here if needed
      }
    );

    // Listen for notification taps
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      response => {
        const data = response.notification.request.content.data;
        if (data?.type === 'order_ready') {
          // Navigate to orders tab — handled via screen state
          console.log('Order ready notification tapped:', data.order_id);
        }
      }
    );

    return () => {
      if (notificationListener.current)
        notificationListener.current.remove();
      if (responseListener.current)
        responseListener.current.remove();
    };
  }, []);

  const initApp = async () => {
    try {
      const onboardingDone = await AsyncStorage.getItem('onboarding_done');
      if (!onboardingDone) {
        setAppReady(true);
        return;
      }

      const savedCustomer = await AsyncStorage.getItem('customer_profile');
      const savedVehicle  = await AsyncStorage.getItem('vehicle_profile');
      const savedVehicles = await AsyncStorage.getItem('vehicles_list');
      if (savedVehicles) {
        setVehicles(JSON.parse(savedVehicles));
      }

      if (savedCustomer) {
        const c = JSON.parse(savedCustomer);
        setCustomer(c);
        setIsMechanic(c.isMechanic || false);

        // ✅ Register for push notifications with saved phone
        registerForPushNotifications(c.phone).catch(() => {});

        if (savedVehicle) {
          setVehicle(JSON.parse(savedVehicle));
          setScreen('main');
        } else {
          setScreen('vehicle');
        }
      }
    } catch {}
    setAppReady(true);
  };

  const handleLogin = async (customerData) => {
    setCustomer(customerData);
    setIsMechanic(customerData.isMechanic || false);
    await AsyncStorage.setItem('customer_profile', JSON.stringify(customerData));

    // ✅ Register for push notifications on login
    registerForPushNotifications(customerData.phone).catch(() => {});

    setScreen('vehicle');
  };

  const handleVehicleSelect = async (vehicleData) => {
    setVehicle(vehicleData);
    await AsyncStorage.setItem('vehicle_profile', JSON.stringify(vehicleData));
    // Add to vehicles list if not already there
    const existing = await AsyncStorage.getItem('vehicles_list');
    const list = existing ? JSON.parse(existing) : [];
    const alreadyExists = list.some(v => v.model === vehicleData.model && v.brand === vehicleData.brand);
    if (!alreadyExists && list.length < 3) {
      const updated = [...list, vehicleData];
      setVehicles(updated);
      await AsyncStorage.setItem('vehicles_list', JSON.stringify(updated));
    }
    setScreen('main');
  };

  const handleVehicleSkip = () => {
    setScreen('main');
  };

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

  const handleVehicleAdd = () => {
    setScreen('vehicle');
  };

  const handleVehicleChange = async (newVehicle) => {
    setVehicle(newVehicle);
    if (newVehicle) {
      if (newVehicle) {
      await AsyncStorage.setItem('vehicle_profile', JSON.stringify(newVehicle));
    }
    } else {
      await AsyncStorage.removeItem('vehicle_profile');
    }
  };

  if (!appReady) {
    return (
      <LinearGradient colors={['#07111F', '#0D1F3C', '#07111F']} style={styles.loading}>
        {/* RAS Shield Logo */}
        <View style={styles.loadingShield}>
          <View style={styles.loadingShieldInner}>
            <Text style={styles.loadingRAS}>RAS</Text>
            <Text style={styles.loadingBike}>🏍️</Text>
          </View>
        </View>
        <Text style={styles.loadingBrand}>New Rahul Auto Spares</Text>
        <Text style={styles.loadingLocation}>Telugu Peta, Nandyal</Text>
        <ActivityIndicator size="small" color="#C9A84C" style={{ marginTop: 28 }} />
        <Text style={styles.loadingHint}>Loading...</Text>
      </LinearGradient>
    );
  }

  if (showOnboarding) {
    return <OnboardingScreen onDone={() => setShowOnboarding(false)} />;
  }

  // Welcome screen skipped - go straight to login

  if (screen === 'login') {
    return <LoginScreen onCustomerLogin={handleLogin} onBack={() => setScreen('welcome')} />;
  }

  if (screen === 'vehicle') {
    return (
      <VehicleSelectScreen
        onSelect={handleVehicleSelect}
        onSkip={handleVehicleSkip}
        currentVehicle={vehicle}
      />
    );
  }

  return (
    <MainApp
      customer={customer}
      isMechanic={isMechanic}
      vehicle={vehicle}
      vehicles={vehicles}
      onVehicleChange={handleVehicleChange}
      onVehicleAdd={handleVehicleAdd}
      onLogout={handleLogout}
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8,
  },
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
  loadingShieldInner: { alignItems: 'center', gap: 4 },
  loadingRAS: {
    fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 4,
  },
  loadingBike: { fontSize: 20 },
  loadingBrand: { fontSize: 17, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  loadingLocation: { fontSize: 12, color: 'rgba(201,168,76,0.7)', letterSpacing: 1 },
  loadingHint: { fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 6 },
});