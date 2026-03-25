import { fetchTopNews } from './news';
import { askDeepSeek, safeJSON } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = '@Jarvis:briefing_history';
const MAX_HISTORY = 7;

async function getBriefingHistory() {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveBriefingTopics(topics) {
  const existing = await getBriefingHistory();
  const newHistory = [topics, ...existing].slice(0, MAX_HISTORY);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
}

export async function generateBriefing({ interests = [], mode = 'standard', language = 'ru' }) {
  // 1. Получаем реальные новости
  // Для простоты используем категорию technology, можно улучшить
  const newsArticles = await fetchTopNews(language, 'technology');
  const newsText = newsArticles.map(art => 
    `- ${art.title}\n  ${art.description || ''}\n  Источник: ${art.source.name}\n`
  ).join('\n');

  // 2. Получаем историю последних 7 брифингов (темы)
  const history = await getBriefingHistory();
  const historyText = history.length 
    ? `История последних ${history.length} брифингов: ${history.join(', ')}`
    : 'Истории пока нет.';

  // 3. Создаём системный промпт в зависимости от режима
  let systemPrompt = '';
  if (mode === 'espresso') {
    systemPrompt = `Ты — главный редактор утренней газеты для умных людей.
Твой читатель: образованный, занятой, не хочет очевидного.

Формат: **60 секунд чтения**. Только суть: событие + одна мысль + вопрос.

Первое предложение должно зацепить — факт, парадокс или неожиданный угол.
Никаких пассивных конструкций.
Никаких слов: "важно", "следует отметить", "в заключение".
Вопрос дня должен быть неудобным, не риторическим.

Реальные новости:
${newsText}

Интересы читателя: ${interests.join(', ') || 'разные темы'}
${historyText}

Создай утренний брифинг в стиле "эспрессо". Ответь ТОЛЬКО валидным JSON без markdown со следующими полями:
{
  "headline": "Заголовок из 8-12 слов",
  "summary": "Краткое изложение главного события дня и его связи с вашими интересами",
  "insight": "Неочевидная мысль или контекст",
  "question": "Вопрос дня",
  "topic_tag": "Одно слово, описывающее главную тему"
}`;
  } 
  else if (mode === 'deep') {
    systemPrompt = `Ты — главный редактор утренней газеты для умных людей.
Твой читатель: образованный, занятой, не хочет очевидного.

Формат: **10-15 минут чтения**. Полный разбор одной главной темы.
Структура: история вопроса, стороны конфликта, что будет дальше, как думать об этом.

Первое предложение должно зацепить.
Никаких пассивных конструкций.
Каждый абзац — одна идея.
В конце — вопрос дня, который заставляет задуматься.

Реальные новости:
${newsText}

Интересы читателя: ${interests.join(', ') || 'разные темы'}
${historyText}

Выбери одну главную тему из новостей и создай глубокий анализ. Ответь ТОЛЬКО валидным JSON без markdown со следующими полями:
{
  "headline": "Заголовок из 8-12 слов",
  "summary": "Краткое изложение главной темы (2-3 предложения)",
  "insight": "Развёрнутый анализ: история, стороны, прогноз (5-7 предложений)",
  "question": "Вопрос дня",
  "topic_tag": "Одно слово, описывающее главную тему"
}`;
  } 
  else { // standard
    systemPrompt = `Ты — главный редактор утренней газеты для умных людей.
Твой читатель: образованный, занятой, не хочет очевидного.

Формат: **3-5 минут чтения**. Краткий дайджест с главным событием, его связью с интересами читателя, числом дня и вопросом.

Структура:
1. Главное событие дня (одно, самое важное)
2. Почему это важно именно тебе (связь с интересами)
3. Связь с прошлым (если есть)
4. Одно число дня с объяснением
5. Вопрос для размышления

Первое предложение — факт или парадокс.
Никаких шаблонных фраз.

Реальные новости:
${newsText}

Интересы читателя: ${interests.join(', ') || 'разные темы'}
${historyText}

Создай брифинг в стандартном режиме. Ответь ТОЛЬКО валидным JSON без markdown со следующими полями:
{
  "headline": "Заголовок из 8-12 слов",
  "summary": "Краткое изложение главного события (2-3 предложения)",
  "insight": "Связь с интересами, число дня, контекст (2-3 предложения)",
  "question": "Вопрос дня",
  "topic_tag": "Одно слово, описывающее главную тему"
}`;
  }

  // 4. Вызываем DeepSeek
  const result = await askDeepSeek([], systemPrompt, { maxTokens: mode === 'deep' ? 2000 : 1000 });

  // 5. Парсим JSON
  const parsed = safeJSON(result);
  if (!parsed) {
    console.error('Failed to parse JSON from DeepSeek:', result);
    throw new Error('Не удалось распарсить ответ от ИИ');
  }

  // 6. Сохраняем тему в историю
  await saveBriefingTopics(parsed.topic_tag || 'общий брифинг');

  return parsed;
}