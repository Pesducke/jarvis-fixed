import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { getSnapshots, deleteSnapshot, clearSnapshots } from '../services/storage';
import { Colors, Font } from '../theme';

export default function SnapshotsHistory() {
  const [snapshots, setSnapshots] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadSnapshots = async () => {
    const data = await getSnapshots();
    setSnapshots(data);
  };

  useEffect(() => {
    loadSnapshots();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSnapshots();
    setRefreshing(false);
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Удалить срез?',
      'Это действие нельзя отменить.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            await deleteSnapshot(id);
            await loadSnapshots();
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Очистить всю историю?',
      'Все сохранённые срезы будут удалены.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Очистить',
          style: 'destructive',
          onPress: async () => {
            await clearSnapshots();
            await loadSnapshots();
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={s.card}>
      <Text style={s.date}>{item.formattedDate}</Text>
      {item.weekNumber && item.month && (
        <Text style={s.week}>Неделя {item.weekNumber} · {item.month}</Text>
      )}
      <Text style={s.blindSpot}>⚠️ {item.blind_spot}</Text>
      <Text style={s.question}>❓ {item.question_for_week}</Text>
      <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(item.id)}>
        <Text style={s.deleteText}>Удалить</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>История срезов</Text>
        {snapshots.length > 0 && (
          <TouchableOpacity onPress={handleClearAll}>
            <Text style={s.clearAll}>Очистить всё</Text>
          </TouchableOpacity>
        )}
      </View>
      {snapshots.length === 0 ? (
        <Text style={s.empty}>Нет сохранённых срезов</Text>
      ) : (
        <FlatList
          data={snapshots}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontFamily: Font.serif, color: Colors.text },
  clearAll: { fontFamily: Font.mono, fontSize: 14, color: Colors.error },
  card: {
    backgroundColor: Colors.surface2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border2,
  },
  date: { fontFamily: Font.mono, fontSize: 12, color: Colors.muted, marginBottom: 6 },
  week: { fontFamily: Font.mono, fontSize: 12, color: Colors.accent, marginBottom: 6 },
  blindSpot: { fontFamily: Font.sans, fontSize: 16, color: Colors.text, marginBottom: 8, lineHeight: 20 },
  question: { fontFamily: Font.serifI, fontSize: 15, color: Colors.textSub, marginBottom: 12, lineHeight: 18 },
  deleteBtn: { alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12, backgroundColor: Colors.error + '20', borderRadius: 6 },
  deleteText: { fontFamily: Font.mono, fontSize: 12, color: Colors.error },
  empty: { textAlign: 'center', fontFamily: Font.sans, fontSize: 16, color: Colors.muted, marginTop: 50 },
});