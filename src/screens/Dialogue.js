import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Font } from '../theme';
import { Btn } from '../components/UI';
import TypingIndicator from '../components/UI/TypingIndicator';
import { askDeepSeek } from '../services/api';
import ArtBackground from '../components/ArtBackground';

const THEMES = [
  { title: 'Ілюзія продуктивності', desc: 'Ми зайняті — але чи рухаємось вперед? У чому різниця між активністю і прогресом?' },
  { title: 'Ціна визначеності', desc: 'Чому ми віддаємо перевагу впевненій брехні над незручною правдою?' },
  { title: 'Хто приймає твої рішення?', desc: 'Наскільки твої вибори дійсно твої — а не продукт середовища і втоми?' },
  { title: 'Складність як привілей', desc: 'Здатність переносити невизначеність — навичка чи риса характеру?' },
  { title: 'Провал як дані', desc: 'Що якщо невдача — не те, чого уникають, а те, що читають?' },
  { title: 'Коли мовчання розумніше слів', desc: 'У яких ситуаціях відмова відповідати — найсильніша відповідь?' },
];

const SYS = (theme) =>
  `Ти JARVIS — інтелектуальний співрозмовник, який практикує сократівський метод. Тема: "${theme}". Правила: кожна відповідь закінчується ОДНИМ питанням, що поглиблює тему; вказуй на суперечності; не погоджуйся легко; 2-3 речення + питання. Мова: українська.`;

