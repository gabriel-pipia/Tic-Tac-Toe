# ✕ Tic Tac Toe — Pro Edition

A premium, full-stack **Tic Tac Toe** mobile app built with **Expo (React Native)** and **Supabase**. Play solo against a bot, challenge friends in real-time via QR code, climb a global leaderboard, and track your game history — all with a polished, themeable UI.

---

## ✨ Features

### 🎮 Game Modes
- **Play Solo** — Challenge a built-in bot across multiple difficulty levels
- **Play with Friend** — Create a private game room and share it via QR code, manual Game ID, or a share link; your friend scans or pastes the ID to join instantly

### 🏆 Global Leaderboard
- Live-updating global rankings powered by Supabase Realtime
- Player avatars, win counts, and profile cards visible directly from the home screen

### 📜 Game History
- Full match history with outcomes, timestamps, and board replays

### 👤 Profiles & Accounts
- Email/password sign-up and login
- Customisable username and profile picture (uploaded to Supabase Storage)
- Public/private profile toggle
- One-tap account deletion (clears avatar, games, profile, and auth record)
- Password reset via email

### 🎨 Theming
- Automatic **light / dark mode** following system preference
- Smooth animated transitions throughout the UI

### 🔔 Reactive UX
- Gravity sensor-driven floating background shapes on the home screen
- In-game emoji reactions between players
- Animated result celebrations on win/draw/loss
- Real-time board sync between two players via Supabase Realtime (with polling fallback)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Expo](https://expo.dev/) (SDK 54) · React Native 0.81 |
| Language | TypeScript |
| Routing | Expo Router (file-based) |
| Backend / Auth | [Supabase](https://supabase.com/) (PostgreSQL + RLS + Realtime) |
| Storage | Supabase Storage (avatar images) |
| Local Storage | AsyncStorage |
| Animations | React Native Reanimated 4 |
| UI Icons | Lucide React Native · Expo Vector Icons |
| QR Code | `react-native-qrcode-svg` · Expo Camera |
| Bottom Sheets | `@gorhom/bottom-sheet` |

---

## 📁 Project Structure

```
src/
├── app/                  # Expo Router pages
│   ├── (tabs)/           # Bottom-tab screens (Home, Profile, Scan)
│   ├── game/             # Dynamic game screen [id]
│   ├── play-friend.tsx   # QR host / join lobby
│   └── global-rank.tsx   # Full leaderboard page
├── components/
│   ├── game/             # BoardGrid, SoloBoard, OnlineBoard, ReactionPicker …
│   └── ui/               # Design-system primitives (Button, Input, Text, View …)
├── context/
│   ├── AuthContext.tsx   # Session management + auth helpers
│   ├── GameContext.tsx   # Game state machine
│   ├── ThemeContext.tsx  # Light / dark colour tokens
│   └── UIContext.tsx     # Global modal, toast, sheet state
├── hooks/                # Custom React hooks
├── lib/
│   ├── constants/        # Layout, breakpoints
│   ├── game/             # Bot AI logic
│   └── supabase/
│       ├── client.ts     # Supabase client setup
│       ├── schema.sql    # Full DB schema (run once to set up)
│       └── reset.sql     # Wipes all project data (dev utility)
└── types/                # Shared TypeScript types
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 18
- [Expo CLI](https://docs.expo.dev/get-started/installation/) — `npm install -g expo-cli`
- [Expo Go](https://expo.dev/go) on your device **or** an Android/iOS simulator
- A [Supabase](https://supabase.com/) project

### 1. Clone the repository

```bash
git clone https://github.com/gabriel-pipia/Tic-Tac-Toe.git
cd Tic-Tac-Toe
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com/).
2. Open the **SQL Editor** and run the full contents of [`src/lib/supabase/schema.sql`](src/lib/supabase/schema.sql) to create all tables, policies, triggers, storage buckets, and functions.
3. Copy your project credentials from **Project Settings → API**.

### 4. Configure environment variables

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Run the app

```bash
# Start the Expo dev server
npm start

# Or target a specific platform
npm run android
npm run ios
npm run web
```

---

## 🗄️ Database Schema

| Table | Purpose |
|---|---|
| `profiles` | Public user data — username, avatar, wins, losses, draws, visibility |
| `games` | Game state — board, turn, players, scores, status, reactions |

**Key RLS policies:**
- Profiles are publicly readable; only the owner can insert and update.
- Games are visible to participants and to anyone when `status = 'waiting'` (so others can join).
- Players can update games they participate in, or join a waiting game.
- A server-side `delete_own_account()` RPC safely removes a user's games, profile, and auth record in one call.

**Realtime:**
- Both `profiles` and `games` are published for Supabase Realtime, enabling live leaderboard updates and in-game board/reaction sync.

---

## 🔑 Environment Variables

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous (public) key |

---

## 📜 Available Scripts

| Script | Description |
|---|---|
| `npm start` | Start Expo dev server |
| `npm run android` | Open on Android emulator / device |
| `npm run ios` | Open on iOS simulator / device |
| `npm run web` | Open in browser |
| `npm run lint` | Run ESLint |

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
