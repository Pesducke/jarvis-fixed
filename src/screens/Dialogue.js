import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Font } from '../theme';
import { Btn } from '../components/UI';
import TypingIndicator from '../components/UI/TypingIndicator';
import { askDeepSeek } from '../services/api';
import ArtBackground from '../components/ArtBackground';

const THEMES = [
  { title: 'Иллюзия продуктивности', desc: 'Мы заняты — но движемся ли мы вперед? В чем разница между активностью и прогрессом?' },
  { title: 'Цена определенности', desc: 'Почему мы предпочитаем уверенную ложь неудобной правде?' },
  { title: 'Кто принимает твои решения?', desc: 'Насколько твой выбор действительно твой — а не продукт среды и усталости?' },
  { title: 'Сложность как привилегия', desc: 'Способность переносить неопределенность — навык или черта характера?' },
  { title: 'Провал как данные', desc: 'Что если неудача — не то, чего избегают, а то, что читают?' },
  { title: 'Когда молчание разумнее слов', desc: 'В каких ситуациях отказ отвечать — самый сильный ответ?' },
];

const SYS = (theme) =>
  `Ты JARVIS — интеллектуальный собеседник, который практикует сократический метод. Тема: "${theme}". Правила: каждый ответ заканчивается ОДНИМ вопросом, углубляющим тему; указывай на противоречия; не соглашайся легко; 2-3 предложения + вопрос. Язык: русский.`;

export default function Dialogue() {
  const [theme] = useState(() => THEMES[Math.floor(Math.random() * THEMES.length)]);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Автоскрол до последнего сообщения
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
        [{ role: 'user', content: 'Начни диалог — один открытый вопрос по теме.' }],
        SYS(theme.title)
        // третий аргумент (useR1) удалён
      );
      setMsgs([{ who: 'j', txt: reply }]);
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
      const reply = await askDeepSeek(api, SYS(theme.title));
      setMsgs(prev => [...prev, { who: 'j', txt: reply }]);
    } catch (e) { 
      console.error(e.message);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

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
            {/* Блок с переключателем R1 удалён */}
          </LinearGradient>

          {!started ? (
            <Btn label="Начать диалог →" onPress={start} />
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
                placeholder="Твоя мысль..."
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
  label: { fontFamily: Font.mono, fontSize: 14, color: Colors.purple, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 },
  title: { fontFamily: Font.serif, fontSize: 26, color: Colors.text, marginBottom: 8 },
  desc: { fontFamily: Font.sans, fontSize: 17, color: Colors.textSub, lineHeight: 20 },
  // стиль r1row удалён
  row: { flexDirection: 'row', gap: 10, marginBottom: 12, alignItems: 'flex-start' },
  rowU: { flexDirection: 'row-reverse' },
  av: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  avJ: { backgroundColor: '#7c6fff15', borderWidth: 1, borderColor: '#7c6fff25' },
  avU: { backgroundColor: '#c8b89a10', borderWidth: 1, borderColor: '#c8b89a20' },
  avTxtJ: { fontFamily: Font.mono, fontSize: 15, color: Colors.purple },
  avTxtU: { fontFamily: Font.mono, fontSize: 15, color: Colors.accent },
  bubble: { flex: 1, padding: 12, borderRadius: 12 },
  bubJ: { backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border2, borderTopLeftRadius: 4 },
  bubU: { backgroundColor: '#c8b89a08', borderWidth: 1, borderColor: '#c8b89a15', borderTopRightRadius: 4 },
  bubTxt: { fontFamily: Font.sans, fontSize: 18, color: Colors.text, lineHeight: 22 },
  bubTxtU: { color: Colors.textSub },
  bar: { backgroundColor: 'transparent', paddingHorizontal: 24, paddingVertical: 12, paddingBottom: Platform.OS === 'ios' ? 28 : 12, borderTopWidth: 1, borderTopColor: Colors.border },
  inputRow: { flexDirection: 'row', gap: 8, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border2, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8, alignItems: 'flex-end' },
  input: { flex: 1, fontFamily: Font.sans, fontSize: 18, color: Colors.text, maxHeight: 80, paddingVertical: 4 },
  send: { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.purple, alignItems: 'center', justifyContent: 'center' },
  sendOff: { opacity: 0.3 },
  sendTxt: { color: '#fff', fontSize: 20 },
});