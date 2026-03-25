import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@Jarvis:diaries';

/**
 * Сохранить диалог в историю
 * @param {string} title - заголовок (дата + первые слова)
 * @param {string} text - полный текст диалога
 */
export async function saveDialogue(title, text) {
  try {
    const existing = await getDialogues();
    const newDialogue = {
      id: Date.now().toString(),
      title,
      text,
      date: new Date().toISOString(),
    };
    const updated = [newDialogue, ...existing];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newDialogue;
  } catch (error) {
    console.error('Failed to save dialogue:', error);
    throw error; // добавить выброс ошибки
  }
}

/**
 * Получить все сохранённые диалоги
 */
export async function getDialogues() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Failed to load dialogues:', error);
    return [];
  }
}

/**
 * Удалить диалог по id
 */
export async function deleteDialogue(id) {
  try {
    const current = await getDialogues();
    const filtered = current.filter(d => d.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete dialogue:', error);
  }
}