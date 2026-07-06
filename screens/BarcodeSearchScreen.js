import { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  SafeAreaView, StatusBar, Alert,
  TextInput, Animated, Linking
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';

const API_URL = 'https://rahul-auto-spares-backend.onrender.com';

export default function BarcodeSearchScreen({
  onBack, onAddToCart, isMechanic
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [mode, setMode] = useState('camera');

  const resultAnim = useRef(new Animated.Value(0)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!permission?.granted) requestPermission();
    startScanLine();
  }, []);

  const startScanLine = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1, duration: 2000, useNativeDriver: true
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0, duration: 2000, useNativeDriver: true
        }),
      ])
    ).start();
  };

  const searchProduct = async (code) => {
    setLoading(true);
    try {
      const r = await fetch(
        `${API_URL}/products/barcode/${code}`
      );
      const d = await r.json();
      if (d.found && d.product) {
        setProduct(d.product);
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
        Animated.spring(resultAnim, {
          toValue: 1, tension: 50, friction: 7,
          useNativeDriver: true
        }).start();
      } else {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Error
        );
        Alert.alert(
          '❌ Part Not Found',
          `No part found for code: ${code}\n\nTry searching manually in Browse tab.`,
          [{ text: 'OK', onPress: () => {
            setScanned(false);
            resultAnim.setValue(0);
          }}]
        );
      }
    } catch {
      Alert.alert('❌ Error', 'Check your internet connection');
      setScanned(false);
    }
    setLoading(false);
  };

  const handleBarcode = async ({ data }) => {
    if (scanned || loading) return;
    setScanned(true);
    setScanning(false);
    await searchProduct(data);
  };

  const handleManualSearch = () => {
    if (!manualCode.trim()) return;
    setScanned(true);
    searchProduct(manualCode.trim());
  };

  const reset = () => {
    setScanned(false);
    setScanning(true);
    setProduct(null);
    resultAnim.setValue(0);
  };

  const getPrice = (p) => isMechanic
    ? Math.round(p.selling_price * 0.95)
    : p.selling_price;

  const scanLineY = scanLineAnim.interpolate({
    inputRange: [0, 1], outputRange: [0, 220]
  });

  if (!permission?.granted) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.centerBox}>
          <Text style={{ fontSize: 60, marginBottom: 20 }}>📷</Text>
          <Text style={s.title}>Camera Access Needed</Text>
          <Text style={s.sub}>
            Allow camera to scan part barcodes
          </Text>
          <TouchableOpacity
            style={s.permBtn}
            onPress={requestPermission}
          >
            <Text style={s.permBtnText}>Allow Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.backLink}
            onPress={onBack}
          >
            <Text style={s.backLinkText}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content"
        backgroundColor="#06060E" />

      {/* HEADER */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={onBack}>
          <Text style={s.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>📱 Scan Part Barcode</Text>
        <View style={{ width: 70 }} />
      </View>

      {/* MODE TOGGLE */}
      <View style={s.modeRow}>
        <TouchableOpacity
          style={[s.modeBtn, mode === 'camera' && s.modeBtnActive]}
          onPress={() => { setMode('camera'); reset(); }}
        >
          <Text style={[s.modeBtnText,
            mode === 'camera' && s.modeBtnTextActive]}>
            📷 Scan Barcode
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.modeBtn, mode === 'manual' && s.modeBtnActive]}
          onPress={() => setMode('manual')}
        >
          <Text style={[s.modeBtnText,
            mode === 'manual' && s.modeBtnTextActive]}>
            ⌨️ Enter Code
          </Text>
        </TouchableOpacity>
      </View>

      {/* CAMERA MODE */}
      {mode === 'camera' && !product && (
        <View style={s.cameraWrap}>
          <CameraView
            style={s.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: [
                'ean13', 'ean8', 'code128',
                'code39', 'qr', 'upc_a', 'upc_e'
              ]
            }}
            onBarcodeScanned={
              scanned ? undefined : handleBarcode
            }
          />
          {/* OVERLAY */}
          <View style={s.overlay}>
            <View style={s.topOverlay} />
            <View style={s.midRow}>
              <View style={s.sideOverlay} />
              <View style={s.scanBox}>
                <View style={[s.corner, s.cTL]} />
                <View style={[s.corner, s.cTR]} />
                <View style={[s.corner, s.cBL]} />
                <View style={[s.corner, s.cBR]} />
                {!scanned && (
                  <Animated.View style={[s.scanLine,
                    { transform: [{ translateY: scanLineY }] }
                  ]} />
                )}
              </View>
              <View style={s.sideOverlay} />
            </View>
            <View style={s.bottomOverlay}>
              <Text style={s.scanHint}>
                Point camera at part barcode
              </Text>
              <Text style={s.scanHintTe}>
                పార్ట్ బార్‌కోడ్‌పై కెమెరా పెట్టండి
              </Text>
              {loading && (
                <Text style={s.searchingText}>
                  🔍 Searching...
                </Text>
              )}
              {scanned && !loading && !product && (
                <TouchableOpacity
                  style={s.rescanBtn}
                  onPress={reset}
                >
                  <Text style={s.rescanText}>
                    🔄 Scan Again
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}

      {/* MANUAL MODE */}
      {mode === 'manual' && !product && (
        <View style={s.manualWrap}>
          <Text style={{ fontSize: 60, textAlign: 'center',
            marginBottom: 20 }}>🔢</Text>
          <Text style={s.manualTitle}>
            Enter Part Code / SKU
          </Text>
          <Text style={s.manualSub}>
            Type the barcode number or SKU from the old part
          </Text>
          <TextInput
            style={s.manualInput}
            value={manualCode}
            onChangeText={setManualCode}
            placeholder="e.g. HRO-SPL-001 or 8901234567890"
            placeholderTextColor="rgba(255,255,255,0.25)"
            autoCapitalize="characters"
            autoFocus
          />
          <TouchableOpacity
            style={[s.searchBtn,
              !manualCode.trim() && { opacity: 0.4 }]}
            onPress={handleManualSearch}
            disabled={!manualCode.trim() || loading}
          >
            <Text style={s.searchBtnText}>
              {loading ? '🔍 Searching...' : '🔍 Search Part'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* RESULT */}
      {product && (
        <Animated.ScrollView
          contentContainerStyle={s.resultWrap}
          style={{ transform: [{ scale: resultAnim }],
            opacity: resultAnim }}
        >
          {/* FOUND BADGE */}
          <View style={s.foundBadge}>
            <Text style={s.foundText}>✅ Part Found!</Text>
          </View>

          {/* PRODUCT CARD */}
          <View style={s.productCard}>
            <Text style={s.productIcon}>🔩</Text>
            <Text style={s.productName}>{product.name_en}</Text>
            {product.name_te && (
              <Text style={s.productNameTe}>
                {product.name_te}
              </Text>
            )}
            <Text style={s.productSku}>{product.sku}</Text>

            <View style={s.priceRow}>
              <View style={s.priceItem}>
                <Text style={s.priceLabel}>MRP</Text>
                <Text style={s.priceMrp}>₹{product.mrp}</Text>
              </View>
              <View style={s.priceDivider} />
              <View style={s.priceItem}>
                <Text style={s.priceLabel}>Our Price</Text>
                <Text style={s.priceValue}>
                  ₹{getPrice(product)}
                </Text>
              </View>
              <View style={s.priceDivider} />
              <View style={s.priceItem}>
                <Text style={s.priceLabel}>Save</Text>
                <Text style={[s.priceValue, { color: '#4ADE80' }]}>
                  ₹{product.mrp - getPrice(product)}
                </Text>
              </View>
            </View>

            <View style={[s.stockRow,
              {
                backgroundColor: product.stock_qty > 0
                  ? 'rgba(74,222,128,0.1)'
                  : 'rgba(255,71,87,0.1)',
                borderColor: product.stock_qty > 0
                  ? 'rgba(74,222,128,0.3)'
                  : 'rgba(255,71,87,0.3)'
              }]}>
              <Text style={{
                color: product.stock_qty > 0
                  ? '#4ADE80' : '#FF4757',
                fontWeight: 'bold', fontSize: 14
              }}>
                {product.stock_qty > 0
                  ? `✅ In Stock · ${product.stock_qty} units`
                  : '❌ Out of Stock'}
              </Text>
            </View>

            {product.stock_qty > 0 && (
              <TouchableOpacity
                style={s.addCartBtn}
                onPress={() => {
                  onAddToCart(product, 1);
                  onBack();
                }}
              >
                <Text style={s.addCartBtnText}>
                  🛒 Add to Cart · ₹{getPrice(product)}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={s.callBtn}
              onPress={() =>
                Linking.openURL('tel:08514244944')}
            >
              <Text style={s.callBtnText}>
                📞 Call Store for Availability
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={s.scanAgainBtn} onPress={reset}>
            <Text style={s.scanAgainText}>
              🔄 Scan Another Part
            </Text>
          </TouchableOpacity>
        </Animated.ScrollView>
      )}
    </SafeAreaView>
  );
}

const CORNER_SIZE = 24;
const CORNER_WIDTH = 3;
const PRIMARY = '#4F6EF7';

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06060E' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(79,110,247,0.15)',
  },
  backBtn: {
    backgroundColor: 'rgba(79,110,247,0.1)', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1,
    borderColor: 'rgba(79,110,247,0.2)',
  },
  backBtnText: { color: PRIMARY, fontSize: 14, fontWeight: 'bold' },
  headerTitle: {
    fontSize: 16, fontWeight: 'bold', color: '#fff',
  },
  modeRow: {
    flexDirection: 'row', padding: 12, gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(79,110,247,0.1)',
  },
  modeBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 12,
    alignItems: 'center', borderWidth: 1,
    borderColor: 'rgba(79,110,247,0.2)',
  },
  modeBtnActive: {
    backgroundColor: PRIMARY, borderColor: PRIMARY,
  },
  modeBtnText: {
    fontSize: 13, fontWeight: 'bold',
    color: 'rgba(255,255,255,0.4)',
  },
  modeBtnTextActive: { color: '#fff' },
  cameraWrap: { flex: 1, position: 'relative' },
  camera: { flex: 1 },
  overlay: {
    position: 'absolute', top: 0, left: 0,
    right: 0, bottom: 0,
  },
  topOverlay: {
    flex: 1, backgroundColor: 'rgba(6,6,14,0.7)',
  },
  midRow: { flexDirection: 'row', height: 240 },
  sideOverlay: {
    flex: 1, backgroundColor: 'rgba(6,6,14,0.7)',
  },
  scanBox: { width: 240, height: 240, position: 'relative' },
  corner: {
    position: 'absolute', width: CORNER_SIZE,
    height: CORNER_SIZE, borderColor: PRIMARY,
    borderWidth: CORNER_WIDTH,
  },
  cTL: { top: 0, left: 0,
    borderRightWidth: 0, borderBottomWidth: 0 },
  cTR: { top: 0, right: 0,
    borderLeftWidth: 0, borderBottomWidth: 0 },
  cBL: { bottom: 0, left: 0,
    borderRightWidth: 0, borderTopWidth: 0 },
  cBR: { bottom: 0, right: 0,
    borderLeftWidth: 0, borderTopWidth: 0 },
  scanLine: {
    position: 'absolute', left: 0, right: 0,
    height: 2, backgroundColor: PRIMARY,
    opacity: 0.8,
  },
  bottomOverlay: {
    flex: 1, backgroundColor: 'rgba(6,6,14,0.7)',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  scanHint: { fontSize: 14, color: '#fff' },
  scanHintTe: {
    fontSize: 12, color: 'rgba(79,110,247,0.5)',
  },
  searchingText: {
    fontSize: 14, color: '#FFC107', fontWeight: 'bold',
  },
  rescanBtn: {
    backgroundColor: PRIMARY, borderRadius: 20,
    paddingHorizontal: 24, paddingVertical: 10,
  },
  rescanText: {
    color: '#fff', fontWeight: 'bold', fontSize: 14,
  },
  manualWrap: {
    flex: 1, padding: 24, alignItems: 'center',
    justifyContent: 'center',
  },
  manualTitle: {
    fontSize: 20, fontWeight: 'bold', color: '#fff',
    marginBottom: 6, textAlign: 'center',
  },
  manualSub: {
    fontSize: 13, color: 'rgba(255,255,255,0.4)',
    textAlign: 'center', marginBottom: 24, lineHeight: 20,
  },
  manualInput: {
    backgroundColor: '#0E0E1C', borderRadius: 14, padding: 16,
    color: '#fff', fontSize: 16, borderWidth: 1,
    borderColor: 'rgba(79,110,247,0.3)', width: '100%',
    marginBottom: 14, textAlign: 'center', letterSpacing: 1,
  },
  searchBtn: {
    backgroundColor: PRIMARY, borderRadius: 20,
    paddingHorizontal: 40, paddingVertical: 14, width: '100%',
    alignItems: 'center',
  },
  searchBtnText: {
    color: '#fff', fontSize: 16, fontWeight: 'bold',
  },
  resultWrap: { padding: 20, alignItems: 'center' },
  foundBadge: {
    backgroundColor: 'rgba(74,222,128,0.1)', borderRadius: 20,
    paddingHorizontal: 20, paddingVertical: 8, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(74,222,128,0.3)',
  },
  foundText: {
    color: '#4ADE80', fontWeight: 'bold', fontSize: 15,
  },
  productCard: {
    backgroundColor: '#0E0E1C', borderRadius: 20, padding: 20,
    width: '100%', alignItems: 'center', borderWidth: 1,
    borderColor: 'rgba(79,110,247,0.2)', gap: 10,
  },
  productIcon: { fontSize: 56, marginBottom: 4 },
  productName: {
    fontSize: 20, fontWeight: 'bold', color: '#fff',
    textAlign: 'center',
  },
  productNameTe: {
    fontSize: 13, color: 'rgba(79,110,247,0.5)',
    textAlign: 'center',
  },
  productSku: {
    fontSize: 11, color: 'rgba(255,255,255,0.3)',
    letterSpacing: 2,
  },
  priceRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(79,110,247,0.06)', borderRadius: 14,
    padding: 14, width: '100%', marginTop: 4,
  },
  priceItem: { flex: 1, alignItems: 'center' },
  priceLabel: {
    fontSize: 10, color: 'rgba(255,255,255,0.4)',
    marginBottom: 4, textTransform: 'uppercase',
  },
  priceMrp: {
    fontSize: 16, color: 'rgba(255,255,255,0.3)',
    textDecorationLine: 'line-through',
  },
  priceValue: {
    fontSize: 18, fontWeight: 'bold', color: '#FFC107',
  },
  priceDivider: {
    width: 1, height: 36,
    backgroundColor: 'rgba(79,110,247,0.15)',
  },
  stockRow: {
    borderRadius: 10, padding: 10, width: '100%',
    alignItems: 'center', borderWidth: 1,
  },
  addCartBtn: {
    backgroundColor: PRIMARY, borderRadius: 16,
    padding: 14, width: '100%', alignItems: 'center',
  },
  addCartBtnText: {
    color: '#fff', fontSize: 16, fontWeight: 'bold',
  },
  callBtn: {
    backgroundColor: 'rgba(74,222,128,0.1)', borderRadius: 14,
    padding: 12, width: '100%', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(74,222,128,0.2)',
  },
  callBtnText: { color: '#4ADE80', fontWeight: 'bold' },
  scanAgainBtn: {
    marginTop: 16, backgroundColor: 'rgba(79,110,247,0.1)',
    borderRadius: 16, padding: 14, width: '100%',
    alignItems: 'center', borderWidth: 1,
    borderColor: 'rgba(79,110,247,0.2)',
  },
  scanAgainText: { color: PRIMARY, fontWeight: 'bold' },
  centerBox: {
    flex: 1, alignItems: 'center',
    justifyContent: 'center', padding: 40, gap: 14,
  },
  title: {
    fontSize: 20, fontWeight: 'bold', color: '#fff',
  },
  sub: {
    fontSize: 14, color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
  },
  permBtn: {
    backgroundColor: PRIMARY, borderRadius: 20,
    paddingHorizontal: 32, paddingVertical: 14,
  },
  permBtnText: { color: '#fff', fontWeight: 'bold' },
  backLink: { padding: 12 },
  backLinkText: { color: 'rgba(255,255,255,0.4)' },
});