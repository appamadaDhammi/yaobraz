# YAEDU Exhibition Stand

Интерактивный выставочный киоск с игрой Anti-Tetris для тачскрин-дисплеев.

---

## Быстрый старт — Windows

### 1. Установить Node.js

Открыть PowerShell и выполнить:

```powershell
winget install OpenJS.NodeJS
```

Закрыть и заново открыть PowerShell. Проверить:

```powershell
node -v
npm -v
```

### 2. Перейти в папку с проектом

```powershell
cd C:\путь\к\ya-edu-exhibition
```

### 3. Установить зависимости

Если папка `node_modules` или `package-lock.json` уже есть (код скопирован с другой
машины) — удалить перед установкой:

```powershell
Remove-Item -Recurse -Force node_modules, package-lock.json -ErrorAction SilentlyContinue
npm install
```

### 4. Запустить киоск

```powershell
npm run kiosk
```

---

## Быстрый старт — macOS

### 1. Установить Homebrew

Открыть Terminal и вставить:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

После установки выполнить команды, которые Homebrew выведет на экран:

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

### 2. Установить Node.js

```bash
brew install node
```

Проверить:

```bash
node -v
npm -v
```

### 3. Перейти в папку с проектом

```bash
cd /путь/к/ya-edu-exhibition
```

### 4. Установить зависимости

Если папка `node_modules` или `package-lock.json` уже есть (код скопирован с другой
машины) — удалить перед установкой:

```bash
rm -rf node_modules package-lock.json
npm install
```

`postinstall` скрипт автоматически снимет карантин macOS с Electron.

### 5. Запустить киоск

```bash
npm run kiosk
```

---

## Команды

| Команда | Описание |
|---------|----------|
| `npm run kiosk` | Запуск киоска (Vite + Electron fullscreen) |
| `npm run dev` | Только dev-сервер (без Electron) |
| `npm run build` | Проверка типов + production-сборка |
| `npm run test` | Запуск тестов (Vitest) |

## Страница настроек

Открыть в браузере `https://localhost:5173/settings` — страница для оператора:

- **Формула ранка** — таблица: уровень → ранк (отправляется в QR)
- **QR-параметры** — зашитые n\_ и c\_ значения, имя бота
- **Сетевой адрес** — URL для доступа с других устройств в локальной сети
- **Счётчик ID** — текущее значение из localStorage

## Устранение проблем

### Windows

- **electron не найден**: Закрыть и заново открыть PowerShell после `npm install`.
- **Cannot find module @rollup/rollup-win32-...**: `package-lock.json` от другой ОС.
  Исправить: `Remove-Item -Recurse -Force node_modules, package-lock.json` затем `npm install`.
- **Windows Defender блокирует**: Разрешить доступ в появившемся диалоге или добавить
  папку проекта в исключения Windows Defender.

### macOS

- **Electron убит (SIGKILL)**: macOS Gatekeeper блокирует неподписанный Electron.
  Открыть Системные настройки → Конфиденциальность и безопасность → «Всё равно открыть».
  Или: `xattr -cr node_modules/electron/dist/Electron.app`
- **Cannot find module @rollup/rollup-darwin-arm64**: `package-lock.json` от другой машины.
  Исправить: `rm -rf node_modules package-lock.json && npm install`

### Общее

- **Предупреждение о сертификате**: Dev-сервер использует самоподписанный SSL.
  В Chrome набрать `thisisunsafe`. Electron обрабатывает это автоматически.
- **Electron не открывается**: Убедиться, что порт 5173 свободен.
- **Тач не работает**: Убедиться, что дисплей распознаётся ОС как тачскрин.
- **DevTools в киоске**: `Ctrl+Shift+I` (Windows) или `Cmd+Option+I` (macOS).

## Архитектура

См. [CLAUDE.md](CLAUDE.md) для полной технической документации.
