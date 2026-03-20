// src/services/api.js

// ⚠️ ВАЖЛИВО: вставте сюди ваш справжній ключ DeepSeek
const DEEPSEEK_API_KEY = 'sk-769d998392e34e9589379df1b644b55b'; // замініть на ваш ключ

// Не змінюйте цей URL – це офіційний ендпоінт DeepSeek
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

export async function askDeepSeek(messages, systemPrompt, useR1 = false, maxTokens = 2000) {
  console.log('🔵 askDeepSeek called (direct DeepSeek API)');
  console.log('📍 URL:', DEEPSEEK_API_URL);
  console.log('📤 Messages count:', messages.length);
  console.log('🤖 System prompt:', systemPrompt?.substring(0, 100));

  const model = useR1 ? 'deepseek-reasoner' : 'deepseek-chat';
  const fullMessages = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;

  try {
    console.log('⏳ Sending fetch request...');
    const startTime = Date.now();

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: model,
        max_tokens: maxTokens,
        temperature: 0.8,
        messages: fullMessages,
      }),
    });

    const endTime = Date.now();
    console.log(`✅ Response received in ${endTime - startTime}ms, status: ${response.status}`);

    if (!response.ok) {
      const text = await response.text();
      console.error('❌ Error response body:', text);
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    const data = await response.json();
    console.log('📥 Response data:', data);

    // DeepSeek повертає відповідь у data.choices[0].message.content
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('В ответе DeepSeek нет содержимого');
    }
    return content;
  } catch (error) {
    console.error('🔥 Fetch error:', error.message);
    console.error('🔍 Error details:', error);
    throw error;
  }
}

// Функція для безпечного парсингу JSON (якщо DeepSeek іноді повертає JSON у тексті)
export function safeJSON(text) {
  try {
    const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch {}
    }
    return null;
  }
}

// Тестова функція для перевірки з'єднання з DeepSeek API
export async function testDeepSeekConnection() {
  try {
    console.log('🔄 Testing DeepSeek API connection...');
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hello' }],
      }),
    });
    const ok = response.ok;
    console.log('📡 DeepSeek API test:', ok ? 'success' : 'failed');
    return ok;
  } catch (error) {
    console.error('❌ Test connection failed:', error.message);
    return false;
  }
}