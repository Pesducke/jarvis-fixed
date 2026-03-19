import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
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

// Запрещаем автоматическое скрытие сплеш-скрина
SplashScreen.preventAutoHideAsync();

const TABS = [
  { id: 'briefing', label: 'Брифинг', icon: '◎' },
  { id: 'dialogue', label: 'Диалог', icon: '◈' },
  { id: 'snapshot', label: 'Слепок', icon: '◇' },
  { id: 'recs', label: 'Подборка', icon: '◉' },
];

export default function App() {
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState('briefing');
  const [ready, setReady] = useState(false); // готово ли приложение к показу
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

  // Эффект, который запускается после загрузки шрифтов
  useEffect(() => {
    async function prepare() {
      if (!fontsLoaded) return;

      try {
        const p = await getProfile();
        setProfile(p);
      } catch (error) {
        // Можно залогировать ошибку, но необязательно
        console.error('Ошибка загрузки профиля:', error);
      }

      // Всё готово, можно скрывать сплеш-скрин
      setReady(true);
      await SplashScreen.hideAsync();
    }

    prepare();
  }, [fontsLoaded]); // Зависимость — шрифты загружены

  // Показываем пустой фон, пока не готово
  if (!fontsLoaded || !ready) {
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
  logo: { fontFamily: F.mono, fontSize: 14, letterSpacing: 3, color: Colors.accent },
  logoMuted: { color: Colors.muted },
  badge: {
    backgroundColor: '#0f4c7515',
    borderWidth: 1,
    borderColor: '#1a6fa030',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeTxt: { fontFamily: F.mono, fontSize: 9, color: '#4da6e0', letterSpacing: 0.5 },
  date: { fontFamily: F.mono, fontSize: 11, color: Colors.muted },
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
  tabIco: { fontSize: 16, color: Colors.muted, marginBottom: 2 },
  tabIcoOn: { color: Colors.purple },
  tabLbl: {
    fontFamily: F.mono,
    fontSize: 9,
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tabLblOn: { color: Colors.text },
});