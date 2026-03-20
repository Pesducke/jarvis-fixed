import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Platform } from 'react-native';
import {
  DMSerifDisplay_400Regular,
  DMSerifDisplay_400Regular_Italic,
} from '@expo-google-fonts/dm-serif-display';
import { DMMono_400Regular, DMMono_500Medium } from '@expo-google-fonts/dm-mono';
import { DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans';
import { useFonts } from 'expo-font';

import { Colors, Font as F } from './src/theme';
import { getProfile } from './src/services/storage';
import Onboarding from './src/screens/Onboarding';
import Briefing from './src/screens/Briefing';
import Dialogue from './src/screens/Dialogue';
import Snapshot from './src/screens/Snapshot';
import Recommendations from './src/screens/Recommendations';
import SplashScreen from './src/screens/SplashScreen'; // наш новий сплеш

const TABS = [
  { id: 'briefing', label: 'Брифинг', icon: '◎' },
  { id: 'dialogue', label: 'Диалог', icon: '◈' },
  { id: 'snapshot', label: 'Слепок', icon: '◇' },
  { id: 'recs', label: 'Подборка', icon: '◉' },
];

export default function App() {
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState('briefing');
  const [showSplash, setShowSplash] = useState(true); // спочатку показуємо сплеш
  const today = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

  // Загружаем шрифты
  const [fontsLoaded] = useFonts({
    DMSerifDisplay_400Regular,
    DMSerifDisplay_400Regular_Italic,
    DMMono_400Regular,
    DMMono_500Medium,
    DMSans_400Regular,
    DMSans_500Medium,
  });

  // Эффект для загрузки профиля после того, как сплеш скроется
  useEffect(() => {
    if (!showSplash && fontsLoaded) {
      // Загружаем профиль, когда шрифты загружены и сплеш скрыт
      getProfile().then(setProfile).catch(console.error);
    }
  }, [showSplash, fontsLoaded]);

  // Показываем сплеш, пока он не скрыт
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // Если шрифты ещё не загружены – показываем пустой экран (такого не должно быть, т.к. сплеш скрывается через 5 сек)
  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: Colors.bg }} />;
  }

  // Если профиль не создан — показываем онбординг
  if (!profile) {
    return (
      <Onboarding
        onDone={async () => {
          const p = await getProfile();
          setProfile(p);
        }}
      />
    );
  }

  // Основной интерфейс
  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <SafeAreaView style={s.safe}>
        {/* Верхняя панель */}
        <View style={s.top}>
          <View style={s.logoRow}>
            <Text style={s.logo}>
              J<Text style={s.logoMuted}>ARVIS</Text>
            </Text>
            <View style={s.badge}>
              <Text style={s.badgeTxt}>DeepSeek</Text>
            </View>
          </View>
          <Text style={s.date}>{today}</Text>
        </View>

        {/* Экраны */}
        <View style={s.body}>
          {tab === 'briefing' && <Briefing topics={profile.topics} />}
          {tab === 'dialogue' && <Dialogue />}
          {tab === 'snapshot' && <Snapshot topics={profile.topics} />}
          {tab === 'recs' && <Recommendations topics={profile.topics} />}
        </View>

        {/* Нижнее меню */}
        <View style={s.tabs}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[s.tabBtn, tab === t.id && s.tabOn]}
              onPress={() => setTab(t.id)}
              activeOpacity={0.7}
            >
              <Text style={[s.tabIco, tab === t.id && s.tabIcoOn]}>{t.icon}</Text>
              <Text style={[s.tabLbl, tab === t.id && s.tabLblOn]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  safe: { flex: 1 },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 8,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { fontFamily: F.mono, fontSize: 18, letterSpacing: 3, color: Colors.accent },
  logoMuted: { color: Colors.muted },
  badge: {
    backgroundColor: '#0f4c7515',
    borderWidth: 1,
    borderColor: '#1a6fa030',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeTxt: { fontFamily: F.mono, fontSize: 13, color: '#4da6e0', letterSpacing: 0.5 },
  date: { fontFamily: F.mono, fontSize: 15, color: Colors.muted },
  body: { flex: 1 },
  tabs: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  tabOn: { backgroundColor: Colors.surface2 },
  tabIco: { fontSize: 20, color: Colors.muted, marginBottom: 2 },
  tabIcoOn: { color: Colors.purple },
  tabLbl: {
    fontFamily: F.mono,
    fontSize: 13,
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tabLblOn: { color: Colors.text },
});