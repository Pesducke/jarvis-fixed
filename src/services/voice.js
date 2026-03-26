import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Ключи для хранения настроек
const VOICE_ENABLED_KEY = '@Jarvis:voice_enabled';
const VOICE_PITCH_KEY = '@Jarvis:voice_pitch';
const VOICE_RATE_KEY = '@Jarvis:voice_rate';
const VOICE_LANGUAGE_KEY = '@Jarvis:voice_language';
const VOICE_ID_KEY = '@Jarvis:voice_id';

// Состояние и настройки по умолчанию
let isEnabled = true;
let currentPitch = 1.0;
let currentRate = 0.9;
let currentLanguage = 'ru-RU';
let currentVoiceId = null;
let cachedVoices = [];

// Загрузка настроек при старте
export async function loadVoiceSettings() {
  try {
    const enabled = await AsyncStorage.getItem(VOICE_ENABLED_KEY);
    isEnabled = enabled === null ? true : enabled === 'true';
    
    const pitch = await AsyncStorage.getItem(VOICE_PITCH_KEY);
    currentPitch = pitch ? parseFloat(pitch) : 1.0;
    
    const rate = await AsyncStorage.getItem(VOICE_RATE_KEY);
    currentRate = rate ? parseFloat(rate) : 0.9;
    
    const lang = await AsyncStorage.getItem(VOICE_LANGUAGE_KEY);
    currentLanguage = lang || 'ru-RU';
    
    const voiceId = await AsyncStorage.getItem(VOICE_ID_KEY);
    currentVoiceId = voiceId || null;
  } catch (error) {
    console.error('Failed to load voice settings:', error);
  }
}

// Сохранение настроек
async function saveSetting(key, value) {
  try {
    await AsyncStorage.setItem(key, value.toString());
  } catch (error) {
    console.error('Failed to save voice setting:', error);
  }
}

// Геттеры/сеттеры для настроек
export function isVoiceEnabled() { return isEnabled; }
export async function setVoiceEnabled(enabled) {
  isEnabled = enabled;
  await saveSetting(VOICE_ENABLED_KEY, enabled);
  if (!enabled) {
    await stopSpeaking();
  }
}

export function getVoicePitch() { return currentPitch; }
export async function setVoicePitch(pitch) {
  currentPitch = pitch;
  await saveSetting(VOICE_PITCH_KEY, pitch);
}

export function getVoiceRate() { return currentRate; }
export async function setVoiceRate(rate) {
  currentRate = rate;
  await saveSetting(VOICE_RATE_KEY, rate);
}

export function getVoiceLanguage() { return currentLanguage; }
export async function setVoiceLanguage(lang) {
  currentLanguage = lang;
  await saveSetting(VOICE_LANGUAGE_KEY, lang);
  // После смены языка сбрасываем выбранный голос
  currentVoiceId = null;
  await saveSetting(VOICE_ID_KEY, '');
  // Обновляем кеш голосов для нового языка
  await refreshVoices();
}

export function getVoiceId() { return currentVoiceId; }
export async function setVoiceId(voiceId) {
  currentVoiceId = voiceId;
  await saveSetting(VOICE_ID_KEY, voiceId || '');
}

// Получение списка доступных голосов (с кешированием)
export async function getAvailableVoices() {
  if (cachedVoices.length === 0) {
    await refreshVoices();
  }
  // Фильтруем по выбранному языку (частичное совпадение)
  return cachedVoices.filter(voice => voice.language.startsWith(currentLanguage));
}

async function refreshVoices() {
  try {
    const allVoices = await Speech.getAvailableVoicesAsync();
    cachedVoices = allVoices;
  } catch (error) {
    console.error('Failed to get voices:', error);
    cachedVoices = [];
  }
}

// Автоматический выбор лучшего голоса для текущего языка
async function selectBestVoice() {
  const voices = await getAvailableVoices();
  if (voices.length === 0) return null;
  // Сначала ищем голос с качеством 'Enhanced'
  const enhanced = voices.find(v => v.quality === 'Enhanced');
  if (enhanced) return enhanced.identifier;
  // Иначе берём первый подходящий
  return voices[0]?.identifier;
}

// Инициализация голоса (вызывать после загрузки настроек)
export async function initVoice() {
  await refreshVoices();
  if (!currentVoiceId) {
    const best = await selectBestVoice();
    if (best) {
      currentVoiceId = best;
      await saveSetting(VOICE_ID_KEY, best);
    }
  }
}

// Остановка текущего воспроизведения
export async function stopSpeaking() {
  await Speech.stop();
}

// Основная функция озвучивания текста
export async function speakText(text) {
  if (!isEnabled || !text) return;
  
  try {
    const options = {
      language: currentLanguage,
      pitch: currentPitch,
      rate: currentRate,
    };
    if (currentVoiceId) {
      options.voice = currentVoiceId;
    }
    await Speech.speak(text, options);
  } catch (error) {
    console.error('Speech error:', error);
  }
}

// Тестовая функция
export async function testVoice() {
  await speakText('Привет, я Лев. Проверка голоса.');
}