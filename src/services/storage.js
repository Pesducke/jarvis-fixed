import AsyncStorage from '@react-native-async-storage/async-storage';

export async function saveProfile(profile) {
  await AsyncStorage.setItem('jarvis:profile', JSON.stringify(profile));
}

export async function getProfile() {
  const v = await AsyncStorage.getItem('jarvis:profile');
  return v ? JSON.parse(v) : null;
}

export async function cacheBriefing(data) {
  await AsyncStorage.setItem('jarvis:briefing', JSON.stringify(data));
  await AsyncStorage.setItem('jarvis:briefing_date', new Date().toDateString());
}

export async function getCachedBriefing() {
  const date = await AsyncStorage.getItem('jarvis:briefing_date');
  if (date !== new Date().toDateString()) return null;
  const v = await AsyncStorage.getItem('jarvis:briefing');
  return v ? JSON.parse(v) : null;
}

export async function saveSnapshot(snap) {
  const list = await getSnapshots();
  list.unshift(snap);
  await AsyncStorage.setItem('jarvis:snapshots', JSON.stringify(list.slice(0, 12)));
}

export async function getSnapshots() {
  const v = await AsyncStorage.getItem('jarvis:snapshots');
  return v ? JSON.parse(v) : [];
}

export async function cacheRecs(data) {
  await AsyncStorage.setItem('jarvis:recs', JSON.stringify({ data, ts: Date.now() }));
}

export async function getCachedRecs() {
  const v = await AsyncStorage.getItem('jarvis:recs');
  if (!v) return null;
  const { data, ts } = JSON.parse(v);
  if (Date.now() - ts > 48 * 3600 * 1000) return null;
  return data;
}

export async function getSavedRecs() {
  const v = await AsyncStorage.getItem('jarvis:saved_recs');
  return v ? JSON.parse(v) : [];
}

export async function toggleSavedRec(id) {
  const saved = await getSavedRecs();
  const next = saved.includes(id) ? saved.filter(x => x !== id) : [...saved, id];
  await AsyncStorage.setItem('jarvis:saved_recs', JSON.stringify(next));
  return next;
}

export async function getStreak() {
  const v = await AsyncStorage.getItem('jarvis:streak');
  const d = v ? JSON.parse(v) : { count: 0, last: '' };
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (d.last === today) return d.count;
  d.count = d.last === yesterday ? d.count + 1 : 1;
  d.last = today;
  await AsyncStorage.setItem('jarvis:streak', JSON.stringify(d));
  return d.count;
}
