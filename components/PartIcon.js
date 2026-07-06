import { View } from 'react-native';
import Svg, {
  Rect, Circle, Line, Path, Polygon, Text as SvgText, G
} from 'react-native-svg';

// Maps category_id OR sku prefix to the right icon
export function getCategoryFromSku(sku) {
  if (!sku) return 0;
  if (sku.startsWith('OIL')) return 8;
  if (sku.startsWith('SPL')) return 1;
  if (sku.startsWith('PAS')) return 1;
  if (sku.startsWith('GLA')) return 1;
  if (sku.startsWith('HFD')) return 1;
  if (sku.startsWith('HNS')) return 1;
  if (sku.startsWith('HDY')) return 1;
  return 0;
}

export function getCategoryFromProduct(product) {
  if (product?.category_id) return product.category_id;
  return getCategoryFromSku(product?.sku);
}

// size: 'sm' = 44px cards, 'md' = 60px browse, 'lg' = 80px detail modal
export default function PartIcon({ product, categoryId, size = 'md' }) {
  const catId = categoryId ?? getCategoryFromProduct(product);
  const dim = size === 'sm' ? 44 : size === 'lg' ? 80 : 60;
  const scale = dim / 60;

  return (
    <View style={{ width: dim, height: dim, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={dim} height={dim} viewBox="0 0 60 60">
        <G scale={scale} origin="0,0">
          {renderIcon(catId)}
        </G>
      </Svg>
    </View>
  );
}

function renderIcon(catId) {
  switch (catId) {
    case 1: return <EngineIcon />;
    case 2: return <BrakeIcon />;
    case 3: return <ElectricalIcon />;
    case 4: return <ChainIcon />;
    case 5: return <FilterIcon />;
    case 6: return <BodyIcon />;
    case 7: return <TyreIcon />;
    case 8: return <OilIcon />;
    case 9: return <SuspensionIcon />;
    case 10: return <BatteryIcon />;
    default: return <DefaultIcon />;
  }
}

// ── 1. ENGINE ──
function EngineIcon() {
  return (
    <G>
      <Rect x="16" y="10" width="28" height="30" rx="3" fill="#2a2a3a" stroke="#555" strokeWidth="1.5"/>
      <Rect x="19" y="16" width="22" height="10" rx="2" fill="#888" stroke="#aaa" strokeWidth="1"/>
      <Rect x="19" y="20" width="22" height="2" rx="1" fill="#bbb" stroke="#ccc" strokeWidth="0.5"/>
      <Rect x="19" y="23" width="22" height="2" rx="1" fill="#bbb" stroke="#ccc" strokeWidth="0.5"/>
      <Rect x="27" y="26" width="6" height="14" rx="2" fill="#777" stroke="#999" strokeWidth="1"/>
      <Circle cx="30" cy="42" r="5" fill="#555" stroke="#888" strokeWidth="1.5"/>
      <Circle cx="30" cy="42" r="2" fill="#333"/>
      <Circle cx="20" cy="13" r="2" fill="#666" stroke="#888" strokeWidth="0.8"/>
      <Circle cx="40" cy="13" r="2" fill="#666" stroke="#888" strokeWidth="0.8"/>
      <Rect x="8" y="14" width="8" height="5" rx="2" fill="#444" stroke="#666" strokeWidth="1"/>
      <Rect x="44" y="14" width="8" height="5" rx="2" fill="#444" stroke="#666" strokeWidth="1"/>
    </G>
  );
}

// ── 2. BRAKES ──
function BrakeIcon() {
  return (
    <G>
      <Circle cx="30" cy="30" r="22" fill="#1a1a2e" stroke="#666" strokeWidth="1.5"/>
      <Circle cx="30" cy="30" r="22" fill="none" stroke="#888" strokeWidth="6" strokeDasharray="8,4"/>
      <Circle cx="30" cy="30" r="12" fill="#222" stroke="#777" strokeWidth="1.5"/>
      <Circle cx="30" cy="30" r="5" fill="#555" stroke="#999" strokeWidth="1"/>
      <Circle cx="30" cy="30" r="2" fill="#333"/>
      <Circle cx="30" cy="18" r="2" fill="#333" stroke="#666" strokeWidth="0.8"/>
      <Circle cx="40" cy="24" r="2" fill="#333" stroke="#666" strokeWidth="0.8"/>
      <Circle cx="40" cy="36" r="2" fill="#333" stroke="#666" strokeWidth="0.8"/>
      <Circle cx="30" cy="42" r="2" fill="#333" stroke="#666" strokeWidth="0.8"/>
      <Circle cx="20" cy="36" r="2" fill="#333" stroke="#666" strokeWidth="0.8"/>
      <Circle cx="20" cy="24" r="2" fill="#333" stroke="#666" strokeWidth="0.8"/>
      <Rect x="42" y="22" width="10" height="16" rx="3" fill="#CC2200" stroke="#FF3C1E" strokeWidth="1.2"/>
      <Rect x="44" y="26" width="6" height="8" rx="1" fill="#aa1100"/>
    </G>
  );
}

// ── 3. ELECTRICAL ──
function ElectricalIcon() {
  return (
    <G>
      <Polygon points="30,6 38,11 38,21 30,26 22,21 22,11" fill="#666" stroke="#999" strokeWidth="1.2"/>
      <Polygon points="30,9 36,13 36,20 30,24 24,20 24,13" fill="#888"/>
      <Rect x="27" y="24" width="6" height="16" rx="2" fill="#ddd" stroke="#bbb" strokeWidth="1"/>
      <Rect x="27" y="32" width="6" height="12" rx="1" fill="#777" stroke="#555" strokeWidth="0.8"/>
      <Line x1="27" y1="34" x2="33" y2="34" stroke="#555" strokeWidth="0.8"/>
      <Line x1="27" y1="36" x2="33" y2="36" stroke="#555" strokeWidth="0.8"/>
      <Line x1="27" y1="38" x2="33" y2="38" stroke="#555" strokeWidth="0.8"/>
      <Line x1="27" y1="40" x2="33" y2="40" stroke="#555" strokeWidth="0.8"/>
      <Rect x="29" y="44" width="2" height="8" rx="1" fill="#aaa"/>
      <Path d="M33 48 L36 44 L34 46 L37 42" fill="none" stroke="#FFB800" strokeWidth="1.5" strokeLinecap="round"/>
      <Circle cx="30" cy="7" r="3" fill="#FFB800" stroke="#cc8800" strokeWidth="1"/>
    </G>
  );
}

// ── 4. CHAIN / SPROCKET ──
function ChainIcon() {
  return (
    <G>
      <Circle cx="20" cy="30" r="14" fill="#222" stroke="#666" strokeWidth="1.2"/>
      <Circle cx="20" cy="30" r="8" fill="#1a1a2e" stroke="#555" strokeWidth="1"/>
      <Circle cx="20" cy="30" r="3" fill="#444" stroke="#777" strokeWidth="1"/>
      <Rect x="18" y="14" width="4" height="5" rx="1" fill="#777" stroke="#999" strokeWidth="0.8"/>
      <Rect x="18" y="41" width="4" height="5" rx="1" fill="#777" stroke="#999" strokeWidth="0.8"/>
      <Rect x="6" y="28" width="5" height="4" rx="1" fill="#777" stroke="#999" strokeWidth="0.8"/>
      <Rect x="28" y="28" width="5" height="4" rx="1" fill="#777" stroke="#999" strokeWidth="0.8"/>
      <Rect x="34" y="27" width="9" height="6" rx="3" fill="none" stroke="#aaa" strokeWidth="2"/>
      <Rect x="44" y="27" width="9" height="6" rx="3" fill="none" stroke="#aaa" strokeWidth="2"/>
      <Circle cx="38" cy="30" r="1.5" fill="#888"/>
      <Circle cx="48" cy="30" r="1.5" fill="#888"/>
    </G>
  );
}

// ── 5. FILTER ──
function FilterIcon() {
  return (
    <G>
      <Rect x="12" y="14" width="36" height="32" rx="5" fill="#2a1a00" stroke="#aa6600" strokeWidth="1.5"/>
      <Rect x="16" y="18" width="28" height="24" rx="3" fill="#cc7700" opacity="0.3"/>
      <Line x1="20" y1="18" x2="20" y2="42" stroke="#cc7700" strokeWidth="1.2" opacity="0.7"/>
      <Line x1="24" y1="18" x2="24" y2="42" stroke="#cc7700" strokeWidth="1.2" opacity="0.7"/>
      <Line x1="28" y1="18" x2="28" y2="42" stroke="#cc7700" strokeWidth="1.2" opacity="0.7"/>
      <Line x1="32" y1="18" x2="32" y2="42" stroke="#cc7700" strokeWidth="1.2" opacity="0.7"/>
      <Line x1="36" y1="18" x2="36" y2="42" stroke="#cc7700" strokeWidth="1.2" opacity="0.7"/>
      <Line x1="40" y1="18" x2="40" y2="42" stroke="#cc7700" strokeWidth="1.2" opacity="0.7"/>
      <Rect x="22" y="8" width="16" height="8" rx="3" fill="#333" stroke="#666" strokeWidth="1"/>
      <Rect x="26" y="10" width="8" height="4" rx="1" fill="#222"/>
      <Rect x="10" y="22" width="3" height="16" rx="1" fill="#888" stroke="#aaa" strokeWidth="0.8"/>
      <Rect x="47" y="22" width="3" height="16" rx="1" fill="#888" stroke="#aaa" strokeWidth="0.8"/>
    </G>
  );
}

// ── 6. BODY / FRAME ──
function BodyIcon() {
  return (
    <G>
      <Rect x="10" y="14" width="32" height="6" rx="3" fill="#444" stroke="#777" strokeWidth="1.2"/>
      <Path d="M14 20 L18 46" stroke="#666" strokeWidth="5" strokeLinecap="round" fill="none"/>
      <Path d="M14 20 L18 46" stroke="#999" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <Path d="M34 20 L30 46" stroke="#666" strokeWidth="5" strokeLinecap="round" fill="none"/>
      <Path d="M34 20 L30 46" stroke="#999" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <Path d="M18 46 L44 44" stroke="#666" strokeWidth="4" strokeLinecap="round" fill="none"/>
      <Path d="M18 46 L44 44" stroke="#888" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <Path d="M30 46 L44 44" stroke="#555" strokeWidth="4" strokeLinecap="round" fill="none"/>
      <Rect x="38" y="12" width="8" height="16" rx="4" fill="#555" stroke="#888" strokeWidth="1.2"/>
      <Circle cx="18" cy="47" r="5" fill="#444" stroke="#777" strokeWidth="1.2"/>
      <Circle cx="18" cy="47" r="2" fill="#333"/>
      <Circle cx="44" cy="44" r="4" fill="#444" stroke="#777" strokeWidth="1.2"/>
      <Circle cx="44" cy="44" r="1.5" fill="#333"/>
    </G>
  );
}

// ── 7. TYRES ──
function TyreIcon() {
  return (
    <G>
      <Circle cx="30" cy="30" r="26" fill="#111" stroke="#444" strokeWidth="1.5"/>
      <Circle cx="30" cy="30" r="26" fill="none" stroke="#555" strokeWidth="4" strokeDasharray="6,3"/>
      <Circle cx="30" cy="30" r="20" fill="#1a1a1a" stroke="#333" strokeWidth="1"/>
      <Circle cx="30" cy="30" r="14" fill="#2a2a2a" stroke="#666" strokeWidth="2"/>
      <Line x1="30" y1="16" x2="30" y2="44" stroke="#777" strokeWidth="1.2"/>
      <Line x1="16" y1="30" x2="44" y2="30" stroke="#777" strokeWidth="1.2"/>
      <Line x1="20" y1="20" x2="40" y2="40" stroke="#777" strokeWidth="1.2"/>
      <Line x1="40" y1="20" x2="20" y2="40" stroke="#777" strokeWidth="1.2"/>
      <Circle cx="30" cy="30" r="5" fill="#555" stroke="#999" strokeWidth="1.5"/>
      <Circle cx="30" cy="30" r="2" fill="#333"/>
      <Rect x="29" y="4" width="2" height="6" rx="1" fill="#888"/>
    </G>
  );
}

// ── 8. OIL ──
function OilIcon() {
  return (
    <G>
      <Rect x="18" y="22" width="24" height="30" rx="4" fill="#1a2a00" stroke="#4a7a00" strokeWidth="1.5"/>
      <Rect x="20" y="28" width="20" height="16" rx="2" fill="#2a4a00" stroke="#4a7a00" strokeWidth="0.8"/>
      <Rect x="22" y="31" width="16" height="2" rx="1" fill="#6aaa00" opacity="0.8"/>
      <Rect x="22" y="35" width="12" height="2" rx="1" fill="#6aaa00" opacity="0.5"/>
      <Rect x="22" y="39" width="14" height="2" rx="1" fill="#6aaa00" opacity="0.5"/>
      <Rect x="34" y="30" width="4" height="12" rx="2" fill="#000" stroke="#333" strokeWidth="0.8"/>
      <Rect x="35" y="34" width="2" height="6" rx="1" fill="#4aaa00" opacity="0.7"/>
      <Rect x="23" y="14" width="14" height="10" rx="3" fill="#222" stroke="#555" strokeWidth="1"/>
      <Rect x="21" y="10" width="18" height="7" rx="3" fill="#4a7a00" stroke="#6aaa00" strokeWidth="1"/>
      <Path d="M42 26 Q50 26 50 34 Q50 42 42 42" fill="none" stroke="#4a7a00" strokeWidth="3" strokeLinecap="round"/>
    </G>
  );
}

// ── 9. SUSPENSION ──
function SuspensionIcon() {
  return (
    <G>
      <Rect x="14" y="8" width="10" height="38" rx="5" fill="#333" stroke="#777" strokeWidth="1.5"/>
      <Rect x="15" y="26" width="8" height="22" rx="4" fill="#555" stroke="#999" strokeWidth="1"/>
      <Rect x="36" y="8" width="10" height="38" rx="5" fill="#333" stroke="#777" strokeWidth="1.5"/>
      <Rect x="37" y="26" width="8" height="22" rx="4" fill="#555" stroke="#999" strokeWidth="1"/>
      <Line x1="17" y1="14" x2="21" y2="14" stroke="#aaa" strokeWidth="1.5"/>
      <Line x1="17" y1="17" x2="21" y2="17" stroke="#aaa" strokeWidth="1.5"/>
      <Line x1="17" y1="20" x2="21" y2="20" stroke="#aaa" strokeWidth="1.5"/>
      <Line x1="17" y1="23" x2="21" y2="23" stroke="#aaa" strokeWidth="1.5"/>
      <Line x1="39" y1="14" x2="43" y2="14" stroke="#aaa" strokeWidth="1.5"/>
      <Line x1="39" y1="17" x2="43" y2="17" stroke="#aaa" strokeWidth="1.5"/>
      <Line x1="39" y1="20" x2="43" y2="20" stroke="#aaa" strokeWidth="1.5"/>
      <Line x1="39" y1="23" x2="43" y2="23" stroke="#aaa" strokeWidth="1.5"/>
      <Rect x="12" y="6" width="36" height="6" rx="3" fill="#666" stroke="#999" strokeWidth="1"/>
      <Rect x="12" y="46" width="36" height="6" rx="3" fill="#555" stroke="#888" strokeWidth="1"/>
      <Circle cx="30" cy="49" r="3" fill="#333" stroke="#777" strokeWidth="1"/>
    </G>
  );
}

// ── 10. BATTERY ──
function BatteryIcon() {
  return (
    <G>
      <Rect x="8" y="18" width="44" height="28" rx="4" fill="#1a2a1a" stroke="#4a7a4a" strokeWidth="1.5"/>
      <Rect x="14" y="12" width="8" height="8" rx="2" fill="#cc2200" stroke="#ff4444" strokeWidth="1"/>
      <SvgText x="18" y="19" fontSize="8" fill="#fff" textAnchor="middle" fontWeight="bold">+</SvgText>
      <Rect x="38" y="12" width="8" height="8" rx="2" fill="#222" stroke="#666" strokeWidth="1"/>
      <SvgText x="42" y="19" fontSize="8" fill="#aaa" textAnchor="middle" fontWeight="bold">−</SvgText>
      <Line x1="20" y1="20" x2="20" y2="44" stroke="#2a4a2a" strokeWidth="1.5"/>
      <Line x1="28" y1="20" x2="28" y2="44" stroke="#2a4a2a" strokeWidth="1.5"/>
      <Line x1="36" y1="20" x2="36" y2="44" stroke="#2a4a2a" strokeWidth="1.5"/>
      <Line x1="44" y1="20" x2="44" y2="44" stroke="#2a4a2a" strokeWidth="1.5"/>
      <Rect x="11" y="28" width="6" height="10" rx="1" fill="#4ADE80" opacity="0.8"/>
      <Rect x="21" y="28" width="6" height="10" rx="1" fill="#4ADE80" opacity="0.8"/>
      <Rect x="31" y="28" width="6" height="10" rx="1" fill="#4ADE80" opacity="0.5"/>
      <Rect x="41" y="28" width="6" height="10" rx="1" fill="#4ADE80" opacity="0.2"/>
      <Rect x="8" y="40" width="44" height="6" rx="2" fill="#2a4a2a" stroke="#4a7a4a" strokeWidth="0.5"/>
    </G>
  );
}

// ── DEFAULT (unknown category) ──
function DefaultIcon() {
  return (
    <G>
      <Circle cx="30" cy="30" r="20" fill="#222" stroke="#555" strokeWidth="1.5"/>
      <Rect x="27" y="18" width="6" height="14" rx="3" fill="#777" stroke="#999" strokeWidth="1"/>
      <Circle cx="30" cy="36" r="3" fill="#777" stroke="#999" strokeWidth="1"/>
    </G>
  );
}