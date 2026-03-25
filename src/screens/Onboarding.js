import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Font } from '../theme';
import { AVAILABLE_TOPICS } from '../constants/topics';
import { saveProfile } from '../services/storage';

export default function Onboarding({ onDone }) {
  const [selectedTopics, setSelectedTopics] = useState([]);

  const toggleTopic = (topic) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter(t => t !== topic));
    } else {
      if (selectedTopics.length >= 3) {
        Alert.alert('Максимум 5 тем', 'Выберите не более 5 тем для персонализации.');
        return;
      }
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const handleFinish = () => {
    if (selectedTopics.length === 0) {
      Alert.alert('Выберите темы', 'Пожалуйста, выберите хотя бы одну тему.');
      return;
    }
    const profile = {
      topics: selectedTopics,
      topicsDate: new Date().toISOString(),
    };
    saveProfile(profile).then(() => {
      onDone(profile);
    });
  };

  const renderTopic = ({ item }) => {
    const isSelected = selectedTopics.includes(item);
    return (
      <TouchableOpacity
        style={[s.topicItem, isSelected && s.topicSelected]}
        onPress={() => toggleTopic(item)}
      >
        <Text style={[s.topicText, isSelected && s.topicTextSelected]}>{item}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={['#0A0F0F', '#1E1E1E']} style={s.container}>
      <SafeAreaView style={s.safe}>
        <View style={s.content}>
          <Text style={s.title}>Выберите интересы</Text>
          <Text style={s.subtitle}>
            LEV будет подбирать темы для диалогов и новости на основе выбранных направлений.
          </Text>
          <Text style={s.counter}>Выбрано: {selectedTopics.length} / 5</Text>
          <FlatList
            data={AVAILABLE_TOPICS}
            renderItem={renderTopic}
            keyExtractor={item => item}
            numColumns={2}
            contentContainerStyle={s.list}
            columnWrapperStyle={s.columnWrapper}
          />
          <TouchableOpacity style={s.button} onPress={handleFinish}>
            <Text style={s.buttonText}>Продолжить</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontFamily: Font.serif, fontSize: 28, color: Colors.text, marginBottom: 8 },
  subtitle: { fontFamily: Font.sans, fontSize: 14, color: Colors.textSub, marginBottom: 24 },
  counter: { fontFamily: Font.mono, fontSize: 12, color: Colors.purple, marginBottom: 16 },
  list: { paddingBottom: 20 },
  columnWrapper: { justifyContent: 'space-between', marginBottom: 12 },
  topicItem: {
    backgroundColor: Colors.surface2,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '48%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border2,
  },
  topicSelected: {
    backgroundColor: Colors.purple + '20',
    borderColor: Colors.purple,
  },
  topicText: {
    fontFamily: Font.sans,
    fontSize: 14,
    color: Colors.text,
  },
  topicTextSelected: {
    color: Colors.purple,
    fontWeight: '500',
  },
  button: {
    backgroundColor: Colors.purple,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    fontFamily: Font.sans,
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});