# Product Requirements Document (PRD) & UX Architecture
## Project: Private Couple Space (The Digital Home for Two)

This document establishes the product definition, design language, system architecture, database schema, and implementation roadmap for **Private Couple Space**—a premium, private digital home for couples.

---

### 1. Product Requirements Document (PRD)

#### 1.1 Core Value Proposition
A private, non-social-media digital sanctuary for a single couple. It combines the utility of collaborative planning with emotional triggers (daily prompts, letters, shared memories, gamified gardening, and real-time interactive games).

#### 1.2 Persona Profiles & User Dynamics
*   **User A (Han-byul 🌸)**: Enthusiastic about design, logs daily thoughts, loves virtual gardening, updates statuses.
*   **User B (Min-seok ☕)**: Minimalist, tech-forward, enjoys playing quick games, joins movie watch-along rooms.

#### 1.3 Key Features List
*   **Section 1: Home Dashboard**: Core days together, custom countdowns, current couple weather, daily quote generator, mood status selector, Spotify/music synchronizer, activity log, and responsive arrival animations.
*   **Section 2: Memories**:
    *   *Couple Photobooth*: Life4Cuts style photobooth. Custom layouts (2-Cut, 4-Cut, 6-Cut, film strip, polaroid), backgrounds, filters (vintage, Kodak, disposable), custom doodles, stickers, and immediate export (PNG/JPG). Photos are auto-saved to Memories Timeline.
    *   *Couple Journal*: Shared diary timeline inspired by Notion and Instagram. Title, date, location, weather, mood, photo attachment, tags, and comment section.
    *   *Memory Timeline*: Interactive milestone chronological log (e.g. first date, first trip) with animations, reactions, and comments.
*   **Section 3: Together**:
    *   *Live Letter*: Private digital letters. Write with markdown support, schedule release date, send sealed, react with custom emojis, and watch rich envelope open animations.
    *   *Live Status*: Display real-time activity (studying, sleeping, working, gaming, etc.) with state-syncing.
    *   *Watch Together*: Interactive simulated synchronized YouTube player (Play, Pause, Seek) with active live-chat and emoji reaction bubbles.
    *   *Listen Together*: Animated Spotify-style media player syncing currently playing track, progress, album art, and listening-along state.
*   **Section 4: Play**:
    *   *Mini Games*: Multiplayer games (Tic Tac Toe, Connect Four, Would You Rather, Truth or Dare, Couple Quiz, Spin the Wheel) with historical scoreboards, achievements, and fluid mechanics.
    *   *Collaborative Drawing*: Real-time shared canvas using HTML5 Canvas. Brush size, color picker, shapes, text, undo/redo, and live simulated cursors of the partner.
*   **Section 5: Adventure (Gamification)**:
    *   *Virtual Garden*: Shared growth garden. Plant grows healthily based on relationship XP gained by sending letters, writing journal entries, taking photobooth prints, and completing daily missions.
    *   *Couple Missions*: Daily & weekly challenges (e.g., "Send a Polaroid", "Write a 50-word letter") to earn XP and unlock decorative items.
    *   *Couple Level*: Experience progression unlocking premium themes, stickers, and photobooth borders.
    *   *Time Capsule*: Messages locked until a future date with custom reveal animations, music, and confetti.
    *   *Surprise Mode*: Trigger animated splash displays for Anniversaries, Birthdays, and special milestones.
    *   *Couple Statistics*: Activity breakdown charts (mood history, letters sent, games played) using Recharts.
*   **Section 6: Settings & Theme Customization**:
    *   Instant beautiful theme switching with full color/gradient presets (Minimal White, Korean Cafe, Sakura, Studio Ghibli, Pixel Retro, Night, Coffee, Pastel, Valentine, Christmas).
    *   Simulated multi-profile switching panel (switch instantly between Han-byul and Min-seok to interact with yourself in real-time!).

---

### 2. Information Architecture & Navigation

The application uses an **Apple-inspired Floating Dock** layout combined with a **Korean Minimal Lifestyle** design.

```
                                  [ PRIVATE COUPLE SPACE ]
+-----------------------------------------------------------------------------------------+
| [Profile Panel: Han-byul 🌸] <---> [Switch Profile] <---> [Profile Panel: Min-seok ☕]  |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  +--------------------+  +----------------------+  +------------------+  +-----------+  |
|  |    1. HOME         |  |   2. MEMORIES        |  |  3. TOGETHER     |  |  4. PLAY  |  |
|  | - Days Counter     |  | - Life4Cuts Photobooth|  | - Live Status    |  | - Games   |  |
|  | - Countdown List   |  | - Couple Journal     |  | - Live Letters   |  | - Canvas  |  |
|  | - Quote & Mood     |  | - Memory Timeline    |  | - Watch Together |  +-----------+  |
|  | - Spotify Player   |  +----------------------+  | - Listen Together|  |5.ADVNTURE |  |
|  +--------------------+                            +------------------+  | - Garden  |  |
|                                                                          | - Missions|  |
|                                                                          | - Capsul  |  |
|                                                                          +-----------+  |
+-----------------------------------------------------------------------------------------+
|                              [   FLOATING DOCK NAVIGATION   ]                           |
|                     [Home] [Memories] [Together] [Play] [Adventure] [Settings]          |
+-----------------------------------------------------------------------------------------+
```

