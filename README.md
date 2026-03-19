# JARVIS — DeepSeek Edition (исправленная версия)

## Что изменено по сравнению с предыдущей версией

- ❌ Убран `expo-router` (был источником ошибки "Something went wrong")
- ✅ Стандартный `App.js` + `index.js` — работает в Expo Go без проблем
- ✅ JavaScript вместо TypeScript — меньше причин для ошибок при первом запуске
- ✅ Чистая структура папок без мусорных директорий

## Запуск за 3 шага

```bash
# 1. Установи зависимости
npm install

# 2. Вставь API ключ DeepSeek
# Открой src/services/api.js
# Найди строку: const API_KEY = 'YOUR_DEEPSEEK_API_KEY';
# Замени на свой ключ с https://platform.deepseek.com/api_keys

# 3. Запусти
npx expo start
```

Затем отсканируй QR-код приложением **Expo Go** на телефоне.

## Структура (простая и чистая)

```
jarvis-fixed/
├── App.js                     ← корень приложения
├── index.js                   ← точка входа Expo
├── app.json                   ← конфигурация
├── src/
│   ├── theme/index.js         ← цвета и шрифты
│   ├── services/
│   │   ├── api.js             ← DeepSeek API
│   │   └── storage.js         ← AsyncStorage
│   ├── components/UI.js       ← кнопки, пилюли и т.д.
│   └── screens/
│       ├── Onboarding.js      ← выбор тем
│       ├── Briefing.js        ← утренний брифинг
│       ├── Dialogue.js        ← сократовский диалог + R1
│       ├── Snapshot.js        ← еженедельный слепок
│       └── Recommendations.js ← подборка материалов
```

## Если снова ошибка в Expo Go

1. В терминале нажми `r` — перезагрузка
2. Если не помогает: `npx expo start --clear`
3. Проверь ключ API в `src/services/api.js`
4. Убедись что телефон и компьютер в одной Wi-Fi сети
