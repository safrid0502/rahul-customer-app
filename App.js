import { useState, useEffect } from 'react';
import { StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WelcomeScreen from './screens/WelcomeScreen';
import LoginScreen from './screens/LoginScreen';
import VehicleSelectScreen from './screens/VehicleSelectScreen';
import MechanicApprovalScreen from './screens/MechanicApprovalScreen';
import MainApp from './screens/MainApp';

const API_URL = 'https://rahul-auto-spares-backend.onrender.com';

export default function App() {
  const [screen, setScreen] = useState('loading');
  const [customer, setCustomer] = useState(null);
  const [isMechanic, setIsMechanic] = useState(false);
  const [showVehicle, setShowVehicle] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [pendingMechanic, setPendingMechanic] = useState(null);
  const [mechanicStatus, setMechanicStatus] = useState(null);

  useEffect(() => { bootApp(); }, []);

  const bootApp = async () => {
    try {
      const seen = await AsyncStorage.getItem('seen_welcome');
      if (!seen) { setScreen('welcome'); return; }

      const mData = await AsyncStorage.getItem('mechanic_profile');
      if (mData) {
        const m = JSON.parse(mData);
        try {
          const r = await fetch(
            `${API_URL}/mechanics/check/${m.phone}`
          );
          const d = await r.json();
          if (d.status === 'approved') {
            const updated = { ...m, status: 'approved' };
            await AsyncStorage.setItem(
              'mechanic_profile', JSON.stringify(updated)
            );
            setCustomer(updated);
            setIsMechanic(true);
            setScreen('main');
          } else {
            setPendingMechanic(m);
            setMechanicStatus(d.status);
            setScreen('mechanicApproval');
          }
        } catch {
          if (m.status === 'approved') {
            setCustomer(m);
            setIsMechanic(true);
            setScreen('main');
          } else {
            setPendingMechanic(m);
            setMechanicStatus(m.status || 'pending');
            setScreen('mechanicApproval');
          }
        }
        return;
      }

      const cData = await AsyncStorage.getItem('customer_profile');
      if (cData) {
        setCustomer(JSON.parse(cData));
        setScreen('main');
        return;
      }
      setScreen('login');
    } catch { setScreen('login'); }
  };

  const handleLogin = async (user, mechanic = false) => {
    setCustomer(user);
    setIsMechanic(mechanic);
    if (!mechanic) setShowVehicle(true);
    setScreen('main');
  };

  const handleLogout = async () => {
    await AsyncStorage.multiRemove([
      'customer_profile', 'mechanic_profile'
    ]);
    setCustomer(null);
    setIsMechanic(false);
    setSelectedVehicle(null);
    setScreen('login');
  };

  if (screen === 'loading') return null;

  if (screen === 'welcome') {
    return (
      <WelcomeScreen
        onDone={async () => {
          await AsyncStorage.setItem('seen_welcome', 'true');
          setScreen('login');
        }}
      />
    );
  }

  if (screen === 'login') {
    return (
      <>
        <StatusBar barStyle="light-content"
          backgroundColor="#06060E" />
        <LoginScreen
          onCustomerLogin={(u) => handleLogin(u, false)}
          onMechanicLogin={(u) => handleLogin(u, true)}
          onMechanicPending={(m, s) => {
            setPendingMechanic(m);
            setMechanicStatus(s);
            setScreen('mechanicApproval');
          }}
        />
      </>
    );
  }

  if (screen === 'mechanicApproval') {
    return (
      <MechanicApprovalScreen
        mechanic={pendingMechanic}
        status={mechanicStatus}
        onApproved={async (m) => {
          const u = { ...m, status: 'approved' };
          await AsyncStorage.setItem(
            'mechanic_profile', JSON.stringify(u)
          );
          setCustomer(u);
          setIsMechanic(true);
          setScreen('main');
        }}
        onLogout={async () => {
          await AsyncStorage.removeItem('mechanic_profile');
          setScreen('login');
        }}
        onReApply={async () => {
          await AsyncStorage.removeItem('mechanic_profile');
          setScreen('login');
        }}
      />
    );
  }

  if (showVehicle) {
    return (
      <VehicleSelectScreen
        onSelect={(v) => {
          setSelectedVehicle(v);
          setShowVehicle(false);
        }}
        onSkip={() => setShowVehicle(false)}
      />
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content"
        backgroundColor="#06060E" />
      <MainApp
        customer={customer}
        isMechanic={isMechanic}
        vehicle={selectedVehicle}
        onVehicleChange={setSelectedVehicle}
        onLogout={handleLogout}
      />
    </>
  );
}