export default function Dialogue() {
  const [theme] = useState(() => THEMES[Math.floor(Math.random() * THEMES.length)]);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [useR1, setUseR1] = useState(false);
  
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Автоскрол до останнього повідомлення
  useEffect(() => {
    if (scrollRef.current && msgs.length > 0) {
      setTimeout(() => scrollRef.current.scrollToEnd({ animated: true }), 100);
    }
  }, [msgs]);

  async function start() {
    setStarted(true);
    setLoading(true);
    try {
      const reply = await askDeepSeek(
        [{ role: 'user', content: 'Почни діалог — одне відкриваюче питання за темою.' }],
        SYS(theme.title), useR1
      );
      setMsgs([{ who: 'j', txt: reply }]);
      // Фокус на поле вводу після початку
      setTimeout(() => inputRef.current?.focus(), 300);
    } catch (e) { 
      console.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function send() {
    if (!input.trim() || loading) return;
    const txt = input.trim();
    setInput('');
    
    const userMsg = { who: 'u', txt };
    const next = [...msgs, userMsg];
    setMsgs(next);
    setLoading(true);
    
    try {
      const api = next.map(m => ({ 
        role: m.who === 'j' ? 'assistant' : 'user', 
        content: m.txt 
      }));
      const reply = await askDeepSeek(api, SYS(theme.title), useR1);
      setMsgs(prev => [...prev, { who: 'j', txt: reply }]);
    } catch (e) { 
      console.error(e.message);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  // Безпечний масив повідомлень
  const safeMsgs = Array.isArray(msgs) ? msgs : [];

  return (
    <ArtBackground>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        keyboardVerticalOffset={90}
      >
        <ScrollView 
          ref={scrollRef}
          contentContainerStyle={s.wrap} 
          showsVerticalScrollIndicator={false} 
          keyboardShouldPersistTaps="handled"
        >
          <LinearGradient colors={['#1a1422','#0f0f1a']} style={s.card} start={{x:0,y:0}} end={{x:1,y:1}}>
            <Text style={s.label}>ТЕМА ДНЯ</Text>
            <Text style={s.title}>{theme?.title || ''}</Text>
            <Text style={s.desc}>{theme?.desc || ''}</Text>
            {!started && (
              <View style={s.r1row}>
                <View>
                  <Text style={s.r1label}>DeepSeek R1</Text>
                  <Text style={s.r1desc}>Глибокий аналіз (повільніше)</Text>
                </View>
                <Switch 
                  value={useR1} 
                  onValueChange={setUseR1} 
                  trackColor={{ false: Colors.border2, true: Colors.purple + '80' }} 
                  thumbColor={useR1 ? Colors.purple : Colors.muted} 
                />
              </View>
            )}
          </LinearGradient>

          {!started ? (
            <Btn label="Розпочати діалог →" onPress={start} />
          ) : (
            <>
              {safeMsgs.map((m, i) => (
                <View key={i} style={[s.row, m.who === 'u' && s.rowU]}>
                  <View style={[s.av, m.who === 'u' ? s.avU : s.avJ]}>
                    <Text style={m.who === 'j' ? s.avTxtJ : s.avTxtU}>
                      {m.who === 'j' ? 'J' : 'Я'}
                    </Text>
                  </View>
                  <View style={[s.bubble, m.who === 'u' ? s.bubU : s.bubJ]}>
                    <Text style={[s.bubTxt, m.who === 'u' && s.bubTxtU]}>
                      {m.txt || ''}
                    </Text>
                  </View>
                </View>
              ))}
              
              {loading && (
                <View style={s.row}>
                  <View style={[s.av, s.avJ]}>
                    <Text style={s.avTxtJ}>J</Text>
                  </View>
                  <View style={[s.bubble, s.bubJ]}>
                    <TypingIndicator />
                  </View>
                </View>
              )}
              
              <View style={{ height: 90 }} />
            </>
          )}
        </ScrollView>

        {started && (
          <View style={s.bar}>
            <View style={s.inputRow}>
              <TextInput
                ref={inputRef}
                style={s.input}
                placeholder="Твоя думка..."
                placeholderTextColor={Colors.muted}
                value={input}
                onChangeText={setInput}
                multiline
                maxLength={500}
                editable={!loading}
              />
              <TouchableOpacity 
                style={[s.send, (!input.trim() || loading) && s.sendOff]} 
                onPress={send} 
                disabled={!input.trim() || loading}
              >
                <Text style={s.sendTxt}>→</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </ArtBackground>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 24, paddingBottom: 20 },
  card: { borderRadius: 20, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: '#2a1f38' },
  label: { fontFamily: Font.mono, fontSize: 10, color: Colors.purple, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 },
  title: { fontFamily: Font.serif, fontSize: 22, color: Colors.text, marginBottom: 8 },
  desc: { fontFamily: Font.sans, fontSize: 13, color: Colors.textSub, lineHeight: 20 },
  r1row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.border },
  r1label: { fontFamily: Font.mono, fontSize: 11, color: Colors.purple },
  r1desc: { fontFamily: Font.sans, fontSize: 11, color: Colors.muted, marginTop: 2 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 12, alignItems: 'flex-start' },
  rowU: { flexDirection: 'row-reverse' },
  av: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  avJ: { backgroundColor: '#7c6fff15', borderWidth: 1, borderColor: '#7c6fff25' },
  avU: { backgroundColor: '#c8b89a10', borderWidth: 1, borderColor: '#c8b89a20' },
  avTxtJ: { fontFamily: Font.mono, fontSize: 11, color: Colors.purple },
  avTxtU: { fontFamily: Font.mono, fontSize: 11, color: Colors.accent },
  bubble: { flex: 1, padding: 12, borderRadius: 12 },
  bubJ: { backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border2, borderTopLeftRadius: 4 },
  bubU: { backgroundColor: '#c8b89a08', borderWidth: 1, borderColor: '#c8b89a15', borderTopRightRadius: 4 },
  bubTxt: { fontFamily: Font.sans, fontSize: 14, color: Colors.text, lineHeight: 22 },
  bubTxtU: { color: Colors.textSub },
  bar: { backgroundColor: 'transparent', paddingHorizontal: 24, paddingVertical: 12, paddingBottom: Platform.OS === 'ios' ? 28 : 12, borderTopWidth: 1, borderTopColor: Colors.border },
  inputRow: { flexDirection: 'row', gap: 8, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border2, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8, alignItems: 'flex-end' },
  input: { flex: 1, fontFamily: Font.sans, fontSize: 14, color: Colors.text, maxHeight: 80, paddingVertical: 4 },
  send: { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.purple, alignItems: 'center', justifyContent: 'center' },
  sendOff: { opacity: 0.3 },
  sendTxt: { color: '#fff', fontSize: 16 },
});