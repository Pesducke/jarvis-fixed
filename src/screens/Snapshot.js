import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Colors, Font } from '../theme';
import { Btn, SectionLabel } from '../components/UI';
import TypingIndicator from '../components/UI/TypingIndicator';
import ArtBackground from '../components/ArtBackground';
import { askDeepSeek, safeJSON } from '../services/api';
import { saveSnapshot, getSnapshots } from '../services/storage';

export default function Snapshot({ topics }) {
  // Захист від undefined topics
  const safeTopics = Array.isArray(topics) ? topics : [];
  
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  const week = Math.ceil(new Date().getDate() / 7);
  const month = new Date().toLocaleDateString('uk-RU', { 
    month: 'long', 
    year: 'numeric' 
  });

  useEffect(() => { 
    getSnapshots().then(h => setHistory(Array.isArray(h) ? h : [])); 
  }, []);

  const generate = useCallback(async () => {
    setLoading(true);
    try {
      if (safeTopics.length === 0) {
        throw new Error('Темы не определены');
      }
      
      const text = await askDeepSeek(
        [{ role: 'user', content: `Интересы: ${safeTopics.join(', ')}. 
Верни ТОЛЬКО JSON без markdown:
{
  "shifts": [
    {
      "before": "упрощённый взгляд",
      "after": "более глубокое понимание"
    }
  ],
  "blind_spot": "Провокационная слепая зона одним предложением",
  "question_for_week": "глубокий вопрос на неделю"
}` }],
        'Ты JARVIS — когнитивный зеркальный ассистент. Отвечай ТОЛЬКО валидным JSON без markdown. Язык: русский.'
      );
      
      const d = safeJSON(text);
      if (d) {
        setData(d);
        await saveSnapshot({ 
          weekNumber: week, 
          month, 
          ...d, 
          generatedAt: new Date().toISOString() 
        });
        const h = await getSnapshots();
        setHistory(Array.isArray(h) ? h : []);
      }
    } catch (e) { 
      console.error(e.message); 
    }
    setLoading(false);
  }, [week, month, safeTopics]);

  // Безпечний масив shifts
  const shifts = data?.shifts || [];

  return (
    <ArtBackground>
      <ScrollView 
        style={s.scroll} 
        contentContainerStyle={s.wrap} 
        showsVerticalScrollIndicator={false}
      >
        <View style={s.head}>
          <Text style={s.wk}>Неделя {week} · {month}</Text>
          <Text style={s.title}>Срез мышления</Text>
          <Text style={s.sub}>Что изменилось в твоей голове</Text>
        </View>

        {!data && !loading && (
          <View style={s.empty}>
            <Text style={s.emptyIco}>🪞</Text>
            <Text style={s.emptyTitle}>Готов к честному разбору?</Text>
            <Text style={s.emptyTxt}>
              JARVIS проанализирует слепые зоны.{'\n'}і сдвиги в мышлении за неделю
            </Text>
            <Btn 
              label="Показать срез" 
              onPress={generate} 
              style={{ marginTop: 20 }} 
            />
          </View>
        )}

        {loading && (
          <View style={s.empty}>
            <Text style={s.emptyIco}>⏳</Text>
            <Text style={s.emptyTitle}>Аналізую патерни...</Text>
            <TypingIndicator />
          </View>
        )}

        {data && !loading && (
          <>
            <SectionLabel text="Сдвиги мышления" />
            {shifts.map((sh, i) => (
              <View key={i} style={s.shift}>
                <View style={s.shRow}>
                  <Text style={s.shBefore}>БЫЛО</Text>
                  <Text style={s.shTxt}>{sh.before || ''}</Text>
                </View>
                <View style={s.shDiv} />
                <View style={s.shRow}>
                  <Text style={s.shAfter}>СТАЛО</Text>
                  <Text style={[s.shTxt, { color: Colors.text }]}>
                    {sh.after || ''}
                  </Text>
                </View>
              </View>
            ))}

            <SectionLabel text="Слепая зона" />
            <View style={s.blind}>
              <Text style={s.blindLabel}>⚠ JARVIS помітив</Text>
              <Text style={s.blindTxt}>{data.blind_spot || ''}</Text>
            </View>

            <SectionLabel text="Вопрос на следующую неделю" />
            <View style={s.qCard}>
              <Text style={s.qLabel}>ИМЕЙ В ВИДУ</Text>
              <Text style={s.qTxt}>{data.question_for_week || ''}</Text>
            </View>

            <Btn 
              label="↻ Обновить сейчас" 
              onPress={generate} 
              loading={loading} 
              ghost 
              style={{ marginTop: 12 }} 
            />
          </>
        )}

        {history.length > 1 && (
          <>
            <Btn 
              label={showHistory 
                ? '↑ Спрятать историю' 
                : `↓ История (${history.length - 1})`
              } 
              onPress={() => setShowHistory(p => !p)} 
              ghost 
              style={{ marginTop: 12 }} 
            />
            {showHistory && history.slice(1).map((h, i) => (
              <View key={i} style={s.histCard}>
                <Text style={s.histMeta}>
                  Неделя {h.weekNumber} · {h.month}
                </Text>
                <Text style={s.histTxt}>"{h.blind_spot || ''}"</Text>
              </View>
            ))}
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </ArtBackground>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1 },
  wrap: { padding: 24, paddingBottom: 100 },
  head: { alignItems: 'center', paddingVertical: 20 },
  wk: { 
    fontFamily: Font.mono, 
    fontSize: 15, 
    color: Colors.muted, 
    textTransform: 'uppercase', 
    letterSpacing: 2, 
    marginBottom: 6 
  },
  title: { 
    fontFamily: Font.serif, 
    fontSize: 32, 
    color: Colors.text, 
    marginBottom: 4 
  },
  sub: { 
    fontFamily: Font.sans, 
    fontSize: 17, 
    color: Colors.muted 
  },
  empty: { 
    alignItems: 'center', 
    paddingVertical: 40 
  },
  emptyIco: { 
    fontSize: 44, 
    marginBottom: 16 
  },
  emptyTitle: { 
    fontFamily: Font.serif, 
    fontSize: 22, 
    color: Colors.text, 
    marginBottom: 8 
  },
  emptyTxt: { 
    fontFamily: Font.sans, 
    fontSize: 17, 
    color: Colors.muted, 
    textAlign: 'center', 
    lineHeight: 20 
  },
  shift: { 
    backgroundColor: Colors.surface, 
    borderWidth: 1, 
    borderColor: Colors.border, 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 8 
  },
  shRow: { 
    flexDirection: 'row', 
    gap: 10, 
    alignItems: 'flex-start' 
  },
  shBefore: { 
    fontFamily: Font.mono, 
    fontSize: 13, 
    color: Colors.red, 
    textTransform: 'uppercase', 
    flexShrink: 0, 
    paddingTop: 2 
  },
  shAfter: { 
    fontFamily: Font.mono, 
    fontSize: 13, 
    color: Colors.green, 
    textTransform: 'uppercase', 
    flexShrink: 0, 
    paddingTop: 2 
  },
  shTxt: { 
    flex: 1, 
    fontFamily: Font.sans, 
    fontSize: 17, 
    color: Colors.textSub, 
    lineHeight: 20 
  },
  shDiv: { 
    height: 1, 
    backgroundColor: Colors.border, 
    marginVertical: 10 
  },
  blind: { 
    backgroundColor: '#1a0f0f', 
    borderWidth: 1, 
    borderColor: '#3a1f1f', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 8 
  },
  blindLabel: { 
    fontFamily: Font.mono, 
    fontSize: 14, 
    color: Colors.red, 
    textTransform: 'uppercase', 
    letterSpacing: 2, 
    marginBottom: 8 
  },
  blindTxt: { 
    fontFamily: Font.serifI, 
    fontSize: 19, 
    color: Colors.text, 
    lineHeight: 24 
  },
  qCard: { 
    backgroundColor: Colors.surface2, 
    borderWidth: 1, 
    borderColor: Colors.border2, 
    borderRadius: 12, 
    padding: 16 
  },
  qLabel: { 
    fontFamily: Font.mono, 
    fontSize: 14, 
    color: Colors.accent, 
    textTransform: 'uppercase', 
    letterSpacing: 2, 
    marginBottom: 8 
  },
  qTxt: { 
    fontFamily: Font.serif, 
    fontSize: 21, 
    color: Colors.text, 
    lineHeight: 26 
  },
  histCard: { 
    backgroundColor: Colors.surface, 
    borderWidth: 1, 
    borderColor: Colors.border, 
    borderRadius: 10, 
    padding: 14, 
    marginBottom: 8 
  },
  histMeta: { 
    fontFamily: Font.mono, 
    fontSize: 14, 
    color: Colors.muted, 
    marginBottom: 6 
  },
  histTxt: { 
    fontFamily: Font.serifI, 
    fontSize: 17, 
    color: Colors.textSub, 
    lineHeight: 20 
  },
});