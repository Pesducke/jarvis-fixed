import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Font } from '../theme';
import { Btn } from '../components/UI';
import TypingIndicator from '../components/UI/TypingIndicator';
import ArtBackground from '../components/ArtBackground';
import { askDeepSeek, safeJSON } from '../services/api'; // safeJSON має бути в api.js
import { getCachedBriefing, cacheBriefing, getStreak } from '../services/storage';

export default function Briefing({ topics }) {
  // Захист від undefined topics
  const safeTopics = Array.isArray(topics) ? topics : [];
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [streak, setStreak] = useState(0);
  
  const today = new Date().toLocaleDateString('uk-RU', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });

  useEffect(() => {
    load();
    getStreak().then(setStreak).catch(() => setStreak(0));
  }, []);

  async function load() {
    try {
      const cached = await getCachedBriefing();
      if (cached) {
        setData(cached);
        return;
      }
    } catch (e) {
      console.warn('Cache read failed', e);
    }
    await generate();
  }

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (safeTopics.length === 0) {
        throw new Error('Темы не определены');
      }
      
      const text = await askDeepSeek(
        [{ role: 'user', content: `Сегодня: ${today}. Интересы пользователя: ${safeTopics.join(', ')}. 
Создай утренний интеллектуальный брифинг, который расширяет кругозор. 
Включи 3-5 ключевых событий дня из разных сфер (наука, технологии, культура, общество, спорт и т.д.). 
На их основе сформируй JSON без markdown:
{
  "headline": "Заголовок из 8-12 слов, интригующий",
  "summary": "2-3 предложения о самом важном в мире сегодня (упомяни разные сферы)",
  "insight": "1-2 предложения — неочевидная связь или глубокий контекст (может выходить за пределы привычных тем)",
  "question": "Один провокационный запрос на день",
  "topic_tag": "Одно слово, описывающее главную тему дня"
}` }],
        'Ты JARVIS — утренний интеллектуальный ассистент, который расширяет кругозор. Отвечай ТОЛЬКО валидным JSON без markdown. Язык: русский.'
      );
      
      console.log('Raw response from DeepSeek:', text); // додано для налагодження
      
      const d = safeJSON(text);
      if (d) {
        setData(d);
        await cacheBriefing(d).catch(e => console.warn('Cache save failed', e));
      } else {
        console.error('Failed to parse JSON. Raw response:', text);
        throw new Error('Неверный формат ответа');
      }
    } catch (e) {
      console.error('Briefing error:', e.message);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [today, safeTopics]);

  return (
    <ArtBackground>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.wrap}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={loading} 
            onRefresh={generate} 
            tintColor={Colors.accent} 
          />
        }
      >
        {streak > 1 && (
          <View style={s.streak}>
            <Text style={s.streakTxt}>🔥 {streak} дней подряд</Text>
          </View>
        )}

        <LinearGradient 
          colors={['#1a1a28','#0f0f1a']} 
          style={s.hero} 
          start={{x:0,y:0}} 
          end={{x:1,y:1}}
        >
          <Text style={s.date}>{today}</Text>

          {loading ? (
            <>
              <Text style={s.headingMuted}>Анализирую события...</Text>
              <TypingIndicator />
            </>
          ) : error ? (
            <>
              <Text style={s.heading}>Не удалось получить брифинг</Text>
              <Text style={s.body}>{error}</Text>
              <Btn 
                label="Попробовать снова" 
                onPress={generate} 
                ghost 
                style={{ marginTop: 16 }} 
              />
            </>
          ) : data ? (
            <>
              <Text style={s.heading}>{data.headline || ''}</Text>
              {data.topic_tag ? (
                <View style={s.tag}>
                  <Text style={s.tagTxt}>{data.topic_tag}</Text>
                </View>
              ) : null}
              <Text style={s.body}>{data.summary || ''}</Text>
              <View style={s.insight}>
                <Text style={s.insightLabel}>КОНТЕКСТ</Text>
                <Text style={s.insightTxt}>{data.insight || ''}</Text>
              </View>
              <View style={s.qBlock}>
                <Text style={s.qLabel}>ВОПРОС ДНЯ</Text>
                <Text style={s.qTxt}>{data.question || ''}</Text>
              </View>
            </>
          ) : (
            <>
              <Text style={s.heading}>Доброе утро.{'\n'}Что важно знать?</Text>
              <Text style={s.body}>
                Персональный брифинг по темам: {safeTopics.join(', ') || 'не выбрано'}
              </Text>
            </>
          )}
        </LinearGradient>

        <Btn
          label={data ? '↻ Обновить брифинг' : '✦ Создать брифинг'}
          onPress={generate}
          loading={loading}
          ghost
        />

        <View style={s.modelBadge}>
          <Text style={s.modelTxt}>⚡ Powered by DeepSeek</Text>
        </View>
      </ScrollView>
    </ArtBackground>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1 },
  wrap: { padding: 24, paddingBottom: 100 },
  streak: { 
    backgroundColor: '#ff6b0015', 
    borderWidth: 1, 
    borderColor: '#ff6b0030', 
    borderRadius: 100, 
    paddingHorizontal: 14, 
    paddingVertical: 6, 
    alignSelf: 'flex-start', 
    marginBottom: 12 
  },
  streakTxt: { 
    fontFamily: Font.mono, 
    fontSize: 16, 
    color: '#ff9040' 
  },
  hero: { 
    borderRadius: 20, 
    padding: 24, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: Colors.border2 
  },
  date: { 
    fontFamily: Font.mono, 
    fontSize: 14, 
    color: Colors.muted, 
    textTransform: 'uppercase', 
    letterSpacing: 2, 
    marginBottom: 12 
  },
  heading: { 
    fontFamily: Font.serif, 
    fontSize: 28, 
    lineHeight: 32, 
    color: Colors.text, 
    marginBottom: 10 
  },
  headingMuted: { 
    fontFamily: Font.serif, 
    fontSize: 24, 
    color: Colors.muted, 
    marginBottom: 12 
  },
  tag: { 
    borderWidth: 1, 
    borderColor: '#7c6fff40', 
    borderRadius: 100, 
    paddingHorizontal: 10, 
    paddingVertical: 3, 
    alignSelf: 'flex-start', 
    marginBottom: 10 
  },
  tagTxt: { 
    fontFamily: Font.mono, 
    fontSize: 14, 
    color: Colors.purple, 
    textTransform: 'uppercase', 
    letterSpacing: 1 
  },
  body: { 
    fontFamily: Font.sans, 
    fontSize: 18, 
    color: Colors.textSub, 
    lineHeight: 22 
  },
  insight: { 
    borderLeftWidth: 2, 
    borderLeftColor: Colors.purple, 
    paddingLeft: 14, 
    marginTop: 14 
  },
  insightLabel: { 
    fontFamily: Font.mono, 
    fontSize: 13, 
    color: Colors.purple, 
    textTransform: 'uppercase', 
    letterSpacing: 1.5, 
    marginBottom: 4 
  },
  insightTxt: { 
    fontFamily: Font.sans, 
    fontSize: 17, 
    color: Colors.text, 
    lineHeight: 20 
  },
  qBlock: { 
    backgroundColor: Colors.surface2, 
    borderWidth: 1, 
    borderColor: Colors.border2, 
    borderRadius: 12, 
    padding: 14, 
    marginTop: 14 
  },
  qLabel: { 
    fontFamily: Font.mono, 
    fontSize: 13, 
    color: Colors.green, 
    textTransform: 'uppercase', 
    letterSpacing: 2, 
    marginBottom: 6 
  },
  qTxt: { 
    fontFamily: Font.serifI, 
    fontSize: 18, 
    color: Colors.text, 
    lineHeight: 21 
  },
  modelBadge: { 
    alignItems: 'center', 
    marginTop: 16 
  },
  modelTxt: { 
    fontFamily: Font.mono, 
    fontSize: 14, 
    color: Colors.muted, 
    letterSpacing: 1 
  },
});