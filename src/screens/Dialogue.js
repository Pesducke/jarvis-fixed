import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Font } from '../theme';
import { Btn } from '../components/UI';
import TypingIndicator from '../components/UI/TypingIndicator';
import { askDeepSeek } from '../services/api';
import ArtBackground from '../components/ArtBackground';
import { saveDialogue } from '../services/dialogueStorage';
import { ALL_PERSONALITIES, DEFAULT_PERSONALITY } from '../constants/personalities';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveTheme, getThemeHistory } from '../services/themeHistory';
// ==================== ДОБАВЛЕНО ДЛЯ ГОЛОСА ====================
import { 
  speakText, 
  isVoiceEnabled, 
  setVoiceEnabled, 
  loadVoiceSettings,
  initVoice 
} from '../services/voice';
// ==============================================================

// Статический массив тем для fallback (если генерация не удастся)
const STATIC_THEMES = [
  { title: 'Иллюзия продуктивности', desc: 'Мы заняты — но движемся ли мы вперед? В чем разница между активностью и прогрессом?' },
  { title: 'Цена определенности', desc: 'Почему мы предпочитаем уверенную ложь неудобной правде?' },
  { title: 'Кто принимает твои решения?', desc: 'Насколько твои выборы действительно твои — а не продукт среды и усталости?' },
  { title: 'Сложность как привилегия', desc: 'Способность переносить неопределенность — навык или черта характера?' },
  { title: 'Провал как данные', desc: 'Что если неудача — не то, чего избегают, а то, что читают?' },
  { title: 'Когда молчание умнее слов', desc: 'В каких ситуациях отказ отвечать — сильнейший ответ?' },
];

// Ключи для хранения настроек в AsyncStorage
const STORAGE_PROVOCATEUR_KEY = '@Jarvis:provocateur';
const STORAGE_PERSONALITY_KEY = '@Jarvis:personality';

