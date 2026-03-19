const BACKEND_URL = 'http://192.168.0.104:8000/api/deepseek/chat';

export async function askDeepSeek(messages, systemPrompt, useR1 = false, maxTokens = 2000) {
  console.log('🔵 askDeepSeek called');
  console.log('📍 URL:', BACKEND_URL);
  console.log('📤 Messages:', JSON.stringify(messages).substring(0, 200));
  console.log('🤖 System prompt:', systemPrompt.substring(0, 100));

  const model = useR1 ? 'deepseek-reasoner' : 'deepseek-chat';
  const fullMessages = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ];

  try {
    console.log('⏳ Sending fetch request...');
    const startTime = Date.now();
    
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    return data.content || '';
  } catch (error) {
    console.error('🔥 Fetch error:', error.message);
    console.error('🔍 Error details:', error);
    throw error;
  }
}

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

// Тестова функція для перевірки базового з'єднання
export async function testBackendConnection() {
  const baseUrl = BACKEND_URL.replace('/api/deepseek/chat', '');
  try {
    console.log('🔄 Testing connection to:', baseUrl);
    const response = await fetch(baseUrl);
    const text = await response.text();
    console.log('📡 Test response:', text);
    return response.ok;
  } catch (error) {
    console.error('❌ Test connection failed:', error.message);
    return false;
  }
}