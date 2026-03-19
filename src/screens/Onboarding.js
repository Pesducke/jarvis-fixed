import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { Colors, Font } from '../theme';
import { Btn, Pill } from '../components/UI';
import ArtBackground from '../components/ArtBackground';
import { saveProfile } from '../services/storage';

const TOPICS = ['Технології','Наука','Психологія','Економіка','Геополітика','Філософія','Клімат','Суспільство','Історія','Медицина'];

export default function Onboarding({ onDone }) {
  const [sel, setSel] = useState([]);
  const [saving, setSaving] = useState(false);

  const toggle = useCallback((t) => {
    setSel(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);
  }, []);

  const start = useCallback(async () => {
    if (sel.length === 0 || saving) return;
    setSaving(true);
    try {
      await saveProfile({ topics: sel, createdAt: new Date().toISOString() });
      if (typeof onDone === 'function') onDone();
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setSaving(false);
    }
  }, [sel, onDone, saving]);

  return (
    <ArtBackground>
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" />
        <ScrollView contentContainerStyle={s.wrap} showsVerticalScrollIndicator={false}>
          <Text style={s.mono}>JARVIS</Text>
          <View style={s.div} />
          <Text style={s.h1}>Стань людиною,{'\n'}яка думає{'\n'}перш ніж{'\n'}реагувати.</Text>
          <Text style={s.sub}>Персональний брифінг. Сократівський{'\n'}діалог. Щотижневий зріз мислення.</Text>
          <Text style={s.label}>ОБЕРИ ТЕМИ</Text>
          <View style={s.pills}>
            {TOPICS.map(t => (
              <Pill key={t} label={t} active={sel.includes(t)} onPress={() => toggle(t)} />
            ))}
          </View>
          <Btn
            label={sel.length === 0 ? 'Обери хоча б одну тему' : `Почати → (${sel.length})`}
            onPress={start}
            disabled={sel.length === 0 || saving}
            loading={saving}
          />
          <Text style={s.note}>Дані зберігаються тільки на пристрої</Text>
        </ScrollView>
      </SafeAreaView>
    </ArtBackground>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  wrap: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  mono: { fontFamily: Font.mono, fontSize: 13, letterSpacing: 3, color: Colors.accent },
  div: { width: 24, height: 1, backgroundColor: Colors.accent, marginTop: 8, marginBottom: 32, opacity: 0.5 },
  h1: { fontFamily: Font.serif, fontSize: 40, lineHeight: 48, color: Colors.text, marginBottom: 16 },
  sub: { fontFamily: Font.sans, fontSize: 16, color: Colors.muted, lineHeight: 24, marginBottom: 32 },
  label: { fontFamily: Font.mono, fontSize: 10, color: Colors.muted, letterSpacing: 2, marginBottom: 12 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 28, marginHorizontal: -3 },
  note: { fontFamily: Font.mono, fontSize: 10, color: Colors.muted, textAlign: 'center', marginTop: 14 },
});