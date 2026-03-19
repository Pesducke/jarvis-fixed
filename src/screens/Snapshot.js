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
  const month = new Date().toLocaleDateString('uk-UA', { 
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
        throw new Error('Теми не визначені');
      }
      
      const text = await askDeepSeek(
        [{ role: 'user', content: `Інтереси: ${safeTopics.join(', ')}. 
Поверни ТІЛЬКИ JSON без markdown:
{
  "shifts": [
    {
      "before": "спрощений погляд",
      "after": "глибше розуміння"
    }
  ],
  "blind_spot": "провокаційна сліпа пляма одним реченням",
  "question_for_week": "глибоке питання на тиждень"
}` }],
        'Ти JARVIS — когнітивний дзеркальний асистент. Відповідай ТІЛЬКИ валідним JSON без markdown. Мова: українська.'
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
          <Text style={s.wk}>Тиждень {week} · {month}</Text>
          <Text style={s.title}>Зріз мислення</Text>
          <Text style={s.sub}>Що змінилося в твоїй голові</Text>
        </View>

        {!data && !loading && (
          <View style={s.empty}>
            <Text style={s.emptyIco}>🪞</Text>
            <Text style={s.emptyTitle}>Готовий до чесного розбору?</Text>
            <Text style={s.emptyTxt}>
              JARVIS проаналізує сліпі плями{'\n'}і зсуви в мисленні за тиждень
            </Text>
            <Btn 
              label="Показати зріз" 
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
            <SectionLabel text="Зсуви мислення" />
            {shifts.map((sh, i) => (
              <View key={i} style={s.shift}>
                <View style={s.shRow}>
                  <Text style={s.shBefore}>БУЛО</Text>
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

            <SectionLabel text="Сліпа пляма" />
            <View style={s.blind}>
              <Text style={s.blindLabel}>⚠ JARVIS помітив</Text>
              <Text style={s.blindTxt}>{data.blind_spot || ''}</Text>
            </View>

            <SectionLabel text="Питання на наступний тиждень" />
            <View style={s.qCard}>
              <Text style={s.qLabel}>ТРИМАЙ В РОЗУМІ</Text>
              <Text style={s.qTxt}>{data.question_for_week || ''}</Text>
            </View>

            <Btn 
              label="↻ Оновити зріз" 
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
                ? '↑ Сховати історію' 
                : `↓ Історія (${history.length - 1})`
              } 
              onPress={() => setShowHistory(p => !p)} 
              ghost 
              style={{ marginTop: 12 }} 
            />
            {showHistory && history.slice(1).map((h, i) => (
              <View key={i} style={s.histCard}>
                <Text style={s.histMeta}>
                  Тиждень {h.weekNumber} · {h.month}
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
    fontSize: 11, 
    color: Colors.muted, 
    textTransform: 'uppercase', 
    letterSpacing: 2, 
    marginBottom: 6 
  },
  title: { 
    fontFamily: Font.serif, 
    fontSize: 28, 
    color: Colors.text, 
    marginBottom: 4 
  },
  sub: { 
    fontFamily: Font.sans, 
    fontSize: 13, 
    color: Colors.muted 
  },
  empty: { 
    alignItems: 'center', 
    paddingVertical: 40 
  },
  emptyIco: { 
    fontSize: 40, 
    marginBottom: 16 
  },
  emptyTitle: { 
    fontFamily: Font.serif, 
    fontSize: 18, 
    color: Colors.text, 
    marginBottom: 8 
  },
  emptyTxt: { 
    fontFamily: Font.sans, 
    fontSize: 13, 
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
    fontSize: 9, 
    color: Colors.red, 
    textTransform: 'uppercase', 
    flexShrink: 0, 
    paddingTop: 2 
  },
  shAfter: { 
    fontFamily: Font.mono, 
    fontSize: 9, 
    color: Colors.green, 
    textTransform: 'uppercase', 
    flexShrink: 0, 
    paddingTop: 2 
  },
  shTxt: { 
    flex: 1, 
    fontFamily: Font.sans, 
    fontSize: 13, 
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
    fontSize: 10, 
    color: Colors.red, 
    textTransform: 'uppercase', 
    letterSpacing: 2, 
    marginBottom: 8 
  },
  blindTxt: { 
    fontFamily: Font.serifI, 
    fontSize: 15, 
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
    fontSize: 10, 
    color: Colors.accent, 
    textTransform: 'uppercase', 
    letterSpacing: 2, 
    marginBottom: 8 
  },
  qTxt: { 
    fontFamily: Font.serif, 
    fontSize: 17, 
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
    fontSize: 10, 
    color: Colors.muted, 
    marginBottom: 6 
  },
  histTxt: { 
    fontFamily: Font.serifI, 
    fontSize: 13, 
    color: Colors.textSub, 
    lineHeight: 20 
  },
});