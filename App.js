import { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'react-native';
import LoginScreen from './screens/LoginScreen';
import VehicleSelectScreen from './screens/VehicleSelectScreen';
import MainApp from './screens/MainApp';

const API_URL = 'https://rahul-auto-spares-backend.onrender.com';

export default function App() {
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
        } else {
          setScreen('login');
        }
      } else if (saved) {
        setCustomer(JSON.parse(saved));
        if (savedVehicle) setVehicle(JSON.parse(savedVehicle));
        if (savedVehicles) setVehicles(JSON.parse(savedVehicles));
        setScreen('main');
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
    setScreen('vehicle');
  };

  const handleMechanicLogin = async (user) => {
    setCustomer(user);
    setIsMechanic(true);
    await AsyncStorage.setItem('mechanic_profile', JSON.stringify(user));
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
}

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
