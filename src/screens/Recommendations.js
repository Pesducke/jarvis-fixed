import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Font } from '../theme';
import { Btn, Dots } from '../components/UI';
import TypingIndicator from '../components/UI/TypingIndicator'; // якщо хочете використовувати замість Dots
import { askDeepSeek, safeJSON } from '../services/api';
import { getCachedRecs, cacheRecs, getSavedRecs, toggleSavedRec } from '../services/storage';
import ArtBackground from '../components/ArtBackground';

// Константи з безпечним доступом
const TYPE_ICON = { book: '📚', article: '📄', video: '▶', podcast: '🎧' };
const TYPE_NAME = { book: 'Книга', article: 'Статья', video: 'Видео', podcast: 'Подкаст' };
const DIFF_COLOR = { easy: Colors.green, medium: Colors.accent, deep: Colors.purple };
const DIFF_NAME = { easy: 'Легко', medium: 'Средне', deep: 'Глубоко' };
const FILTERS = [
  { id: 'all', label: 'Всё' },
  { id: 'book', label: '📚' },
  { id: 'article', label: '📄' },
  { id: 'video', label: '▶' },
  { id: 'podcast', label: '🎧' },
];

// Допоміжні функції для безпечного доступу
const getTypeIcon = (type) => TYPE_ICON[type] || '📄';
const getTypeName = (type) => TYPE_NAME[type] || 'Материал';
const getDiffColor = (diff) => DIFF_COLOR[diff] || Colors.muted;
const getDiffName = (diff) => DIFF_NAME[diff] || diff;

