import { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  SafeAreaView, StatusBar, Animated, Dimensions,
  ScrollView
} from 'react-native';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const QUESTIONS = [
  {
    id: 1,
    question: 'How long since your last oil change?',
    questionTe: 'చివరిసారి ఆయిల్ మార్చి ఎంత కాలమైంది?',
    icon: '🛢️',
    options: [
      { label: 'Less than 3 months', score: 10 },
      { label: '3-6 months', score: 7 },
      { label: '6-12 months', score: 4 },
      { label: 'More than 1 year', score: 0 },
    ]
  },
  {
    id: 2,
    question: 'How are your brakes working?',
    questionTe: 'మీ బ్రేక్స్ ఎలా పని చేస్తున్నాయి?',
    icon: '🔧',
    options: [
      { label: 'Excellent - stops perfectly', score: 10 },
      { label: 'Good - minor noise', score: 7 },
      { label: 'Weak - takes longer', score: 3 },
      { label: 'Poor - very dangerous', score: 0 },
    ]
  },
  {
    id: 3,
    question: 'How is your bike\'s engine performance?',
    questionTe: 'ఇంజన్ పనితీరు ఎలా ఉంది?',
    icon: '⚙️',
    options: [
      { label: 'Smooth - no issues', score: 10 },
      { label: 'Slight noise sometimes', score: 6 },
      { label: 'Rough - vibrates a lot', score: 3 },
      { label: 'Very poor - hard to start', score: 0 },
    ]
  },
  {
    id: 4,
    question: 'What is the tyre condition?',
    questionTe: 'టైర్ పరిస్థితి ఏమిటి?',
    icon: '🏍️',
    options: [
      { label: 'Like new - good grip', score: 10 },
      { label: 'Moderate wear - ok', score: 7 },
      { label: 'Worn out - low grip', score: 3 },
      { label: 'Bald - very risky', score: 0 },
    ]
  },
  {
    id: 5,
    question: 'How is the chain condition?',
    questionTe: 'చైన్ పరిస్థితి ఏమిటి?',
    icon: '🔗',
    options: [
      { label: 'Well oiled - no noise', score: 10 },
      { label: 'Little loose - ok', score: 6 },
      { label: 'Very loose - noisy', score: 2 },
      { label: 'Rusty/Broken', score: 0 },
    ]
  },
];

const getHealthData = (score) => {
  if (score >= 80) return {
    label: 'Excellent! 🌟',
    color: '#4ADE80',
    bg: 'rgba(74,222,128,0.1)',
    desc: 'Your bike is in great condition! Keep it up!',
    descTe: 'మీ బైక్ అద్భుతంగా ఉంది!',
    parts: []
  };
  if (score >= 60) return {
    label: 'Good 👍',
    color: '#4F6EF7',
    bg: 'rgba(79,110,247,0.1)',
    desc: 'Minor maintenance needed soon.',
    descTe: 'చిన్న మెయింటెనెన్స్ అవసరం.',
    parts: ['Engine Oil', 'Chain Lubricant']
  };
  if (score >= 40) return {
    label: 'Needs Attention ⚠️',
    color: '#FFC107',
    bg: 'rgba(255,193,7,0.1)',
    desc: 'Several parts need replacement soon!',
    descTe: 'కొన్ని పార్ట్స్ మార్చాల్సిన అవసరం ఉంది!',
    parts: ['Brake Shoes', 'Engine Oil', 'Air Filter', 'Chain']
  };
  return {
    label: 'Critical! 🚨',
    color: '#FF4757',
    bg: 'rgba(255,71,87,0.1)',
    desc: 'Your bike needs urgent service!',
    descTe: 'మీ బైక్‌కి తక్షణ సర్వీస్ అవసరం!',
    parts: ['Brake Shoes', 'Engine Oil', 'Tyres', 'Chain', 'Air Filter', 'Spark Plug']
  };
};

