// src/services/news.js
const NEWS_API_KEY = '588b9624b37c4e81aa053a0565b9db16';
const NEWS_API_URL = 'https://newsapi.org/v2/top-headlines';

/**
 * Получить топ-10 новостей по категориям/интересам пользователя
 * @param {string} language - код языка (ru, en, uk)
 * @param {string} category - категория (business, technology, science и т.д.)
 * @param {string} q - поисковый запрос (например, интересы)
 */
export async function fetchTopNews(language = 'ru', category = 'technology', q = '') {
  const params = new URLSearchParams({
    apiKey: NEWS_API_KEY,
    language: language,
    pageSize: 10,
    sortBy: 'publishedAt',
  });
  if (category && category !== 'all') params.append('category', category);
  if (q) params.append('q', q);

  const url = `${NEWS_API_URL}?${params.toString()}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.status === 'ok') {
      return data.articles; // массив статей
    } else {
      console.error('NewsAPI error:', data.message);
      return [];
    }
  } catch (error) {
    console.error('Failed to fetch news:', error);
    return [];
  }
}