export default function Dialogue({ topics = [] }) {
  // Состояние для темы (генерируется динамически)
  const [theme, setTheme] = useState(null);
  const [generatingTheme, setGeneratingTheme] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);

  // Состояния настроек
  const [provocateur, setProvocateur] = useState(false);
  const [personalityId, setPersonalityId] = useState('default');
  const [modalVisible, setModalVisible] = useState(false);
  const [summary, setSummary] = useState('');
  const [summarizing, setSummarizing] = useState(false);

  // ==================== ДОБАВЛЕНО ДЛЯ ГОЛОСА ====================
  const [voiceEnabled, setVoiceEnabledState] = useState(false);
  // ==============================================================

  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Загрузка сохранённых настроек
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedProvocateur = await AsyncStorage.getItem(STORAGE_PROVOCATEUR_KEY);
        if (savedProvocateur !== null) setProvocateur(savedProvocateur === 'true');
        const savedPersonality = await AsyncStorage.getItem(STORAGE_PERSONALITY_KEY);
        if (savedPersonality !== null) setPersonalityId(savedPersonality);
        // ==================== ДОБАВЛЕНО ====================
        await loadVoiceSettings();
        await initVoice();
        setVoiceEnabledState(isVoiceEnabled());
        // ====================================================
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, []);

  // Сохранение настроек при изменении
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_PROVOCATEUR_KEY, provocateur.toString()).catch(console.error);
  }, [provocateur]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_PERSONALITY_KEY, personalityId).catch(console.error);
  }, [personalityId]);

  // ==================== ДОБАВЛЕНО ДЛЯ СОХРАНЕНИЯ ГОЛОСА ====================
  useEffect(() => {
    setVoiceEnabled(voiceEnabled).catch(console.error);
  }, [voiceEnabled]);
  // ========================================================================

  // Автоскролл
  useEffect(() => {
    if (scrollRef.current && msgs.length > 0) {
      setTimeout(() => scrollRef.current.scrollToEnd({ animated: true }), 100);
    }
  }, [msgs]);

  // Генерация темы через DeepSeek на основе интересов
  const generateTopicFromInterests = async () => {
  setGeneratingTheme(true);
  try {
    const interestsStr = topics.length ? topics.join(', ') : 'разные темы';
    const history = await getThemeHistory();
    const historyStr = history.length ? `\nНедавние темы (не повторяй их): ${history.join(', ')}` : '';
    
    const prompt = `Ты — креативный помощник. Придумай одну глубокую философскую или психологическую тему для диалога. 
Интересы пользователя: ${interestsStr}.${historyStr}
Формат ответа: строго JSON: {"title": "Название темы", "desc": "Краткое описание, почему это важно"}. 
Название должно быть ёмким, а описание — метакогниция.`;

    const result = await askDeepSeek([], prompt);
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      await saveTheme(parsed.title);
      return { title: parsed.title, desc: parsed.desc };
    }
    throw new Error('Некорректный формат ответа');
  } catch (error) {
    console.error('Ошибка генерации темы:', error);
    const fallback = STATIC_THEMES[Math.floor(Math.random() * STATIC_THEMES.length)];
    await saveTheme(fallback.title);
    return { title: fallback.title, desc: fallback.desc };
  } finally {
    setGeneratingTheme(false);
  }
};

  // Функция построения системного промпта с учётом темы
  const buildSystemPrompt = (themeTitle) => {
    const selectedPersonality = ALL_PERSONALITIES.find(p => p.id === personalityId) || DEFAULT_PERSONALITY;
    let prompt = selectedPersonality.prompt.replace('{theme}', themeTitle);

    // Общее правило объяснения понятий
    prompt += `\n\nВажное правило: если в диалоге встречается новое слово или понятие, объясняй его не сухим определением, а через историю или реальный пример. Можно использовать технику Феймана`;

    // Провокатор
    if (provocateur) {
      prompt += `\n\nДополнительная инструкция: Ты – провокатор. Оспаривай всё, что говорит пользователь. Играй роль адвоката дьявола. Задавай провокационные вопросы, заставляй обосновывать мнение. Не соглашайся легко, ищи слабые места в аргументах.`;
    }

    return prompt;
  };

  // Запуск диалога (генерируем тему, если её ещё нет)
  const start = async () => {
    // Если тема ещё не сгенерирована, генерируем
    let currentTheme = theme;
    if (!currentTheme) {
      const newTheme = await generateTopicFromInterests();
      setTheme(newTheme);
      currentTheme = newTheme;
    }

    setStarted(true);
    setLoading(true);
    try {
      const systemPrompt = buildSystemPrompt(currentTheme.title);
      const reply = await askDeepSeek(
        [{ role: 'user', content: 'Начни диалог — один открывающий вопрос по теме.' }],
        systemPrompt
      );
      setMsgs([{ who: 'j', txt: reply }]);
      // ==================== ДОБАВЛЕНО: ОЗВУЧИВАНИЕ ====================
      if (voiceEnabled) {
        await speakText(reply);
      }
      // ==============================================================
      setTimeout(() => inputRef.current?.focus(), 300);
    } catch (e) {
      console.error(e.message);
      Alert.alert('Ошибка', 'Не удалось начать диалог');
    } finally {
      setLoading(false);
    }
  };

  // Отправка сообщения
  const send = async () => {
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
      const systemPrompt = buildSystemPrompt(theme.title);
      const reply = await askDeepSeek(api, systemPrompt);
      setMsgs(prev => [...prev, { who: 'j', txt: reply }]);
      // ==================== ДОБАВЛЕНО: ОЗВУЧИВАНИЕ ====================
      if (voiceEnabled) {
        await speakText(reply);
      }
      // ==============================================================
    } catch (e) {
      console.error(e.message);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  // Завершение диалога
  const handleFinish = async () => {
    if (msgs.length === 0) {
      Alert.alert('Ошибка', 'Нет сообщений для сохранения.');
      return;
    }

    setSummarizing(true);
    try {
      const conversationText = msgs.map(m => `${m.who === 'j' ? 'LEV' : 'Вы'}: ${m.txt}`).join('\n');
      const summaryPrompt = `Сделай краткое резюме этого разговора (3-5 предложений). Выдели главную идею и итоговый вопрос, который остался открытым.\n\nРазговор:\n${conversationText}`;
      const summaryText = await askDeepSeek([], summaryPrompt);
      setSummary(summaryText);
      setModalVisible(true);
    } catch (error) {
      console.error('Ошибка при создании резюме:', error);
      Alert.alert('Ошибка', 'Не удалось создать резюме');
    } finally {
      setSummarizing(false);
    }
  };

  const handleSaveDialogue = async () => {
    console.log('handleSaveDialogue called');
    const firstUserMsg = msgs.find(m => m.who === 'u')?.txt || msgs[0]?.txt || 'Диалог';
    const title = `${new Date().toLocaleDateString('ru-RU')} – ${firstUserMsg.substring(0, 30)}${firstUserMsg.length > 30 ? '…' : ''}`;
    const fullText = msgs.map(m => `${m.who === 'j' ? 'LEV' : 'Вы'}: ${m.txt}`).join('\n\n');
    await saveDialogue(title, fullText);
    Alert.alert('Сохранено', 'Диалог сохранён в историю');
    setModalVisible(false);
  };

  // Генерация новой темы (с возможностью сброса диалога)
  const regenerateTheme = async () => {
    if (loading || generatingTheme) return;
    setGeneratingTheme(true);
    try {
      const newTheme = await generateTopicFromInterests();
      setTheme(newTheme);
      Alert.alert(
        'Новая тема',
        'Тема успешно обновлена. Начать новый диалог?',
        [
          { text: 'Нет', style: 'cancel' },
          { text: 'Да', onPress: resetDialogWithNewTheme }
        ]
      );
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось сгенерировать тему');
    } finally {
      setGeneratingTheme(false);
    }
  };

  const resetDialogWithNewTheme = () => {
    setMsgs([]);
    setStarted(false);
    setModalVisible(false);
  };

  const safeMsgs = Array.isArray(msgs) ? msgs : [];
  const [personalityModalVisible, setPersonalityModalVisible] = useState(false);

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
            {generatingTheme && !theme ? (
              <ActivityIndicator size="small" color={Colors.purple} style={{ marginVertical: 8 }} />
            ) : theme ? (
              <>
                <Text style={s.title}>{theme.title}</Text>
                <Text style={s.desc}>{theme.desc}</Text>
              </>
            ) : (
              <Text style={s.desc}>Нажмите «Начать диалог», чтобы сгенерировать тему</Text>
            )}

            {/* Панель настроек */}
            <View style={s.settingsRow}>
              {/* Переключатель провокатора */}
              <View style={s.settingItem}>
                <View>
                  <Text style={s.r1label}>Режим «Провокатор»</Text>
                  <Text style={s.r1desc}>Оспаривай всё, будь адвокатом дьявола</Text>
                </View>
                <Switch
                  value={provocateur}
                  onValueChange={setProvocateur}
                  trackColor={{ false: Colors.border2, true: Colors.purple + '80' }}
                  thumbColor={provocateur ? Colors.purple : Colors.muted}
                />
              </View>

              {/* Выбор личности */}
              <View style={s.settingItem}>
                <Text style={s.r1label}>Личность LEV</Text>
                <TouchableOpacity
                  style={s.personalitySelector}
                  onPress={() => setPersonalityModalVisible(true)}
                >
                  <Text style={s.personalitySelectorText}>
                    {ALL_PERSONALITIES.find(p => p.id === personalityId)?.name || 'Джарвис'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* ==================== ДОБАВЛЕНО: ПЕРЕКЛЮЧАТЕЛЬ ГОЛОСА ==================== */}
              <View style={s.settingItem}>
                <View>
                  <Text style={s.r1label}>Голос LEV</Text>
                  <Text style={s.r1desc}>Озвучивать ответы</Text>
                </View>
                <Switch
                  value={voiceEnabled}
                  onValueChange={setVoiceEnabledState}
                  trackColor={{ false: Colors.border2, true: Colors.purple + '80' }}
                  thumbColor={voiceEnabled ? Colors.purple : Colors.muted}
                />
              </View>
              {/* ======================================================================== */}

              {/* Кнопка обновления темы (только если диалог ещё не начат или в процессе) */}
              {!started && theme && (
                <TouchableOpacity style={s.regenerateBtn} onPress={regenerateTheme} disabled={generatingTheme}>
                  <Text style={s.regenerateText}>Новая тема</Text>
                </TouchableOpacity>
              )}
            </View>
          </LinearGradient>

          {!started ? (
            <Btn label="Начать диалог →" onPress={start} />
          ) : (
            <>
              {safeMsgs.map((m, i) => (
                <View key={i} style={[s.row, m.who === 'u' && s.rowU]}>
                  <View style={[s.av, m.who === 'u' ? s.avU : s.avJ]}>
                    <Text style={m.who === 'l' ? s.avTxtJ : s.avTxtU}>
                      {m.who === 'l' ? 'L' : 'Я'}
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

        <Modal
          animationType="slide"
          transparent={true}
          visible={personalityModalVisible}
          onRequestClose={() => setPersonalityModalVisible(false)}
        >
          <View style={s.modalOverlay}>
            <View style={s.personalityModalContent}>
              <Text style={s.modalTitle}>Выберите личность</Text>
              <ScrollView style={s.personalityList}>
                {ALL_PERSONALITIES.map(p => (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      s.personalityItem,
                      personalityId === p.id && s.personalityItemActive,
                    ]}
                    onPress={() => {
                      setPersonalityId(p.id);
                      setPersonalityModalVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        s.personalityItemText,
                        personalityId === p.id && s.personalityItemTextActive,
                      ]}
                    >
                      {p.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={s.personalityCloseBtn}
                onPress={() => setPersonalityModalVisible(false)}
              >
                <Text style={s.personalityCloseBtnText}>Закрыть</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

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
            <TouchableOpacity style={s.finishBtn} onPress={handleFinish} disabled={loading || msgs.length === 0}>
              <Text style={s.finishBtnText}>Завершить диалог</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Модальное окно с резюме */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={s.modalOverlay}>
            <View style={s.modalContent}>
              <Text style={s.modalTitle}>Резюме диалога</Text>
              {summarizing ? (
                <ActivityIndicator size="large" color={Colors.purple} />
              ) : (
                <>
                  <ScrollView style={s.modalScroll}>
                    <Text style={s.modalText}>{summary}</Text>
                  </ScrollView>
                  <View style={s.modalButtons}>
                    <TouchableOpacity style={s.modalBtn} onPress={() => setModalVisible(false)}>
                      <Text style={s.modalBtnText}>Отмена</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.modalBtn, s.modalBtnSave]} onPress={handleSaveDialogue}>
                      <Text style={[s.modalBtnText, { color: '#fff' }]}>Сохранить диалог</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
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
  settingsRow: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.border },
  settingItem: { marginBottom: 16 },
  personalitySelector: {
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border2,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  personalitySelectorText: {
    fontFamily: Font.sans,
    fontSize: 14,
    color: Colors.text,
  },
  personalityModalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    width: '80%',
    maxHeight: '70%',
  },
  personalityList: {
    marginVertical: 12,
  },
  personalityItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  personalityItemActive: {
    backgroundColor: Colors.purple + '20',
  },
  personalityItemText: {
    fontFamily: Font.sans,
    fontSize: 16,
    color: Colors.text,
  },
  personalityItemTextActive: {
    color: Colors.purple,
    fontFamily: Font.mono,
  },
  personalityCloseBtn: {
    marginTop: 12,
    backgroundColor: Colors.purple,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  personalityCloseBtnText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: Font.sans,
  },
  r1label: { fontFamily: Font.mono, fontSize: 11, color: Colors.purple, marginBottom: 2 },
  r1desc: { fontFamily: Font.sans, fontSize: 11, color: Colors.muted },
  regenerateBtn: { marginTop: 8, backgroundColor: '#2a2a2a', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  regenerateText: { color: '#aaa', fontSize: 12, fontFamily: Font.mono },
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
  finishBtn: { marginTop: 8, backgroundColor: '#333', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  finishBtnText: { color: '#aaa', fontSize: 12, fontFamily: Font.mono },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: Colors.surface, borderRadius: 20, padding: 20, width: '80%', maxHeight: '70%' },
  modalTitle: { fontFamily: Font.serif, fontSize: 20, color: Colors.text, marginBottom: 12, textAlign: 'center' },
  modalScroll: { maxHeight: 300, marginBottom: 16 },
  modalText: { fontFamily: Font.sans, fontSize: 14, color: Colors.text, lineHeight: 20 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  modalBtn: { flex: 1, backgroundColor: '#2a2a2a', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  modalBtnSave: { backgroundColor: Colors.purple },
  modalBtnText: { color: '#ccc', fontSize: 14, fontFamily: Font.sans },
});