export default function BikeHealthScreen({ onBack, onBrowseParts }) {
  const [step, setStep] = useState(0);
  // step 0 = intro, 1-5 = questions, 6 = result
  const [answers, setAnswers] = useState([]);
  const [score, setScore] = useState(0);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(width)).current;
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const pulseAnims = useRef(
    QUESTIONS[0]?.options.map(() => new Animated.Value(1))
  ).current;
  const cardScale = useRef(new Animated.Value(0.8)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (step === 0) {
      Animated.parallel([
        Animated.spring(cardScale, {
          toValue: 1, tension: 50, friction: 7,
          useNativeDriver: true
        }),
        Animated.timing(cardOpacity, {
          toValue: 1, duration: 400, useNativeDriver: true
        }),
      ]).start();
    }
  }, [step]);

  const animateIn = () => {
    slideAnim.setValue(width);
    Animated.spring(slideAnim, {
      toValue: 0, tension: 60, friction: 8,
      useNativeDriver: true
    }).start();
  };

  const updateProgress = (newStep) => {
    Animated.timing(progressAnim, {
      toValue: newStep / QUESTIONS.length,
      duration: 400,
      useNativeDriver: false
    }).start();
  };

  const selectAnswer = async (option, qIndex) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Bounce selected option
    Animated.sequence([
      Animated.spring(pulseAnims[qIndex], {
        toValue: 0.95, tension: 100, friction: 5,
        useNativeDriver: true
      }),
      Animated.spring(pulseAnims[qIndex], {
        toValue: 1, tension: 100, friction: 5,
        useNativeDriver: true
      }),
    ]).start();

    const newAnswers = [...answers, option.score];
    setAnswers(newAnswers);

    if (newAnswers.length === QUESTIONS.length) {
      const total = newAnswers.reduce((a, b) => a + b, 0);
      const pct = Math.round((total / (QUESTIONS.length * 10)) * 100);
      setScore(pct);
      setStep(6);
      // Animate score
      Animated.timing(scoreAnim, {
        toValue: pct, duration: 2000,
        easing: Animated.Easing,
        useNativeDriver: false
      }).start();
    } else {
      updateProgress(newAnswers.length);
      setStep(newAnswers.length + 1);
      animateIn();
    }
  };

  const reset = () => {
    setStep(0);
    setAnswers([]);
    setScore(0);
    progressAnim.setValue(0);
    scoreAnim.setValue(0);
    cardScale.setValue(0.8);
    cardOpacity.setValue(0);
  };

  const currentQ = QUESTIONS[step - 1];
  const health = getHealthData(score);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // ── INTRO SCREEN ──
  if (step === 0) {
    return (
      <SafeAreaView style={s.container}>
        <StatusBar barStyle="light-content"
          backgroundColor="#06060E" />
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={onBack}>
            <Text style={s.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>🏍️ Bike Health</Text>
          <View style={{ width: 70 }} />
        </View>
        <ScrollView contentContainerStyle={s.introBody}>
          <Animated.View style={[s.introCard,
            {
              transform: [{ scale: cardScale }],
              opacity: cardOpacity
            }
          ]}>
            <Text style={s.introIcon}>🏍️</Text>
            <Text style={s.introTitle}>
              Free Bike Health Check!
            </Text>
            <Text style={s.introTitleTe}>
              ఉచిత బైక్ హెల్త్ చెక్!
            </Text>
            <Text style={s.introDesc}>
              Answer 5 quick questions and get your
              bike's health score with recommended parts!
            </Text>
            <View style={s.introFeatures}>
              {[
                '✅ 5 simple questions',
                '📊 Health score out of 100',
                '🔧 Parts recommendations',
                '⚡ Takes only 1 minute!',
              ].map((f, i) => (
                <Text key={i} style={s.introFeature}>{f}</Text>
              ))}
            </View>
            <TouchableOpacity
              style={s.startBtn}
              onPress={() => {
                Haptics.impactAsync(
                  Haptics.ImpactFeedbackStyle.Medium
                );
                setStep(1);
                animateIn();
              }}
            >
              <Text style={s.startBtnText}>
                Start Health Check →
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── RESULT SCREEN ──
  if (step === 6) {
    return (
      <SafeAreaView style={s.container}>
        <StatusBar barStyle="light-content"
          backgroundColor="#06060E" />
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={reset}>
            <Text style={s.backBtnText}>← Retake</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Your Results</Text>
          <View style={{ width: 70 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {/* SCORE GAUGE */}
          <View style={[s.gaugeCard,
            { borderColor: health.color + '40',
              backgroundColor: health.bg }]}>
            <Text style={s.gaugeLabel}>Bike Health Score</Text>
            <View style={s.gaugeOuter}>
              <View style={s.gaugeRing}>
                <Text style={[s.gaugeScore,
                  { color: health.color }]}>
                  {score}
                </Text>
                <Text style={s.gaugeOutOf}>/100</Text>
              </View>
            </View>
            <View style={s.gaugeBar}>
              <Animated.View style={[s.gaugeFill,
                {
                  width: `${score}%`,
                  backgroundColor: health.color
                }]} />
            </View>
            <Text style={[s.gaugeHealthLabel,
              { color: health.color }]}>
              {health.label}
            </Text>
            <Text style={s.gaugeDesc}>{health.desc}</Text>
            <Text style={s.gaugeDescTe}>{health.descTe}</Text>
          </View>

          {/* RECOMMENDED PARTS */}
          {health.parts.length > 0 && (
            <View style={s.partsCard}>
              <Text style={s.partsTitle}>
                🔧 Recommended Parts
              </Text>
              <Text style={s.partsSub}>
                Based on your answers, get these checked:
              </Text>
              {health.parts.map((part, i) => (
                <View key={i} style={s.partRow}>
                  <View style={[s.partDot,
                    { backgroundColor: health.color }]} />
                  <Text style={s.partName}>{part}</Text>
                  <Text style={[s.partUrgency,
                    { color: health.color }]}>
                    {score < 40 ? 'URGENT!' : 'Soon'}
                  </Text>
                </View>
              ))}
              <TouchableOpacity
                style={[s.shopBtn,
                  { backgroundColor: health.color }]}
                onPress={onBrowseParts}
              >
                <Text style={s.shopBtnText}>
                  🛒 Browse These Parts →
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* TIPS */}
          <View style={s.tipsCard}>
            <Text style={s.tipsTitle}>💡 Maintenance Tips</Text>
            {[
              'Change engine oil every 2000-3000 km',
              'Check tyre pressure every month',
              'Clean air filter every 6 months',
              'Lubricate chain every 500-700 km',
            ].map((tip, i) => (
              <Text key={i} style={s.tip}>• {tip}</Text>
            ))}
          </View>

          <TouchableOpacity
            style={s.retakeBtn}
            onPress={reset}
          >
            <Text style={s.retakeBtnText}>
              🔄 Take Test Again
            </Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── QUESTION SCREEN ──
  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content"
        backgroundColor="#06060E" />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={onBack}>
          <Text style={s.backBtnText}>← Exit</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>
          Question {step} of {QUESTIONS.length}
        </Text>
        <View style={{ width: 70 }} />
      </View>

      {/* PROGRESS BAR */}
      <View style={s.progressBg}>
        <Animated.View style={[s.progressFill,
          { width: progressWidth }]} />
      </View>

      <Animated.View style={[s.questionBody,
        { transform: [{ translateX: slideAnim }] }]}>
        <View style={s.questionCard}>
          <Text style={s.qIcon}>{currentQ?.icon}</Text>
          <Text style={s.qText}>{currentQ?.question}</Text>
          <Text style={s.qTextTe}>{currentQ?.questionTe}</Text>
        </View>

        <View style={s.optionsWrap}>
          {currentQ?.options.map((opt, i) => (
            <Animated.View key={i} style={[
              { transform: [{ scale: pulseAnims[i] || 1 }] }
            ]}>
              <TouchableOpacity
                style={[s.optionBtn,
                  { borderColor: i % 2 === 0
                    ? 'rgba(79,110,247,0.3)'
                    : 'rgba(255,193,7,0.3)' }]}
                onPress={() => selectAnswer(opt, i)}
              >
                <View style={[s.optionDot,
                  { backgroundColor: i % 2 === 0
                    ? '#4F6EF7' : '#FFC107' }]} />
                <Text style={s.optionText}>{opt.label}</Text>
                <Text style={s.optionArrow}>→</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

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
  backBtnText: { color: '#4F6EF7', fontSize: 14, fontWeight: 'bold' },
  headerTitle: {
    fontSize: 16, fontWeight: 'bold', color: '#fff',
  },
  introBody: {
    flexGrow: 1, alignItems: 'center',
    justifyContent: 'center', padding: 20,
  },
  introCard: {
    backgroundColor: '#0E0E1C', borderRadius: 24, padding: 28,
    alignItems: 'center', borderWidth: 1,
    borderColor: 'rgba(79,110,247,0.2)', width: '100%',
  },
  introIcon: { fontSize: 72, marginBottom: 16 },
  introTitle: {
    fontSize: 24, fontWeight: 'bold', color: '#fff',
    marginBottom: 4, textAlign: 'center',
  },
  introTitleTe: {
    fontSize: 14, color: 'rgba(79,110,247,0.6)',
    marginBottom: 14, textAlign: 'center',
  },
  introDesc: {
    fontSize: 14, color: 'rgba(255,255,255,0.5)',
    textAlign: 'center', lineHeight: 22, marginBottom: 20,
  },
  introFeatures: {
    width: '100%', gap: 8, marginBottom: 24,
  },
  introFeature: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  startBtn: {
    backgroundColor: '#4F6EF7', borderRadius: 20,
    paddingHorizontal: 32, paddingVertical: 16, width: '100%',
    alignItems: 'center',
  },
  startBtnText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  progressBg: {
    height: 4, backgroundColor: 'rgba(79,110,247,0.15)',
  },
  progressFill: {
    height: '100%', backgroundColor: '#4F6EF7', borderRadius: 2,
  },
  questionBody: { flex: 1, padding: 20 },
  questionCard: {
    backgroundColor: '#0E0E1C', borderRadius: 20, padding: 24,
    alignItems: 'center', marginBottom: 20, borderWidth: 1,
    borderColor: 'rgba(79,110,247,0.2)',
  },
  qIcon: { fontSize: 48, marginBottom: 14 },
  qText: {
    fontSize: 18, fontWeight: 'bold', color: '#fff',
    textAlign: 'center', marginBottom: 6, lineHeight: 26,
  },
  qTextTe: {
    fontSize: 13, color: 'rgba(79,110,247,0.6)',
    textAlign: 'center',
  },
  optionsWrap: { gap: 10 },
  optionBtn: {
    backgroundColor: '#0E0E1C', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1,
  },
  optionDot: { width: 10, height: 10, borderRadius: 5 },
  optionText: { flex: 1, fontSize: 14, color: '#fff', fontWeight: '600' },
  optionArrow: { fontSize: 16, color: 'rgba(255,255,255,0.3)' },
  gaugeCard: {
    borderRadius: 24, padding: 24, alignItems: 'center',
    marginBottom: 16, borderWidth: 2,
  },
  gaugeLabel: {
    fontSize: 12, color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase',
  },
  gaugeOuter: { marginBottom: 16 },
  gaugeRing: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center',
    justifyContent: 'center', borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  gaugeScore: {
    fontSize: 40, fontWeight: 'bold',
  },
  gaugeOutOf: { fontSize: 14, color: 'rgba(255,255,255,0.4)' },
  gaugeBar: {
    width: '100%', height: 8, backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 4, overflow: 'hidden', marginBottom: 14,
  },
  gaugeFill: { height: '100%', borderRadius: 4 },
  gaugeHealthLabel: {
    fontSize: 22, fontWeight: 'bold', marginBottom: 6,
  },
  gaugeDesc: {
    fontSize: 14, color: 'rgba(255,255,255,0.6)',
    textAlign: 'center', marginBottom: 2,
  },
  gaugeDescTe: {
    fontSize: 12, color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
  },
  partsCard: {
    backgroundColor: '#0E0E1C', borderRadius: 20, padding: 20,
    marginBottom: 16, borderWidth: 1,
    borderColor: 'rgba(79,110,247,0.2)',
  },
  partsTitle: {
    fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 4,
  },
  partsSub: {
    fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 14,
  },
  partRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderBottomWidth: 1,
    borderBottomColor: 'rgba(79,110,247,0.08)',
  },
  partDot: { width: 8, height: 8, borderRadius: 4 },
  partName: { flex: 1, fontSize: 14, color: '#fff', fontWeight: '600' },
  partUrgency: { fontSize: 11, fontWeight: 'bold' },
  shopBtn: {
    marginTop: 16, borderRadius: 16, padding: 14,
    alignItems: 'center',
  },
  shopBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  tipsCard: {
    backgroundColor: '#0E0E1C', borderRadius: 20, padding: 20,
    marginBottom: 16, borderWidth: 1,
    borderColor: 'rgba(255,193,7,0.15)',
  },
  tipsTitle: {
    fontSize: 15, fontWeight: 'bold', color: '#FFC107', marginBottom: 12,
  },
  tip: {
    fontSize: 13, color: 'rgba(255,255,255,0.5)',
    marginBottom: 8, lineHeight: 20,
  },
  retakeBtn: {
    backgroundColor: 'rgba(79,110,247,0.1)', borderRadius: 16,
    padding: 14, alignItems: 'center', borderWidth: 1,
    borderColor: 'rgba(79,110,247,0.2)',
  },
  retakeBtnText: { color: '#4F6EF7', fontWeight: 'bold', fontSize: 15 },
});