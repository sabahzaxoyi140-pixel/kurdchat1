# Kurd Chat & Kurdish Domino LIVE | کورد چات و دۆمینە LIVE

A modern, full-stack Kurdish real-time messaging application with voice notes, live audio calls, stories, and the complete classic Kurdish Domino LIVE game with AI (3 difficulties), friend challenges, pass & play, coin pot, and responsive mobile Android layout.

## 🚀 Features

- **Domino LIVE (دۆمینە بەهدینی)**:
  - Complete 28-tile double-six domino set ([0|0] to [6|6]).
  - Solo vs AI (هۆشێ دەستکرد) with 3 difficulties: Easy (ب ساناهی), Normal (ناڤین), Master (شارەزا / مەلا).
  - Friend Match (تەحەدیا هەڤالی) with real-time invitation notifications and coin wager.
  - Pass & Play (دوو یاریزان) on the same device with custom player names.
  - Interactive board table with zoom in/out, centering, responsive mobile touch rack, and animations.
  - 4 Felt table themes (Casino Green, Royal Blue, Kurdish Crimson, Ebony Black) and 3 tile skins (Ivory, Gold, Wood).
  - Web Audio API sound effects for tile placement, boneyard drawing, pass, domino win fanfare, and locked/blocked game (قفڵە).
  - Mobile vibration/haptics feedback.
- **Kurdish Messaging & Social**:
  - Real-time chat with text, voice notes, stickers, and image sharing.
  - Direct audio/video calling screen with ringtones and controls.
  - 24-hour Kurdish Stories (ستۆری) with text and photo support.
  - Kurdish Dialect switcher: Badini (بادینی), Sorani (سۆرانی), and English.
  - Super Admin Panel for Sabah Sndi (verified founder).
  - Coin Wallet (کۆین و والت) with instant recharge options ($0.99 for 100+ coins, $4.99 for 500+ coins, etc.) and peer-to-peer coin gifts.

## 🛠️ Requirements & Installation

1. Make sure you have **Node.js** (version 18, 20, or 22) installed.
2. Unzip this project directory.
3. Open a terminal in the project folder and run:

```bash
# 1. Install dependencies
npm install

# 2. Start the local full-stack development server
npm run dev
```

4. Open your browser at `http://localhost:3000`.

## 📦 Building for Production

```bash
# Build the frontend assets
npm run build

# Start the full-stack server in production mode
npm start
```

## 📱 Publishing as an Android App

- **Direct PWA Install**: Open in Chrome on Android and tap **"Add to Home screen"**.
- **Google Play Store (AAB / APK)**: Use **PWABuilder.com** or **Bubblewrap** to convert into an official `.aab` for Google Play Console.
- **Capacitor / Android Studio**:
  ```bash
  npm install @capacitor/core @capacitor/cli @capacitor/android
  npx cap init "Kurdish Domino" "com.kurdchat.domino" --web-dir dist
  npm run build
  npx cap add android
  npx cap open android
  ```

---
Developed by Sabah Sndi | Kurd Chat