---

### 3. User Flow

```
1. Visit App --> 2. Select Current Active Profile (Han-byul or Min-seok) --> 3. Land on Home Dashboard
   |
   +--> 4. Open "Memories" --> Choose "Photobooth" --> Take 4-Cut photo --> Select Filter & Sticker --> Save to Timeline
   |
   +--> 5. Open "Together" --> Write "Live Letter" to partner --> Schedule / Send --> Switch Profile --> Open Inbox
   |
   +--> 6. Open "Play" --> Play Tic Tac Toe or Connect Four --> Switch profile turn-by-turn to compete against partner!
   |
   +--> 7. Open "Adventure" --> Complete Missions --> Gain XP --> Level up Garden Plant from seedling to blossom
```

---

### 4. Database & Storage Schema (Offline-First LocalStorage & Firestore Blueprint Alignment)

To guarantee high responsiveness and full capability without complex setup, we define a solid State Schema stored in LocalStorage. It aligns perfectly with a Firestore Collection pattern:

#### 4.1 `profiles`
*   `id`: `string` ("user_a" | "user_b")
*   `name`: `string`
*   `avatar`: `string`
*   `mood`: `string` (e.g. "happy", "cozy", "sleepy", "studying")
*   `status`: `string` (e.g., "Drinking Coffee", "Coding", "Sleeping")
*   `xp`: `number`
*   `level`: `number`

#### 4.2 `memories` (Timeline & Photobooth Outputs)
*   `id`: `string`
*   `type`: `"photobooth"` | `"milestone"`
*   `title`: `string`
*   `description`: `string`
*   `imageUrl`: `string` (DataURL or high-quality illustration placeholder)
*   `date`: `string` (ISO)
*   `creatorId`: `string`
*   `reactions`: `{ [emoji: string]: number }`
*   `comments`: `Comment[]`

#### 4.3 `journals`
*   `id`: `string`
*   `title`: `string`
*   `description`: `string`
*   `date`: `string`
*   `location`: `string`
*   `weather`: `string`
*   `mood`: `string`
*   `imageUrl`: `string`
*   `tags`: `string[]`

#### 4.4 `letters`
*   `id`: `string`
*   `senderId`: `string`
*   `recipientId`: `string`
*   `title`: `string`
*   `content`: `string` (Markdown)
*   `scheduledFor`: `string` (ISO date, if future it's locked)
*   `isOpened`: `boolean`
*   `reactions`: `string[]`
*   `createdAt`: `string`

#### 4.5 `garden`
*   `xp`: `number`
*   `level`: `number`
*   `plantType`: `"tulip"` | `"bonsai"` | `"sakura"` | `"sunflower"`
*   `waterLevel`: `number` (0-100)
*   `lastInteracted`: `string`

#### 4.6 `timeCapsules`
*   `id`: `string`
*   `senderId`: `string`
*   `openDate`: `string`
*   `message`: `string`
*   `isOpened`: `boolean`
*   `createdAt`: `string`

---

### 5. UI Component Hierarchy
*   `App.tsx` (Theme Wrapper, Profile Swapper, Dock, Navigation System)
*   `components/HomeView.tsx` (Days together counters, countdown timers, widgets)
*   `components/MemoriesView.tsx` (Timeline list, Korean Photobooth engine, Journal timeline builder)
*   `components/TogetherView.tsx` (Live letter templates, real-time activity dashboard, synchronized video, music sync)
*   `components/PlayView.tsx` (Mini-games arena, infinite collaborative doodle canvas)
*   `components/AdventureView.tsx` (Virtual garden animations, mission tracker, level calculations, time capsule, statistics)
*   `components/SettingsView.tsx` (Pre-configured gorgeous theme sliders, database reset, initial profile name inputs)

---

### 6. Development & Implementation Roadmap
1.  **Phase 1**: Base Architecture. Establish the Tailwind configuration, Google Fonts imports, shared Types, and the context provider (`src/context/CoupleContext.tsx`).
2.  **Phase 2**: Designing the Home Dashboard with beautiful micro-interactions and the multi-profile simulation.
3.  **Phase 3**: Creating the Life4Cuts Photobooth, Shared Journal, and Interactive Memories Timeline.
4.  **Phase 4**: Coding the Live Letters with letter opened animations, Status Sync, Watch Together & Listen Together simulators.
5.  **Phase 5**: Building Mini Games (Tic Tac Toe, Connect Four, Quiz, Spin the Wheel) and the infinite collaborative Drawing Canvas.
6.  **Phase 6**: Designing the Virtual Garden with plant growing animations, daily missions, time capsules, and stats dashboard charts.
7.  **Phase 7**: Polishing the premium themes and conducting final compilation/lint verification.