export default function Recommendations({ topics }) {
  // Захист від undefined topics
  const safeTopics = Array.isArray(topics) ? topics : [];
  
  const [items, setItems] = useState([]);
  const [saved, setSaved] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showSaved, setShowSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    load();
    getSavedRecs().then(s => setSaved(Array.isArray(s) ? s : []));
  }, []);

  async function load() {
    const cached = await getCachedRecs();
    if (cached && cached.length > 0) {
      setItems(cached);
      return;
    }
    await generate();
  }

  async function generate(retryCount = 0) {
    setLoading(true);
    try {
      const text = await askDeepSeek(
        [{ role: 'user', content: `Інтереси: ${safeTopics.join(', ')}. 
Згенеруй JSON із 6 рекомендацій (2 книги, 2 статті, 1 відео, 1 подкаст) за таким форматом:
{
  "items": [
    {
      "id": "уникальный id",
      "type": "book|article|video|podcast",
      "title": "название",
      "author": "автор",
      "description": "2-3 предложения",
      "why": "почему именно этому человеку",
      "difficulty": "easy|medium|deep",
      "duration": "напр. 20 мин",
      "topic": "тема"
    }
  ]
}
   ТРЕБОВАНИЯ: только реально существующие материалы, разная сложность. Не добавляй никакого текста, только JSON.` }], 'Ты JARVIS — персональный куратор знаний. Рекомендуй только реальные материалы. Отвечай ТОЛЬКО валидным JSON. Язык: русский.', false, 2000 );

      const d = safeJSON(text);
      if (d?.items && Array.isArray(d.items) && d.items.length > 0) {
        const list = d.items.map((x, i) => ({ ...x, id: x.id || `r${i}` }));
        setItems(list);
        await cacheRecs(list);
      } else {
        throw new Error('Неверный формат ответа');
      }
    } catch (e) {
      console.error('Recommendations error:', e.message);
      if (retryCount < 2) {
        setTimeout(() => generate(retryCount + 1), 1000);
        return;
      } else {
        setItems([]);
      }
    }
    setLoading(false);
  }

  async function toggleSave(id) {
    const next = await toggleSavedRec(id);
    setSaved(Array.isArray(next) ? next : []);
  }

  function open(item) {
    const q = encodeURIComponent(`${item.title || ''} ${item.author || ''}`);
    const url = item.type === 'video' ? `https://www.youtube.com/results?search_query=${q}`
      : item.type === 'podcast' ? `https://open.spotify.com/search/${q}`
      : `https://www.google.com/search?q=${q}`;
    Linking.openURL(url);
  }

  // Оптимізована фільтрація з useMemo
  const shown = useMemo(() => {
    if (showSaved) {
      return items.filter(x => saved.includes(x.id));
    }
    if (filter === 'all') {
      return items;
    }
    return items.filter(x => x.type === filter);
  }, [items, saved, showSaved, filter]);

  // Підрахунок статистики за типами
  const typeCounts = useMemo(() => {
    const counts = { book: 0, article: 0, video: 0, podcast: 0 };
    items.forEach(item => {
      if (counts.hasOwnProperty(item.type)) counts[item.type]++;
    });
    return counts;
  }, [items]);

  return (
    <ArtBackground>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.wrap}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={generate} tintColor={Colors.accent} />}
      >
        <LinearGradient colors={['#141420','#0a0a0f']} style={s.hero} start={{x:0,y:0}} end={{x:1,y:1}}>
          <Text style={s.heroLabel}>пЕРСОНАЛЬНАЯ ПОДБОРКА</Text>
          <Text style={s.heroTitle}>Рекомендации</Text>
          <Text style={s.heroSub}>
            Под твои интересы:{' '}
            <Text style={s.heroTopics}>
              {safeTopics.slice(0,3).join(', ')}{safeTopics.length > 3 ? '...' : ''}
            </Text>
          </Text>
          {items.length > 0 && (
            <View style={s.stats}>
              {['book','article','video','podcast'].map(t => (
                <View key={t} style={s.stat}>
                  <Text style={s.statN}>{typeCounts[t]}</Text>
                  <Text style={s.statI}>{getTypeIcon(t)}</Text>
                </View>
              ))}
            </View>
          )}
        </LinearGradient>

        {/* Панель фільтрів */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.id}
              style={[s.ftab, !showSaved && filter === f.id && s.ftabOn]}
              onPress={() => { setFilter(f.id); setShowSaved(false); }}
            >
              <Text style={[s.ftabTxt, !showSaved && filter === f.id && s.ftabTxtOn]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[s.ftab, showSaved && s.ftabOn]}
            onPress={() => setShowSaved(p => !p)}
          >
            <Text style={[s.ftabTxt, showSaved && s.ftabTxtOn]}>
              ★ {saved.length || ''}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {loading && (
          <View style={s.loadWrap}>
            <TypingIndicator />
            <Text style={s.loadTxt}>Подбираю материалы для тебя...</Text>
          </View>
        )}

        {!loading && items.length === 0 && (
          <View style={s.empty}>
            <Text style={s.emptyIco}>◉</Text>
            <Text style={s.emptyTitle}>Подборка ещё не загружена</Text>
            <Btn label="Загрузить рекомендации" onPress={generate} style={{ marginTop: 16 }} />
          </View>
        )}

        {!loading && showSaved && saved.length === 0 && (
          <View style={s.empty}>
            <Text style={s.emptyIco}>☆</Text>
            <Text style={s.emptyTitle}>Нет сохранённых</Text>
            <Text style={s.emptyTxt}>Нажми ☆ на карточке, чтобы сохранить</Text>
          </View>
        )}

        {!loading && shown.length === 0 && items.length > 0 && !showSaved && (
          <View style={s.empty}>
            <Text style={s.emptyIco}>🔍</Text>
            <Text style={s.emptyTitle}>Ничего не найдено</Text>
            <Text style={s.emptyTxt}>Попробуй другой фильтр</Text>
          </View>
        )}

        {!loading && shown.map(item => {
          const isSaved = item.id ? saved.includes(item.id) : false;
          const diffColor = getDiffColor(item.difficulty);
          
          return (
            <View key={item.id} style={s.card}>
              <View style={s.cardHead}>
                <View style={s.typeTag}>
                  <Text style={s.typeIco}>{getTypeIcon(item.type)}</Text>
                  <Text style={s.typeTxt}>{getTypeName(item.type)}</Text>
                </View>
                <View style={[s.diff, { borderColor: diffColor + '50' }]}>
                  <View style={[s.diffDot, { backgroundColor: diffColor }]} />
                  <Text style={[s.diffTxt, { color: diffColor }]}>
                    {getDiffName(item.difficulty)}
                  </Text>
                </View>
              </View>
              
              <Text style={s.cardTitle}>{item.title || ''}</Text>
              <Text style={s.cardAuthor}>
                {item.author || ''}{item.duration ? ` · ${item.duration}` : ''}
              </Text>
              <Text style={s.cardDesc}>{item.description || ''}</Text>
              
              <View style={s.why}>
                <Text style={s.whyLabel}>ПОЧЕМУ ТЕБЕ</Text>
                <Text style={s.whyTxt}>{item.why || ''}</Text>
              </View>
              
              <View style={s.cardFoot}>
                <View style={s.topicTag}>
                  <Text style={s.topicTxt}>{item.topic || 'разное'}</Text>
                </View>
                <View style={s.acts}>
                  <TouchableOpacity 
                    style={[s.act, isSaved && s.actOn]} 
                    onPress={() => toggleSave(item.id)}
                  >
                    <Text style={[s.actTxt, isSaved && s.actTxtOn]}>
                      {isSaved ? '★' : '☆'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.act} onPress={() => open(item)}>
                    <Text style={s.actTxt}>↗</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}

        {!loading && items.length > 0 && !showSaved && (
          <Btn label="↻ Новая подборка" onPress={generate} ghost style={{ marginTop: 8 }} />
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </ArtBackground>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1 },
  wrap: { padding: 24, paddingBottom: 100 },
  hero: { borderRadius: 20, padding: 24, marginBottom: 14, borderWidth: 1, borderColor: Colors.border2 },
  heroLabel: { fontFamily: Font.mono, fontSize: 13, color: Colors.muted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 },
  heroTitle: { fontFamily: Font.serif, fontSize: 32, color: Colors.text, marginBottom: 6 },
  heroSub: { fontFamily: Font.sans, fontSize: 17, color: Colors.muted, lineHeight: 20 },
  heroTopics: { color: Colors.accent },
  stats: { flexDirection: 'row', gap: 20, marginTop: 16 },
  stat: { alignItems: 'center' },
  statN: { fontFamily: Font.mono, fontSize: 24, color: Colors.text },
  statI: { fontSize: 18, marginTop: 2 },
  filterRow: { gap: 6, paddingVertical: 4, marginBottom: 14 },
  ftab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  ftabOn: { borderColor: Colors.purple, backgroundColor: '#7c6fff15' },
  ftabTxt: { fontFamily: Font.mono, fontSize: 15, color: Colors.muted },
  ftabTxtOn: { color: Colors.purple },
  loadWrap: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadTxt: { fontFamily: Font.sans, fontSize: 18, color: Colors.muted },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyIco: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontFamily: Font.serif, fontSize: 22, color: Colors.text, marginBottom: 6 },
  emptyTxt: { fontFamily: Font.sans, fontSize: 17, color: Colors.muted },
  card: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 16, marginBottom: 10 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  typeTag: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  typeIco: { fontSize: 17 },
  typeTxt: { fontFamily: Font.mono, fontSize: 14, color: Colors.muted, textTransform: 'uppercase', letterSpacing: 1 },
  diff: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3 },
  diffDot: { width: 4, height: 4, borderRadius: 2 },
  diffTxt: { fontFamily: Font.mono, fontSize: 14 },
  cardTitle: { fontFamily: Font.serif, fontSize: 21, color: Colors.text, lineHeight: 24, marginBottom: 3 },
  cardAuthor: { fontFamily: Font.mono, fontSize: 14, color: Colors.muted, marginBottom: 10 },
  cardDesc: { fontFamily: Font.sans, fontSize: 17, color: Colors.textSub, lineHeight: 20, marginBottom: 12 },
  why: { backgroundColor: Colors.surface2, borderRadius: 8, padding: 10, marginBottom: 12, borderLeftWidth: 2, borderLeftColor: Colors.purple+'60' },
  whyLabel: { fontFamily: Font.mono, fontSize: 13, color: Colors.purple, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },
  whyTxt: { fontFamily: Font.sans, fontSize: 16, color: Colors.textSub, lineHeight: 18 },
  cardFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topicTag: { backgroundColor: Colors.surface2, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: Colors.border2 },
  topicTxt: { fontFamily: Font.mono, fontSize: 14, color: Colors.muted },
  acts: { flexDirection: 'row', gap: 6 },
  act: { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border2, alignItems: 'center', justifyContent: 'center' },
  actOn: { borderColor: Colors.accent+'60', backgroundColor: Colors.accent+'10' },
  actTxt: { fontSize: 18, color: Colors.muted },
  actTxtOn: { color: Colors.accent },
});