import AsyncStorage from '@react-native-async-storage/async-storage';

// Ключи
const PROFILE_KEY = '@Jarvis:profile';
const SNAPSHOTS_KEY = 'snapshots';
const BRIEFING_CACHE_KEY = 'cachedBriefing';
const STREAK_KEY = 'streak';
const RECS_CACHE_KEY = 'recommendations';
const FAVORITE_IDS_KEY = 'favorite_ids';  // для хранения ID избранных

// ===== Профиль =====
export const saveProfile = async (profile) => {
  try {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error('Failed to save profile:', error);
  }
};

export const getProfile = async () => {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('Failed to load profile:', error);
    return null;
  }
};

// ===== Срезы =====
export async function saveSnapshot(snapshotData) {
  try {
    const now = new Date();
    const snapshot = {
      id: now.getTime().toString(),
      date: now.toISOString(),
      formattedDate: now.toLocaleString('ru-RU'),
      ...snapshotData,
    };
    const existing = await getSnapshots();
    const updated = [snapshot, ...existing];
    await AsyncStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(updated));
    return snapshot;
  } catch (error) {
    console.error('Ошибка сохранения среза:', error);
    return null;
  }
}

export async function getSnapshots() {
  try {
    const json = await AsyncStorage.getItem(SNAPSHOTS_KEY);
    return json ? JSON.parse(json) : [];
  } catch (error) {
    console.error('Ошибка загрузки срезов:', error);
    return [];
  }
}

export async function deleteSnapshot(id) {
  try {
    const snapshots = await getSnapshots();
    const filtered = snapshots.filter(s => s.id !== id);
    await AsyncStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Ошибка удаления среза:', error);
  }
}

export async function clearSnapshots() {
  try {
    await AsyncStorage.removeItem(SNAPSHOTS_KEY);
  } catch (error) {
    console.error('Ошибка очистки срезов:', error);
  }
}

// ===== Кэш брифинга =====
export async function getCachedBriefing() {
  try {
    const json = await AsyncStorage.getItem(BRIEFING_CACHE_KEY);
    return json ? JSON.parse(json) : null;
  } catch (error) {
    console.error('Ошибка загрузки кэшированного брифинга:', error);
    return null;
  }
}

export async function cacheBriefing(briefingData) {
  try {
    await AsyncStorage.setItem(BRIEFING_CACHE_KEY, JSON.stringify(briefingData));
  } catch (error) {
    console.error('Ошибка сохранения брифинга в кэш:', error);
  }
}

// ===== Стреки =====
export async function getStreak() {
  try {
    const streak = await AsyncStorage.getItem(STREAK_KEY);
    return streak ? parseInt(streak, 10) : 0;
  } catch (error) {
    console.error('Ошибка загрузки streak:', error);
    return 0;
  }
}

export async function updateStreak(newStreak) {
  try {
    await AsyncStorage.setItem(STREAK_KEY, newStreak.toString());
  } catch (error) {
    console.error('Ошибка сохранения streak:', error);
  }
}

// ===== Рекомендации (кэш) =====
export async function getCachedRecs() {
  try {
    const json = await AsyncStorage.getItem(RECS_CACHE_KEY);
    return json ? JSON.parse(json) : [];
  } catch (error) {
    console.error('Ошибка загрузки кэшированных рекомендаций:', error);
    return [];
  }
}

export async function cacheRecs(recs) {
  try {
    await AsyncStorage.setItem(RECS_CACHE_KEY, JSON.stringify(recs));
  } catch (error) {
    console.error('Ошибка сохранения рекомендаций в кэш:', error);
  }
}

// ===== Избранное (только ID) =====
export async function getSavedRecs() {
  try {
    const json = await AsyncStorage.getItem(FAVORITE_IDS_KEY);
    return json ? JSON.parse(json) : [];
  } catch (error) {
    console.error('Ошибка загрузки избранных ID:', error);
    return [];
  }
}

async function saveFavoriteIds(ids) {
  try {
    await AsyncStorage.setItem(FAVORITE_IDS_KEY, JSON.stringify(ids));
  } catch (error) {
    console.error('Ошибка сохранения избранных ID:', error);
  }
}

export async function toggleSavedRec(recId) {
  try {
    let ids = await getSavedRecs();
    if (ids.includes(recId)) {
      ids = ids.filter(id => id !== recId);
    } else {
      ids = [...ids, recId];
    }
    await saveFavoriteIds(ids);
    return ids;
  } catch (error) {
    console.error('Ошибка переключения избранного:', error);
    return [];
  }
}

// Очистить всё избранное
export async function clearFavorites() {
  try {
    await AsyncStorage.removeItem(FAVORITE_IDS_KEY);
  } catch (error) {
    console.error('Ошибка очистки избранного:', error);
  }
}