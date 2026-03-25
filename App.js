import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import {
  DMSerifDisplay_400Regular,
  DMSerifDisplay_400Regular_Italic,
} from '@expo-google-fonts/dm-serif-display';
import { DMMono_400Regular, DMMono_500Medium } from '@expo-google-fonts/dm-mono';
import { DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans';
import { useFonts } from 'expo-font';

import { Colors, Font as F } from './src/theme';
import { getProfile, saveProfile } from './src/services/storage';
import { AVAILABLE_TOPICS } from './src/constants/topics';
import Onboarding from './src/screens/Onboarding';
import Briefing from './src/screens/Briefing';
import Dialogue from './src/screens/Dialogue';
import Snapshot from './src/screens/Snapshot';
import Recommendations from './src/screens/Recommendations';
import SplashScreen from './src/screens/SplashScreen';
import SnapshotsHistory from './src/screens/SnapshotsHistory';

const TABS = [
  { id: 'briefing', label: 'Брифинг', icon: '◎' },
  { id: 'dialogue', label: 'Диалог', icon: '◈' },
  { id: 'snapshot', label: 'Слепок', icon: '◇' },
  { id: 'recs', label: 'Подборка', icon: '◉' },
  { id: 'history', label: 'История', icon: '⌛' },
];

export default function App() {
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState('briefing');
  const [showSplash, setShowSplash] = useState(true);
  const [showTopicsModal, setShowTopicsModal] = useState(false);
  const [tempSelectedTopics, setTempSelectedTopics] = useState([]);
  const today = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

  const [fontsLoaded] = useFonts({
    DMSerifDisplay_400Regular,
    DMSerifDisplay_400Regular_Italic,
    DMMono_400Regular,
    DMMono_500Medium,
    DMSans_400Regular,
    DMSans_500Medium,
  });

  useEffect(() => {
    if (!showSplash && fontsLoaded) {
      getProfile().then(p => {
        setProfile(p);
        if (p && p.topicsDate) {
          const lastDate = new Date(p.topicsDate);
          const now = new Date();
          const diffDays = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
          if (diffDays >= 7) {
            Alert.alert(
              'Обновите интересы',
              'Прошла неделя. Хотите обновить выбранные темы?',
              [
                { text: 'Позже', style: 'cancel' },
                { text: 'Обновить', onPress: () => {
                  setTempSelectedTopics(p.topics || []);
                  setShowTopicsModal(true);
                } },
              ]
            );
          }
        }
      }).catch(console.error);
    }
  }, [showSplash, fontsLoaded]);

  const handleUpdateTopics = async () => {
    if (tempSelectedTopics.length === 0) {
      Alert.alert('Выберите темы', 'Пожалуйста, выберите хотя бы одну тему.');
      return;
    }
    const updatedProfile = {
      ...profile,
      topics: tempSelectedTopics,
      topicsDate: new Date().toISOString(),
    };
    await saveProfile(updatedProfile);
    setProfile(updatedProfile);
    setShowTopicsModal(false);
  };

  const renderTopicItem = ({ item }) => {
    const isSelected = tempSelectedTopics.includes(item);
    return (
      <TouchableOpacity
        style={[s.modalTopicItem, isSelected && s.modalTopicSelected]}
        onPress={() => {
          if (isSelected) {
            setTempSelectedTopics(prev => prev.filter(t => t !== item));
          } else {
            if (tempSelectedTopics.length >= 3) {
              Alert.alert('Максимум 3 темы', 'Выберите не более 3 тем для персонализации.');
              return;
            }
            setTempSelectedTopics(prev => [...prev, item]);
          }
        }}
      >
        <Text style={[s.modalTopicText, isSelected && s.modalTopicTextSelected]}>{item}</Text>
      </TouchableOpacity>
    );
  };

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: Colors.bg }} />;
  }

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

  return (
    <>
      <View style={s.root}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
        <SafeAreaView style={s.safe}>
          <View style={s.top}>
            <View style={s.logoRow}>
              <Text style={s.logo}>
                L<Text style={s.logoMuted}>.E.V</Text>
              </Text>
            </View>
          </View>

          <View style={s.body}>
            {tab === 'briefing' && <Briefing topics={profile.topics} />}
            {tab === 'dialogue' && <Dialogue topics={profile.topics} />}
            {tab === 'snapshot' && <Snapshot topics={profile.topics} />}
            {tab === 'recs' && <Recommendations topics={profile.topics} />}
            {tab === 'history' && <SnapshotsHistory />}
          </View>

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

      <Modal
        visible={showTopicsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTopicsModal(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalContainer}>
            <Text style={s.modalTitle}>Обновить интересы</Text>
            <Text style={s.modalSubtitle}>Выберите до 3 тем для персонализации</Text>
            <Text style={s.modalCounter}>Выбрано: {tempSelectedTopics.length} / 3</Text>
            <FlatList
              data={AVAILABLE_TOPICS}
              renderItem={renderTopicItem}
              keyExtractor={item => item}
              numColumns={2}
              contentContainerStyle={s.modalList}
              columnWrapperStyle={s.modalColumnWrapper}
            />
            <View style={s.modalButtons}>
              <TouchableOpacity style={s.modalButton} onPress={() => setShowTopicsModal(false)}>
                <Text style={s.modalButtonText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalButton, s.modalButtonSave]} onPress={handleUpdateTopics}>
                <Text style={[s.modalButtonText, { color: '#fff' }]}>Сохранить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  safe: { flex: 1 },

  logoCentered: {
    fontFamily: F.mono,
    fontSize: 20,
    letterSpacing: 2,
    color: Colors.accent,
    textAlign: 'center',
    flex: 1,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  // Стили для модального окна (добавлены)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontFamily: F.serif,
    fontSize: 24,
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontFamily: F.sans,
    fontSize: 14,
    color: Colors.textSub,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalCounter: {
    fontFamily: F.mono,
    fontSize: 12,
    color: Colors.purple,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalList: {
    paddingBottom: 20,
  },
  modalColumnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTopicItem: {
    backgroundColor: Colors.surface2,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '48%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border2,
  },
  modalTopicSelected: {
    backgroundColor: Colors.purple + '20',
    borderColor: Colors.purple,
  },
  modalTopicText: {
    fontFamily: F.sans,
    fontSize: 14,
    color: Colors.text,
  },
  modalTopicTextSelected: {
    color: Colors.purple,
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalButtonSave: {
    backgroundColor: Colors.purple,
  },
  modalButtonText: {
    fontFamily: F.sans,
    fontSize: 14,
    color: '#ccc',
  },
});