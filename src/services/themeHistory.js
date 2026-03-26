import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_HISTORY_KEY = '@Jarvis:theme_history';
const MAX_HISTORY = 7;

export async function saveTheme(themeTitle) {
  try {
    const history = await getThemeHistory();
    const newHistory = [themeTitle, ...history].slice(0, MAX_HISTORY);
    await AsyncStorage.setItem(THEME_HISTORY_KEY, JSON.stringify(newHistory));
  } catch (error) {
    console.error('Failed to save theme history:', error);
  }
}

export async function getThemeHistory() {
  try {
    const raw = await AsyncStorage.getItem(THEME_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}