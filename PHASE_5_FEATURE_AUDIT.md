# PHASE 5: Feature Audit — Couple_Private_Place

> **Project**: Couple_Private_Place — "Our Little Universe"  
> **Stack**: React 19 + Vite 6 + Tailwind CSS 4 + Firebase Auth + Firestore  
> **Date**: July 13, 2026  

---

## Table of Contents

1. [Google OAuth Authentication](#1-google-oauth-authentication)
2. [Profile Slot Claiming (Onboarding)](#2-profile-slot-claiming)
3. [Profile Update (Name, Avatar, Status)](#3-profile-update)
4. [Memory Timeline CRUD](#4-memory-timeline-crud)
5. [Journal Entry CRUD](#5-journal-entry-crud)
6. [Letters System](#6-letters-system)
7. [Time Capsules](#7-time-capsules)
8. [Daily Vibe Vinyl](#8-daily-vibe-vinyl)
9. [Shared Music Player](#9-shared-music-player)
10. [Shared Music Queue](#10-shared-music-queue)
11. [Watch Together (Theater)](#11-watch-together)
12. [Daily Gratitude Practice](#12-daily-gratitude-practice)
13. [Weather & Mood Sync](#13-weather--mood-sync)
14. [Interactive Terrarium](#14-interactive-terrarium)
15. [Photobooth Studio](#15-photobooth-studio)
16. [Sketch Canvas](#16-sketch-canvas)
17. [Multiplayer Games (TTT, WYR, SpinDare)](#17-multiplayer-games)
18. [Mood Selector / Lantern](#18-mood-selector)
19. [Shared Calendar](#19-shared-calendar)
20. [Sticky Notes](#20-sticky-notes)
21. [Custom Greetings](#21-custom-greetings)
22. [Dark Mode](#22-dark-mode)
23. [Admin Reset Operations](#23-admin-reset-operations)

---

<a name="1-google-oauth-authentication"></a>
## 1. Google OAuth Authentication

- **Category**: Auth
- **Purpose**: Gate access to the private couple app — only whitelisted emails can enter.
- **User Flow**:
  1. User lands on `LoginView` → sees "Climb up with Google" button
  2. Clicks button → Google OAuth popup opens
  3. Selects Google account → Firebase validates
  4. `onAuthStateChanged` fires → `resolveSlot()` checks email whitelist
  5. Whitelisted → auto-links to slot A/B → navigates to HomeView
  6. Non-whitelisted → redirects to OnboardingView for slot claiming
  7. Error → shows error message in red alert box
- **Technical Flow**:
  ```
  Click → signInWithPopup(auth, googleProvider) → Firebase Auth response
  → onAuthStateChanged listener fires → resolveSlot(user)
  → getDoc("profiles/user_a"), getDoc("profiles/user_b")
  → Check email whitelist (adminEmail or "nicole"/"nicola" match)
  → Auto-link or setIsOnboarding(true)
  → setDoc("profiles/user_x", { auth_id, name, avatar_url, status })
  → setSession(user) → App re-renders → shows OnboardingView or HomeView
  ```
- **Input**: Google account selection in popup
- **Output**: `session` object in CoupleContext, Firestore profile document created/updated
- **Data Schema**:
  - **Firestore `profiles/{userId}`**:
    ```
    auth_id: string (Firebase UID) | required
    name: string | required
    avatar_url: string | required
    status: string | optional, default "Online 💖"
    mood: string | optional, default "happy"
    gender: "pria" | "wanita" | optional
    updated_at: ISO string | required
    ```
- **Backend Integration**:
  - **Provider**: Firebase Authentication (Google provider)
  - **Method**: `signInWithPopup` (client-side SDK, no REST endpoint)
  - **Auth**: Firebase Auth SDK handles token management
  - **Whitelist**: Client-side check in `resolveSlot()`
- **Realtime**: `onAuthStateChanged(auth, callback)` — Firebase Auth JS SDK listener
- **Dependencies**: `firebaseClient.ts` (Firebase init)
- **Implementation Notes**:
  - Whitelist logic is client-side (security through obfuscation; real security via Firestore Rules)
  - Email matching uses `.includes("nicole")` — case-insensitive, partial match
  - Falls back to onboarding for unknown emails
  - Error messages cached in `localStorage("auth_error_msg")` for cross-redirect persistence

---

<a name="2-profile-slot-claiming"></a>
## 2. Profile Slot Claiming (Onboarding)

- **Category**: Auth
- **Purpose**: Allow new (non-whitelisted) users to claim either Slot A (Pria) or Slot B (Wanita).
- **User Flow**:
  1. After Google Auth, user lands on OnboardingView
  2. Sees two slots — each shows claimed/unclaimed status (via Firestore listener)
  3. Clicks a slot → it highlights as "Selected"
  4. Clicks "Enter as [Name]" → calls `claimProfileSlot(slotId)`
  5. Profile slot is written to Firestore → redirects to HomeView
- **Technical Flow**:
  ```
  Mount → onSnapshot("profiles") → real-time slot status
  Click slot → setSelectedSlot("user_a" | "user_b")
  Click confirm → claimProfileSlot(slotId)
  → setDoc("profiles/{slotId}", { auth_id, name, avatar_url, status, gender, ... })
  → setCurrentUser(slotId) → setIsOnboarding(false)
  → App re-renders → shows HomeView
  ```
- **Input**: Slot ID (`"user_a"` | `"user_b"`)
- **Output**: Firestore profile document created, onboarding flag set to `false`
- **Data Schema**: See [Authentication](#1-google-oauth-authentication) — same `profiles/{userId}` doc
- **Backend Integration**: Firestore `setDoc` with merge
- **Realtime**: `onSnapshot(collection("profiles"))` — live status of both slots
- **Dependencies**: Requires Firebase Auth session
- **Implementation Notes**:
  - Slots have pre-configured genders (user_a = "pria", user_b = "wanita")
  - Occupied slots show avatar/name + "Occupied" badge
  - "Switch Account" button calls `logout()` → returns to LoginView

---

<a name="3-profile-update"></a>
## 3. Profile Update (Name, Avatar, Status)

- **Category**: Settings
- **Purpose**: Allow each partner to update their display name, avatar photo, emoji badge, and live status.
- **User Flow**:
  1. Navigate to Settings → Workshop → scroll to "Profile" section
  2. Edit display name and emoji badge in input fields
  3. Click camera icon → file picker → select image → auto-compress → upload
  4. Click "Save Portrait Details" → updates Firestore
  5. Or: In The Heartbeat → Status Panel → click preset or type custom status
- **Technical Flow**:
  ```
  [Profile Update]
  Edit fields → useState local state
  Click Save → updateProfile(currentUser, { name, emoji })
  → setUserA/setUserB (optimistic local state update)
  → updateDoc("profiles/{userId}", dbUpdates)
  → Firestore onSnapshot listener fires → profile state syncs

  [Avatar Upload]
  File select → compressAvatar(file) → canvas resize to 256px max, JPEG 60%
  → updateProfile(currentUser, { avatar: dataUrl })
  → updateDoc("profiles/{userId}", { avatar_url: dataUrl })

  [Status Update]
  Click preset → updateProfile(currentUser, { status: "emoji label" })
  → Optimistic local update → updateDoc Firestore
  ```
- **Input**:
  - Name: text, max ~50 chars
  - Emoji: text, max 4 chars
  - Avatar: image file (JPEG/PNG), compressed to ≤256px, ≤~200KB
  - Status: text, max 60 chars
- **Output**: Firestore profile document updated; context state updated
- **Data Schema**: See [Authentication](#1-google-oauth-authentication)
- **Backend Integration**: Firestore `updateDoc` to `profiles/{userId}`
- **Realtime**: `onSnapshot(collection("profiles"))` — both partners see each other's updates live
- **Dependencies**: None
- **Implementation Notes**:
  - Avatar compression uses Canvas API (client-side only; no Cloudinary for avatars)
  - Status presets are hardcoded (12 options in `StatusPanel.tsx`)
  - Profile changes sync bidirectionally via Firestore listener

---

<a name="4-memory-timeline-crud"></a>
## 4. Memory Timeline CRUD

- **Category**: Timeline
- **Purpose**: Allow partners to create, read, update, and delete shared memory entries (milestones, drawings, photobooth strips).
- **User Flow**:
  1. Navigate to Our Archive → "Our Story" tab
  2. Click "Add Milestone" → fill form (title, date, image, description) → submit
  3. Memory appears in scrollable timeline with hover-expand cards
  4. Click any memory card → detail modal with reactions, comments, download/print
  5. Tap emoji to react, type comment, edit title/description, or delete
- **Technical Flow**:
  ```
  [Create Memory]
  Fill form → submit → addMemory(memory)
  → addDoc("memories", { type, title, image_url, description, date, created_by, ... })
  → Firestore onSnapshot fires → setMemories() updates local state → re-render
  → addActivity("added a new memory: ...")

  [React to Memory]
  Tap emoji → addReactionToMemory(memoryId, emoji)
  → getDoc("memories/{memoryId}")
  → Check existing reactions array for currentUser
  → Toggle (add or remove) emoji from user's list
  → updateDoc("memories/{memoryId}", { [`reactions.${currentUser}`]: nextList })
  → Firestore listener fires → re-render reaction counts

  [Comment]
  Type + Enter → addCommentToMemory(memoryId, text)
  → updateDoc("memories/{memoryId}", { comments: arrayUnion(comment) })

  [Update]
  Edit title/desc in modal → updateMemory(id, { title, description })
  → Optimistic setMemories update
  → updateDoc("memories/{memoryId}", dbUpdates)

  [Delete]
  Confirm dialog → deleteMemory(id)
  → deleteDoc("memories/{memoryId}")
  ```
- **Input**:
  - Title: text, required
  - Description: text, required
  - Image: file upload (≤2MB) → Cloudinary URL, or URL paste, or Unsplash preset
  - Date: date input
  - Reactions: emoji string
  - Comments: text, required
- **Output**: Firestore document CRUD; activity log entry; UI re-render
- **Data Schema**:
  - **Firestore `memories/{memoryId}`**:
    ```
    type: "milestone" | "photobooth" | "drawing" | required
    title: string | required
    description: string | optional
    image_url: string | optional
    date: YYYY-MM-DD string | required
    created_at: ISO string | required
    created_by: "user_a" | "user_b" | required
    reactions: { user_a: string[], user_b: string[] } | optional
    comments: [{ id, authorId, text, date }] | optional
    bg_style: string | optional
    filter_class: string | optional
    layout: string | optional (photobooth)
    photos_list: string[] | optional
    show_on_timeline: boolean | optional, default true
    ```
- **Backend Integration**: Firestore CRUD (`addDoc`, `updateDoc`, `deleteDoc`, `onSnapshot`)
- **Realtime**: `onSnapshot(query("memories", orderBy("created_at", "desc"), limit(N)))` — live listener update
- **Dependencies**: Cloudinary for image upload
- **Implementation Notes**:
  - Optimistic updates for `updateMemory` (UI updates before Firestore confirms)
  - Reaction locking via `reactionLockRef` (Set<string>) to prevent double-tap race conditions
  - Pagination via `memoriesLimit` (+15 on "Load More")
  - `userReactions` map computed from raw `reactions` field on each snapshot
  - HoverExpandFeed groups items by month chunks

---

<a name="5-journal-entry-crud"></a>
## 5. Journal Entry CRUD

- **Category**: Timeline
- **Purpose**: Partners can write diary entries with weather, mood, location, and tags — separate from milestone memories.
- **User Flow**:
  1. Navigate to Our Archive → "Our Story" tab
  2. Click "New Diary Entry" → fill form (title, date, description, weather, mood, location, tags, optional image)
  3. Submit → entry appears in timeline alongside milestones
  4. Click entry → detail modal → edit or delete
- **Technical Flow**: Very similar to Memory CRUD — uses `journals` collection with `addDoc`/`setDoc`, `updateDoc`, `deleteDoc`
- **Input**:
  - Title: text, required
  - Description: text, required
  - Date: date input
  - Weather: select (sunny/rainy/cloudy/snowy/windy)
  - Mood: select (happy/cozy/excited/peaceful/sleepy/loved)
  - Location: text
  - Tags: comma-separated text → `string[]`
  - Image: file upload or URL
- **Output**: Firestore document; UI re-render via live listener
- **Data Schema**:
  - **Firestore `journals/{journalId}`**:
    ```
    title: string | required
    description: string | required
    date: ISO string | required
    location: string | optional
    weather: string | default "sunny"
    mood: string | default "happy"
    tags: string[] | optional
    imageUrl: string | optional
    created_at: ISO string | required
    created_by: "user_a" | "user_b" | required
    edited_at: ISO string | optional
    ```
- **Backend Integration**: Firestore with `addDoc`/`setDoc`, `updateDoc`, `deleteDoc`
- **Realtime**: `onSnapshot(query("journals", orderBy("created_at", "desc"), limit(N)))`
- **Dependencies**: Cloudinary for image upload; Memory Timeline for merged display
- **Implementation Notes**:
  - Filterable by tags, weather, mood
  - Merged with memories into a single chronology for the timeline
  - `content-visibility-auto` CSS applied for performance
  - Pagination via `journalsLimit` (+15 on "Load More")

---

<a name="6-letters-system"></a>
## 6. Letters System

- **Category**: Communication
- **Purpose**: Partners can send private "love letters" to each other with optional future unlock dates.
- **User Flow**:
  1. Navigate to The Heartbeat → "Letters & Capsules" tab
  2. Click "Write a Letter ✉️" → compose form opens
  3. Fill subject + content + optional scheduled unlock date
  4. Click "Seal & Send Letter" → 1.5s sending delay with paper airplane animation
  5. Letter appears in partner's "Sealed Envelopes Box"
  6. Click letter → opens detail modal → read content, react with emoji
  7. If scheduled → shows "Locked" badge until unlock date
- **Technical Flow**:
  ```
  Compose → submit → sendLetter(letter)
  → setLetters() (optimistic: prepend to local state)
  → addActivity("sent a beautiful Live Letter...")
  → Paper airplane animation (1.5s)
  → UI re-render with new letter in list
  → clear form fields

  Open letter → onClick
  → If locked → toast.error("This envelope is magically sealed...")
  → If unlocked → setOpenedLetterId(id)
  → openLetter(id) → setLetters map update isOpened=true
  → addActivity("opened a sweet Live Letter")
  ```
- **Input**:
  - Subject: text, required
  - Content: text (multiline), required, with lined-paper styling
  - Schedule: date input (optional, must be future)
  - Reactions: emoji click (💖 ✨ ☕ 😭 🌸)
- **Output**: Letter in local state; activity log entry
- **Data Schema** (local state only — no Firestore persistence):
  ```
  id: string | generated
  senderId: "user_a" | "user_b"
  recipientId: "user_a" | "user_b"
  title: string | required
  content: string | required (Markdown supported)
  scheduledFor: ISO string | optional
  isOpened: boolean | default false
  reactions: string[] | emoji strings
  createdAt: ISO string | generated
  ```
- **Backend Integration**: **None** — letters are local-only (no Firestore). Only activity is logged.
- **Realtime**: Local state only. Letters do **not** sync between devices.
- **Dependencies**: Activity logs (Firestore)
- **Implementation Notes**:
  - **CRITICAL LIMITATION**: Letters are stored only in localStorage (`couple_letters`). They do NOT sync to Firestore. Two partners on different devices will NOT see each other's letters.
  - Paper airplane animation uses `motion.div` with keyframes (fly across screen)
  - Lined-paper textarea styled with CSS background gradient
  - Scheduled letters show countdown badge with days remaining
  - Letter modal has focus trapping for accessibility

---

<a name="7-time-capsules"></a>
## 7. Time Capsules

- **Category**: Communication
- **Purpose**: Partners can seal messages for future dates — like a digital time capsule.
- **User Flow**:
  1. Switch to "Time Capsules" tab in The Heartbeat
  2. Click "Seal Capsule ⏳" → form opens
  3. Write message + pick future reveal date/time
  4. Click "Seal Time Capsule" → capsule appears in list
  5. Before reveal date: shows "Sealed until [date]" + days left
  6. On/after reveal date: shows "Ready to be opened!" → click to open
  7. Opening triggers `triggerSurprise("time-capsule-reveal")` — shows surprise overlay
- **Technical Flow**: Same pattern as Letters — local state only, no Firestore
- **Input**:
  - Message: text (multiline), required
  - Reveal date: datetime-local, must be future (>1 minute)
- **Output**: Capsule in local state; `triggerSurprise` on open; activity log
- **Data Schema** (local state only):
  ```
  id: string | generated
  senderId: "user_a" | "user_b"
  openDate: ISO string | required (future)
  message: string | required
  isOpened: boolean | default false
  createdAt: ISO string | generated
  ```
- **Backend Integration**: None (local only)
- **Realtime**: Local state only
- **Dependencies**: Surprise overlay system
- **Implementation Notes**:
  - Same localStorage-only limitation as Letters — no cross-device sync
  - Surprise overlay appears with `activeSurprise="time-capsule-reveal"`

---

<a name="8-daily-vibe-vinyl"></a>
## 8. Daily Vibe Vinyl

- **Category**: Entertainment
- **Purpose**: One-vibe-per-day mood picker that searches YouTube for matching music and plays it through the shared player.
- **User Flow**:
  1. On The Foyer home tab, scroll to "Daily Vibe Vinyl" under "Nest" section
  2. See spinning vinyl record (static if no vibe today)
  3. Pick a vibe from the 3×2 grid: Romantic 💕, Mellow 🌊, Happy ☀️, Nostalgic 📼, Energetic ⚡, Cozy 🕯️
  4. YouTube search runs → first result plays automatically
  5. Vinyl record starts spinning + tonearm moves
  6. Active vibe card shows song title/artist + animated equalizer bars
  7. Can't pick another vibe until tomorrow
  8. History toggle shows last 7 days' vibes
- **Technical Flow**:
  ```
  Click vibe → selectVibe(vibe)
  → Guard: if todayVibe exists → return (one per day)
  → setSearching(vibe.id) → shows spinner on button
  → GET https://www.googleapis.com/youtube/v3/search?q={vibe.searchQuery}&key={API_KEY}
  → Parse response → get videoId, title, artist, thumbnail
  → fetchVideoDuration(videoId) → durationMs
  → syncSongToPartner({ title, artist, album, artwork, durationMs, videoId, isPlaying: true })
  → setTodayVibe(entry) → saveTodayVibe(entry) to localStorage
  → setSearching(null)
  → Vinyl starts spinning via motion.animate

  [Next day]
  → useEffect detects date mismatch → moves today's entry to history → clears todayVibe
  ```
- **Input**: Vibe selection click
- **Output**: Song played via shared player; localStorage entries
- **Data Schema**:
  - `daily_vibe_today` (localStorage):
    ```
    { date: "YYYY-MM-DD", vibeId: string, songTitle: string, songArtist: string }
    ```
  - `daily_vibe_history` (localStorage): `DailyVibeEntry[]`
- **Backend Integration**: YouTube Data API v3 (client-side fetch with API key)
- **Realtime**: None (localStorage-based, but song sync via CoupleContext's Firestore sync)
- **Dependencies**: `VITE_YOUTUBE_API_KEY` env var; `syncSongToPartner` from CoupleContext
- **Implementation Notes**:
  - Falls back gracefully if YouTube API key missing: saves vibe without song
  - One vibe per day enforced by date comparison in localStorage
  - Vinyl spin uses `conic-gradient` for disc texture; CSS animations for grooves
  - Custom event `dailyVinylReset` for admin reset
  - Equalizer bars animate with staggered `motion.span` scales

---

<a name="9-shared-music-player"></a>
## 9. Shared Music Player

- **Category**: Entertainment
- **Purpose**: Full music player shared between partners — YouTube search, playlist, lyrics, volume, play/pause, skip.
- **User Flow**:
  1. On The Foyer → "Listening Treehouse" section
  2. Search for a song or paste YouTube URL
  3. Song starts playing via hidden YouTube iframe
  4. Controls: play/pause, skip forward/back, shuffle, repeat (off/all/one)
  5. Volume slider
  6. Synced lyrics scroll automatically (if available)
  7. Playlist from YouTube playlist ID
  8. Shared queue integration — next song from Firestore queue plays automatically
- **Technical Flow**:
  ```
  [Play Track]
  Click track → playTrack({ videoId, title, artist, artwork })
  → fetchVideoDuration(videoId) via YouTube oEmbed API
  → syncSongToPartner(song)
  → setDoc("settings/shared_song", { title, artist, album, artwork, duration_ms, video_id, is_playing: true })
  → onSnapshot("settings/shared_song") fires on partner's device
  → Partner's App.tsx: iframe src is memoized on videoId, play/pause posted via postMessage

  [Progress Sync]
  → setInterval 1000ms in CoupleContext → setCurrentSong(prev => progressMs + 1000)
  → cosmetic only (no Firestore sync for progress)

  [Auto-advance]
  → When progressMs >= durationMs AND isPlaying
  → Check repeatMode: "one" → replay same; "all"/"off" → goToOffset(1)
  → goToOffset: first check shared_queue → play first item + delete from queue
  → Then check sortedTracks → next track

  [Volume]
  → Slider change → handleVolumeChange(val)
  → localStorage.setItem("music_volume", val)
  → postMessage to iframe: { func: "setVolume", args: [val] }
  ```
- **Input**: Text search, YouTube URL paste, track click, control buttons
- **Output**: YouTube iframe playback; Firestore song sync; lyrics display
- **Data Schema**:
  - **Firestore `settings/shared_song`**:
    ```
    title: string
    artist: string
    album: string
    artwork: string (URL)
    duration_ms: number
    video_id: string
    is_playing: boolean
    synced_at: ISO string
    ```
- **Backend Integration**: YouTube Data API v3 (search), YouTube oEmbed (duration), YouTube IFrame Player API (playback)
- **Realtime**: `onSnapshot("settings/shared_song")` — syncs playing state between partners
- **Dependencies**: `VITE_YOUTUBE_API_KEY`; hidden iframe in App.tsx
- **Implementation Notes**:
  - iframe is hidden (`w-px h-px overflow-hidden opacity-0`) at App root level — persists across tab switches
  - volume posted via `postMessage` with 1.2s delay on init for player API readiness
  - `iframeSrc` memoized on `videoId` only (not `isPlaying`) to prevent iframe reload on play/pause
  - Watch room sync pauses music when partner starts watching a video
  - Lyrics fetched via `fetchLyrics()` utility (third-party API)
  - 4s debounce on auto-skip via `window._lastAutoSkipTime`

---

<a name="10-shared-music-queue"></a>
## 10. Shared Music Queue

- **Category**: Entertainment
- **Purpose**: Collaborative queue where partners can add songs that auto-play next.
- **User Flow**:
  1. On The Foyer → "Shared Queue" section below player
  2. Click "Add Song +" → expands search input
  3. Search or paste YouTube URL → adds to Firestore queue
  4. Queue displays: thumbnail, title, artist, who added it
  5. Click play icon → removes from queue, plays immediately
  6. When current song ends → auto-plays first queued item
  7. Only the person who added can delete their own queued items
- **Technical Flow**:
  ```
  [Add to Queue]
  Search/paste → addToQueue(videoId, title, artist, artwork)
  → addDoc("shared_queue", { videoId, title, artist, artwork, addedBy, addedAt })

  [Auto-play from Queue]
  goToOffset(1):
  → Check sharedQueue.length > 0
  → playTrack(sharedQueue[0])
  → deleteDoc("shared_queue", sharedQueue[0].id)

  [Remove from Queue]
  Click trash → removeFromQueue(id)
  → deleteDoc("shared_queue/{id}")
  ```
- **Input**: Search query or YouTube URL
- **Output**: Firestore document; real-time queue update
- **Data Schema**:
  - **Firestore `shared_queue/{docId}`**:
    ```
    videoId: string | required
    title: string | required
    artist: string | optional
    artwork: string (URL) | optional
    addedBy: "user_a" | "user_b" | required
    addedAt: ISO string | required
    ```
- **Backend Integration**: Firestore `addDoc`, `deleteDoc`, `onSnapshot`
- **Realtime**: `onSnapshot(query("shared_queue", orderBy("addedAt", "asc")))` — live list
- **Dependencies**: MusicPlayer (for auto-advance); YouTube API for search
- **Implementation Notes**:
  - Order maintained by `addedAt` ascending (FIFO)
  - Only the person who added can delete (checked by `item.addedBy === currentUser`)
  - Skeleton loading state when queue first loads
  - Scrollable with `max-h-64` + `data-lenis-prevent` for Lenis smooth scroll

---

<a name="11-watch-together"></a>
## 11. Watch Together (Theater)

- **Category**: Entertainment
- **Purpose**: Partners can watch YouTube videos together in sync with real-time chat.
- **User Flow**:
  1. Navigate to The Heartbeat → "Theater Sync" tab
  2. Paste YouTube URL → "Load" → video appears in wooden TV frame
  3. Partner sees same video (auto-syncs via Firestore)
  4. Chat window on the right → type message → appears in real-time
  5. Emoji burst buttons (💖 😂 🔥 ✨ 🥹 👏) → floating emoji animation
  6. Cinema screen size adjustable from Workshop settings
- **Technical Flow**:
  ```
  [Load Video]
  Input URL → extractVideoId(url) → returns videoId
  → setDoc("rooms/watch_room", { videoId, isPlaying: false, chatMessages })

  [Sync Video]
  → onSnapshot("rooms/watch_room") → setRoom(data)
  → If videoId differs → iframe reloads
  → Pauses global music player

  [Send Chat]
  Type + Enter → sendChat()
  → setDoc("rooms/watch_room", { chatMessages: [...prev, newMsg] })

  [Emoji Burst]
  Click emoji → burstEmoji(emoji)
  → setParticles([...prev, { id, emoji, x, y }])
  → setTimeout 2s → remove particle

  [Auto-cleanup]
  → onSnapshot callback: filter messages older than 24h
  → If messages were removed, update Firestore
  ```
- **Input**: YouTube URL, chat text, emoji clicks
- **Output**: YouTube iframe; Firestore room state; floating emoji animations
- **Data Schema**:
  - **Firestore `rooms/watch_room`**:
    ```
    videoId: string | required
    isPlaying: boolean
    chatMessages: [
      { id: string, userId: "user_a" | "user_b", text: string, ts: number }
    ]
    ```
- **Backend Integration**: Firestore `setDoc`, `onSnapshot` (real-time)
- **Realtime**: `onSnapshot("rooms/watch_room")` — live video + chat sync
- **Dependencies**: YouTube IFrame Player API; global music pause
- **Implementation Notes**:
  - 24h auto-cleanup of chat messages to prevent Firestore document bloat
  - Theater size adjustable via localStorage + CustomEvent
  - Wooden TV frame with CSS easel legs
  - Chat scrolls to bottom on new message via `chatBottomRef`
  - Emoji particles animate with `motion.div` — auto-remove after 2s

---

<a name="12-daily-gratitude-practice"></a>
## 12. Daily Gratitude Practice

- **Category**: Productivity
- **Purpose**: Each partner shares one thing they're grateful for about the other daily — builds emotional connection.
- **User Flow**:
  1. On The Foyer → "Our Story" section → "Daily Gratitude" card
  2. Reads a prompt question (rotates daily)
  3. Types response in textarea (280 char limit)
  4. Clicks "Share Gratitude" → submits to Firestore
  5. Shows result: both partners' entries side-by-side
  6. Streak badge shows consecutive days of gratitude
  7. Partner's recent entries shown for inspiration
- **Technical Flow**:
  ```
  Input text → handleSubmit
  → Optimistic: setOptimisticEntry({ text, date: today })
  → addGratitude(text)
  → setDoc("gratitudes/{currentUser}_{today}", { userId, text, date: today, createdAt })
  → onSnapshot("gratitudes") fires → re-render with real data
  → addActivity("shared their daily gratitude...")

  Streak calculation:
  → calcGratitudeStreak(gratitudes)
  → Get unique dates sorted desc
  → Count consecutive days from most recent
  → Display "N days" in flame badge
  ```
- **Input**: Textarea (max 280 chars), submit button
- **Output**: Firestore document; streak counter; activity log
- **Data Schema**:
  - **Firestore `gratitudes/{userId_date}`**:
    ```
    userId: "user_a" | "user_b"
    text: string
    date: "YYYY-MM-DD"
    createdAt: ISO string
    ```
- **Backend Integration**: Firestore `setDoc` with merge (idempotent per user per day)
- **Realtime**: `onSnapshot(query("gratitudes", orderBy("createdAt", "desc")))`
- **Dependencies**: None
- **Implementation Notes**:
  - One entry per user per day — uses `${currentUser}_${today}` as doc ID to prevent duplicates
  - Optimistic update via `setOptimisticEntry` for instant feedback
  - 7 rotating prompt questions based on day of month
  - Streak calculated from unique dates across both partners
  - "Waiting for partner..." state when only one partner has submitted

---

<a name="13-weather--mood-sync"></a>
## 13. Weather & Mood Sync

- **Category**: Dashboard
- **Purpose**: Show real-time weather and mood for both partners side-by-side.
- **User Flow**:
  1. On The Foyer → "Our World" section
  2. Shows two-column display: your weather + mood | partner's weather + mood
  3. Weather auto-detects via GPS or defaults to Seoul
  4. Mood Lantern: click lantern → select from 8 moods → lantern glows
  5. Mood note: type a whisper + "Save Mood" → saves to mood history
- **Technical Flow**:
  ```
  [Weather Fetch]
  Mount → navigator.geolocation.getCurrentPosition → update profile lat/lng
  → fetchWeather(query) → GET https://wttr.in/{city}?format=j1
  → Parse response (temp_C, weatherDesc, weatherCode, nearest_area, time_zone)
  → setWeather(data) → updateLiveWeather(city, { code, desc })
  → Re-fetch every 30 minutes

  [Mood Selector]
  Click lantern → setLanternOpen(true)
  Click mood → updateProfile(currentUser, { mood: moodValue })
  → setUserA/setUserB (optimistic)
  → updateDoc("profiles/{userId}", { mood: moodValue })
  → Lantern closes

  [Mood Note]
  Type + "Save Mood" → addMoodHistoryEntry(mood, note)
  → setMoodHistory([entry, ...prev])
  → updateProfile(currentUser, { mood, moodNote: note })
  → Firestore profile update
  ```
- **Input**: GPS coordinates (auto); mood click; mood note text
- **Output**: Weather display; updated mood/profiles; mood history entry
- **Data Schema**:
  - **Weather API** (wttr.in): Free, no API key
    - Response: JSON with `current_condition[0].temp_C, weatherDesc, weatherCode`
  - **MoodHistory** (local state via `useEngagementState`):
    ```
    { id, userId, userName, mood, note?, timestamp }
    ```
- **Backend Integration**: wttr.in (HTTP fetch); Firestore `updateDoc("profiles/{userId}")`
- **Realtime**: Profile updates sync via Firestore `onSnapshot("profiles")`
- **Dependencies**: GPS permissions; wttr.in uptime
- **Implementation Notes**:
  - Fallback city: "Seoul" if GPS denied
  - Weather re-fetches every 30 minutes (but code shows re-fetch via interval)
  - Custom SVG weather icons (5 states) — not Unsplash
  - Mood Lantern has CSS glow animation with pulsing inner light
  - 8 mood options with distinct lantern colors

---

<a name="14-interactive-terrarium"></a>
## 14. Interactive Terrarium

- **Category**: Utilities
- **Purpose**: Aesthetic, peaceful virtual terrarium scene that changes with time of day — no XP/levels.
- **User Flow**:
  1. Navigate to Secret Garden → "Interactive Terrarium"
  2. "The View" tab: layered landscape scene with sky, mountains, pond, trees, flowers
  3. Scene changes based on time of day (dawn/day/sunset/night)
  4. Click pond → water ripple animation; click ground → flower sparkles; click night sky → shooting star
  5. "Water the Garden" button → fills water bar, plant grows over days
  6. "Garden Whispers" tab: diary where partners leave thoughts
  7. Each diary entry shows author name (user A / user B)
- **Technical Flow**:
  ```
  [Time of Day]
  → getTimeOfDay() → returns "dawn" | "day" | "sunset" | "night" based on hour
  → setInterval 5min → re-check
  → Renders sky gradient, sun/moon position, stars, colors accordingly

  [Plant Growth]
  On mount → check lastVisitDate
  If days since last visit > 0 → plantStage += 1 (max 5)
  Save plantStage, lastVisitDate to localStorage

  [Click Interactions]
  Click scene → handleTerrariumClick → get relative x/y
  → Pond area (y 50-75, x 20-80) → add ripplePoint → remove after 1.5s
  → Ground area (y > 65) → add sparklePoint → 5 particles → remove after 1.2s
  → Sky (y < 30, night only) → add shootingStar → animate across → remove after 2s

  [Water]
  Click "Water the Garden" → waterLevel = min(prev + 15, 100)
  → Add 3 ripple points
  → Save to localStorage

  [Garden Diary]
  Type + Enter → addDiaryEntry()
  → Create DiaryEntry { id, date, text, emoji (random), authorId }
  → Prepend to diaryEntries, save to localStorage
  → Re-render list

  [Admin Reset]
  → Custom event "terrariumReset" → reset all state to defaults
  ```
- **Input**: Click on scene; "Water" button; diary text input
- **Output**: Animated SVG scene; localStorage persistence; diary entries
- **Data Schema** (localStorage only):
  - `terrarium_water`: number (0-100, default 70)
  - `terrarium_plant_stage`: number (1-5, default 2)
  - `terrarium_last_visit`: date string
  - `garden_diary`: `DiaryEntry[]` (id, date, text, emoji, authorId)
- **Backend Integration**: None (fully local — no Firestore)
- **Realtime**: None
- **Dependencies**: None
- **Implementation Notes**:
  - 4 sky variants with different colors for dawn/day/sunset/night
  - SVG-based landscape with CSS + inline styles
  - Ambient particles: fireflies (night) or petals (day) — animated via `motion.div`
  - 30 twinkling stars at night
  - Plant grows 1 stage per day of absence (max 5)
  - Diary entries display author name via `currentUser` context
  - Custom event listener for admin reset

---

<a name="15-photobooth-studio"></a>
## 15. Photobooth Studio

- **Category**: Media
- **Purpose**: Real-time synchronized photobooth — partners take photos together remotely, assemble strips, save to gallery.
- **User Flow**:
  1. Navigate to Our Archive → "The Photobooth" tab
  2. Start camera (webcam) → video preview appears
  3. "Host Room" → generates 5-char code (e.g. "XK7B9")
  4. Partner enters code → "Join" → both linked
  5. Host selects layout (2-cut/4-cut/6-cut/Polaroid) → "Start Session"
  6. 3-2-1 countdown → auto-captures photo → repeats for each round
  7. Editing phase: host chooses strip preset, filter, caption → "Save to Library"
  8. Strip is composed (html2canvas) → uploaded to Cloudinary → saved as memory
  9. Past photobooth strips shown in Swiper carousel gallery
- **Technical Flow**:
  ```
  [Create Room]
  Click "Host Room" → genRoomCode() → 5 chars (A-Z, 2-9 excluding 0/O/1/I)
  → setDoc("photobooth_rooms/{code}", { code, hostId, guestId:null, layout, bg, filter, state:"waiting", round:0, ... })

  [Join Room]
  Enter code → getDoc("photobooth_rooms/{code}")
  → If exists → setRoomCode(code)
  → If hostId !== currentUser && !guestId → updateDoc({ guestId: currentUser })

  [Countdown & Capture]
  Host clicks "Start Session" → updateDoc({ state:"countdown", round:1, countdownStartAt: Date.now()+3000 })
  → Client-side effect: countdownVal = Math.ceil(remaining/1000)
  → When remaining <= 0 → captureFrame()
  → Draw video to canvas (mirrored) → toDataURL
  → Upload to Cloudinary (if configured)
  → updateDoc({ [`photos${A|B}`]: arrayUnion(url) })

  [Round Transition]
  → Host effect: when both photosA.length >= round AND photosB.length >= round
  → Wait 1.6s → if round < totalRounds → next round
  → Else → state="editing"

  [Compose Strip]
  Host selects preset, filter, caption
  → composeAndSave()
  → Build canvas: draw header + photos + caption + footer
  → compressToWebP(canvas, maxKB=260)
  → Upload to Cloudinary → get URL
  → addMemory({ type:"photobooth", imageUrl, layout, photosList, ... })
  → updateDoc({ state:"done" })
  ```
- **Input**: Webcam feed, room code text, layout/filter/caption selections
- **Output**: Photo strip image (Cloudinary URL); Memory in Firestore; activity log
- **Data Schema**:
  - **Firestore `photobooth_rooms/{code}`**:
    ```
    code: string | 5 chars
    hostId, guestId: "user_a" | "user_b" | null
    layout: "2-cut" | "4-cut" | "6-cut" | "polaroid"
    bg, filter: string
    stripPreset: string | optional
    caption: string | optional
    state: "waiting" | "countdown" | "editing" | "done"
    round, totalRounds: number
    countdownStartAt: number | null (epoch ms)
    photosA, photosB: string[] (data URLs or Cloudinary URLs)
    createdAt: ISO string
    ```
- **Backend Integration**: Firestore (real-time room state); Cloudinary (image upload)
- **Realtime**: `onSnapshot("photobooth_rooms/{code}")` — full room state sync
- **Dependencies**: Cloudinary config; Camera API (webcam)
- **Implementation Notes**:
  - Fallback for missing camera: generates gradient placeholder
  - Image compression pipeline: canvas → WebP (tries 0.85 → 0.7 → 0.55 → 0.4 quality) → PNG fallback
  - Room codes exclude ambiguous characters (0/O/1/I)
  - `transitionLockRef` prevents double transitions between rounds
  - Swiper carousel with coverflow effect for gallery history
  - Strip mockup renders live during countdown (shows captured photos as they come)

---

<a name="16-sketch-canvas"></a>
## 16. Sketch Canvas

- **Category**: Collaboration
- **Purpose**: Real-time collaborative drawing canvas — both partners sketch together remotely.
- **User Flow**:
  1. Navigate to Game Attic → "Sketch Canvas" toy box
  2. Toolbar: pen/eraser toggle, 10 colors, 4 brush weights
  3. Draw on canvas → strokes sync to partner in real-time
  4. Undo/Redo: step through own stroke history
  5. "Clear Canvas": resets entire drawing
  6. "Save Artwork": uploads to Cloudinary → adds to gallery
  7. Gallery: grid of saved sketches with preview, download, delete, "Save to Memories"
  8. Click preview → lightbox modal
- **Technical Flow**:
  ```
  [Drawing Sync]
  Mouse/touch down → onPointerDown
  → Collect stroke points in strokeBufferRef
  → onPointerUp → safeUpdateDoc("rooms/sketch_room", { strokes: arrayUnion({ userId, color, size, points, ts }) })

  [Real-time Sync]
  → onSnapshot("rooms/sketch_room") → receives all strokes
  → on mount: clear canvas → replay all strokes sorted by ts
  → on new stroke: draw only if userId !== currentUser (skip own)
  → on stroke count decrease (undo): redraw all from scratch

  [Save Artwork]
  Click "Save Artwork" → canvas.toBlob()
  → uploadToCloudinary(blob, "sketch-{timestamp}.png")
  → addDoc("saved_sketches", { url, createdAt, createdBy })
  → OR fallback: localStorage("fs_fallback_saved_sketches")
  ```
- **Input**: Mouse/touch drawing events; tool selection clicks
- **Output**: Firestore strokes; Cloudinary image; gallery items
- **Data Schema**:
  - **Firestore `rooms/sketch_room`**:
    ```
    sessionId: string (changes on clear)
    strokes: [
      { userId, color, size, points: [{ x, y, t }], ts }
    ]
    ```
  - **Firestore `saved_sketches/{id}`** (or localStorage fallback):
    ```
    url: string (Cloudinary)
    createdAt: ISO string
    createdBy: "user_a" | "user_b"
    ```
- **Backend Integration**: Firestore (drawing sync + gallery); Cloudinary (image upload)
- **Realtime**: `onSnapshot("rooms/sketch_room")` — stroke-by-stroke sync
- **Dependencies**: Cloudinary config; Canvas API
- **Implementation Notes**:
  - Canvas dimensions: 800×500px (renders at `w-full h-auto`)
  - Stroke limit: 30,000 points total (toast warning at limit)
  - Fallback Firebase wrappers (`safeUpdateDoc`, `customArrayUnion`) for environments without Firestore
  - Undo/redo: per-user stroke filtering (can only undo own strokes)
  - Lightbox modal with focus trapping, keyboard navigation (Escape, Tab)
  - Eraser = white color (#ffffff)
  - Mirror mode for front camera not needed (canvas not video)

---

<a name="17-multiplayer-games"></a>
## 17. Multiplayer Games (TicTacToe, WYR, SpinDare)

- **Category**: Entertainment
- **Purpose**: Three real-time multiplayer games synced via Firestore.
- **User Flow**: See individual games below.

### 17a. Tic Tac Toe
- **User Flow**: Click cell → Firestore sync → partner sees move → turn indicator updates
- **Technical Flow**:
  ```
  Click cell → move(idx)
  → Validate: cell empty, no winner, correct turn
  → setDoc("rooms/ttt_room", { board, nextTurn, winner, scoreA, scoreB })
  → onSnapshot fires → partner's board updates
  ```
- **Data Schema**: `rooms/ttt_room` — `board: string[]`, `nextTurn`, `winner`, `scoreA`, `scoreB`

### 17b. Would You Rather
- **User Flow**: Vote on A/B → partner sees vote → "Next Question"
- **Technical Flow**:
  ```
  Click option → vote(i)
  → setDoc("rooms/wyr_room", { qIdx, votes: { qN: { user_a: 0|1, user_b: 0|1 } } })
  → Both votes submitted → show comparison
  ```
- **Data Schema**: `rooms/wyr_room` — `qIdx: number`, `votes: Record<string, Record<string, number>>`

### 17c. Spin the Dare
- **User Flow**: Toggle truth/dare → spin wheel → 3.5s animation → result displayed
- **Technical Flow**:
  ```
  Click spin → setDoc({ spinning: true, rotation: targetAngle })
  → setTimeout 3.5s → setDoc({ spinning: false, result: selectedItem })
  → Admin: add/remove items via setDoc
  ```
- **Data Schema**: `rooms/spindare_room` — `truths: string[]`, `dares: string[]`, `rotation`, `spinning`, `selectedType`, `result`
- **Backend Integration**: Firestore `onSnapshot` + `setDoc` for all three games
- **Realtime**: All games use `onSnapshot` for real-time sync
- **Dependencies**: Firestore
- **Implementation Notes**:
  - TTT: Hearts (X) and Rings (O) SVG icons; turn validation via `nextTurn !== currentUser`
  - WYR: 10 hardcoded questions; `votes.qN` object tracks both users
  - SpinDare: SVG wheel drawn dynamically; 3.5s CSS transition `cubic-bezier(0.15, 0.75, 0.1, 1)` for realistic deceleration
  - SpinDare editor: custom add/remove items (min 2, max 20)
  - All games have skeleton loading states
  - TTT score persists across sessions (`scoreA`, `scoreB`)

---

<a name="18-mood-selector"></a>
## 18. Mood Selector (Lantern)

- **Category**: Dashboard
- **Purpose**: Set current mood via a visually appealing lantern UI — shown on the Weather card.
- **User Flow**:
  1. On The Foyer → "Our Little Sky" section
  2. See hanging lantern with current mood emoji/glow
  3. Click lantern → mood grid expands (8 options)
  4. Click a mood → lantern color changes, grid collapses
  5. Type a note + "Save Mood" → adds to mood history
- **Technical Flow**: See [Weather & Mood Sync](#13-weather--mood-sync) — mood section
- **Input**: Click mood button; text note (optional)
- **Output**: Profile mood updated; mood history entry created
- **Data Schema**: Profile field `mood: string`; `MoodHistoryEntry[]` in local state
- **Backend Integration**: `updateDoc("profiles/{userId}")` via `updateProfile()`
- **Realtime**: Profile changes sync via Firestore `onSnapshot`
- **Dependencies**: WeatherSection
- **Implementation Notes**:
  - 8 moods: happy, cozy, sleepy, excited, loved, bored, stressed, peaceful
  - Each mood has unique `lanternColor` for CSS glow
  - Lantern animates with `radial-gradient` glow + pulse

---

<a name="19-shared-calendar"></a>
## 19. Shared Calendar

- **Category**: Productivity
- **Purpose**: Partners can add, view, and delete calendar events in a shared monthly grid.
- **User Flow**:
  1. Navigate to The Heartbeat → "Calendar" tab
  2. See monthly grid with dots on days with events
  3. Navigate months with left/right arrows
  4. Click "+ Add Event" → expand form → fill title, date, description → Save
  5. Click a day → expand event list below grid
  6. Click X on own event → delete
- **Technical Flow**:
  ```
  [Add Event]
  addEvent() → addDoc("calendar_events", { title, date, description, createdBy, createdAt })

  [Delete Event]
  deleteEvent(id) → deleteDoc("calendar_events/{id}")

  [Sync]
  → onSnapshot(query("calendar_events", orderBy("date", "asc")))
  ```
- **Input**: Title (text), Date (date input), Description (textarea, optional)
- **Output**: Firestore document; UI calendar update
- **Data Schema**:
  - **Firestore `calendar_events/{docId}`**:
    ```
    title: string | required
    date: "YYYY-MM-DD" | required
    description: string | optional
    createdBy: "user_a" | "user_b" | required
    createdAt: ISO string | generated
    ```
- **Backend Integration**: Firestore `addDoc`, `deleteDoc`, `onSnapshot`
- **Realtime**: `onSnapshot(query("calendar_events", orderBy("date", "asc")))`
- **Dependencies**: None
- **Implementation Notes**:
  - Calendar month calculation: `getMonthDays(year, month)` — handles first day offset + days in month
  - Events shown as colored dots on calendar days
  - Only the creator can delete their own event
  - Full skeleton loading state
  - Month/year navigator

---

<a name="20-sticky-notes"></a>
## 20. Sticky Notes

- **Category**: Communication
- **Purpose**: Partners leave short, colorful sticky notes for each other.
- **User Flow**:
  1. On The Foyer → "Nest" section → "Sweet Notes Board"
  2. Type a message + Enter or "Post" → note appears in grid
  3. Note color is random from 5 preset colors
  4. Hover → X button appears → delete note
  5. Empty state: "No sweet notes yet. Leave one for your partner!"
- **Technical Flow**:
  ```
  [Add Note]
  addNote() → addDoc("sticky_notes", { text, author, color: random, createdAt })

  [Delete Note]
  removeNote(id) → deleteDoc("sticky_notes/{id}")

  [Sync]
  → onSnapshot(query("sticky_notes", orderBy("createdAt", "desc"), limit(12)))
  ```
- **Input**: Text (max ~100 chars), Enter key or button
- **Output**: Firestore document; activity log entry
- **Data Schema**:
  - **Firestore `sticky_notes/{docId}`**:
    ```
    text: string | required
    author: string (display name)
    color: string (Tailwind class)
    createdAt: number (epoch ms)
    ```
- **Backend Integration**: Firestore `addDoc`, `deleteDoc`, `onSnapshot`
- **Realtime**: `onSnapshot(query("sticky_notes", orderBy("createdAt", "desc"), limit(12)))`
- **Dependencies**: Activity log
- **Implementation Notes**:
  - 5 color variants: yellow, pink, blue, green, purple
  - Limit 12 notes
  - `EmptyJournalPage` component for empty state
  - Activity logged on add: "pasted a new sticky note..."

---

<a name="21-custom-greetings"></a>
## 21. Custom Greetings

- **Category**: Settings
- **Purpose**: Customize the time-of-day greeting messages shown on The Foyer.
- **User Flow**:
  1. Navigate to Workshop → "Emotions" section → "Greetings" tab
  2. Edit 4 greeting fields (morning, afternoon, evening, night)
  3. Click "Save Greetings" → saved to Firestore
  4. Home page greeting updates with new text on next load
  5. "Reset Defaults" → restores original greetings
- **Technical Flow**:
  ```
  Edit fields → local state → handleSave
  → updateCustomGreetings(greetings)
  → setCustomGreetings(greetings) (optimistic)
  → setDoc("settings/couple_settings", { custom_greetings: greetings }, { merge: true })
  → toast.success("Greetings saved!")
  ```
- **Input**: 4 text fields (morning/afternoon/evening/night), max 60 chars each
- **Output**: Firestore settings update; toast notification
- **Data Schema**:
  - **Firestore `settings/couple_settings.custom_greetings`**:
    ```
    morning: string
    afternoon: string
    evening: string
    night: string
    ```
- **Backend Integration**: Firestore `setDoc` with merge
- **Realtime**: `onSnapshot("settings/couple_settings")` — syncs custom greetings on load
- **Dependencies**: `useTimeOfDay` hook, `TimeGreeting` component
- **Implementation Notes**:
  - Defaults defined in `DEFAULT_GREETINGS` constant (types.ts)
  - Each greeting has an emoji + hint placeholder
  - Greetings used by `useTimeOfDay` hook via `customGreetings` context

---

<a name="22-dark-mode"></a>
## 22. Dark Mode

- **Category**: Settings
- **Purpose**: Toggle between light and dark themes with a circular reveal animation.
- **User Flow**:
  1. Click floating dark mode toggle button (bottom-right, above nav dock)
  2. Sun/Moon icons swap
  3. `clip-path` circle reveal animation transitions the entire page
  4. Preference saved to localStorage
- **Technical Flow**:
  ```
  Click → handleToggleDarkMode(e)
  → Get click coordinates (x, y)
  → Calculate endRadius = hypot(max(x, W-x), max(y, H-y))
  → Inject <style> with ::view-transition-new/old keyframes
  → If startViewTransition supported:
    → document.startViewTransition(() => toggleDarkMode())
  → Else:
    → toggleDarkMode()
  → toggleDarkMode → setDarkMode(prev => !prev)
  → localStorage.setItem("couple_dark_mode", !prev)
  → CSS class "dark" toggles on root div
  ```
- **Input**: Click on floating button
- **Output**: CSS class toggle; localStorage update
- **Data Schema**: `localStorage("couple_dark_mode")` — boolean
- **Backend Integration**: None (local only)
- **Realtime**: None
- **Dependencies**: CSS variables for dark theme
- **Implementation Notes**:
  - Uses View Transitions API (`startViewTransition`) when available — falls back to standard toggle
  - Custom `clip-path` animation with blur effect
  - Button positioned `fixed bottom-20 right-4` (above nav dock)
  - Color transitions use `transition-all duration-500`

---

<a name="23-admin-reset-operations"></a>
## 23. Admin Reset Operations

- **Category**: Admin
- **Purpose**: Provide gated destructive operations for the admin user only (email check).
- **User Flow**:
  1. Navigate to Workshop → scroll to bottom
  2. Triple-tap "Access Workshop Lathe" button (locked → confirm → unlocked)
  3. Admin panel appears with 11 action cards
  4. Click "Execute Reset" → shows "Confirm Action" button
  5. Click "Confirm Action" → executes → green check feedback (3s)
- **Technical Flow**:
  ```
  [Gate]
  Click 1x → latheState="locked"→"confirm" (pulse animation)
  Click 2x → latheState="confirm"→"unlocked" (panel slides open)
  Click 3x → latheState="unlocked"→"locked" (panel closes)

  [Execute]
  execute(id, fn)
  → setConfirm(null)
  → await fn() — could be:
    - adminResetMissions: getDocs("missions") → each updateDoc({completed: false})
    - adminResetTTTScore: setDoc("rooms/ttt_room", { scoreA:0, scoreB:0 })
    - adminClearActivityLogs: getDocs → deleteDoc each
    - adminDeleteAllMemories: getDocs → deleteDoc each
    - adminDeleteAllSketches: getDocs → deleteDoc each
    - adminDeleteAllNotes: getDocs → deleteDoc each
    - adminKickSlot(slotId): updateDoc("profiles/{slot}", reset to defaults)
    - factory reset: localStorage.removeItem for all couple_ keys + reset all state
    - reset vinyl: localStorage.removeItem("daily_vibe_today") + dispatchEvent
    - reset terrarium: localStorage.removeItem("terrarium_water", etc.) + dispatchEvent
  → setDone(id) → timeout 3s → clear
  ```
- **Input**: Triple-tap gate; "Execute Reset" → "Confirm Action" per action
- **Output**: Firestore/localStorage data modified; toast notification
- **Data Schema**: Various Firestore collections
- **Backend Integration**: Firestore CRUD (batch deletes/updates); localStorage operations
- **Realtime**: Immediate through Firestore snapshot listeners
- **Dependencies**: Admin email check (`VITE_ADMIN_EMAIL`)
- **Implementation Notes**:
  - Admin gate: 3-state toggle (locked → confirm → unlocked)
  - Each action has 2-step confirmation (Execute → Confirm) to prevent accidents
  - Color-coded by severity: amber (reset), red (delete), orange (kick)
  - `done` state shows green check for 3 seconds
  - Custom events `dailyVinylReset` and `terrariumReset` allow components to react immediately
  - No undo — all operations are final

---

## Summary Statistics

| # | Feature | Category | Backend | Realtime | Local/Remote |
|---|---------|----------|---------|----------|--------------|
| 1 | Google OAuth | Auth | Firebase Auth | SDK listener | Remote |
| 2 | Slot Claiming | Auth | Firestore | Firestore | Remote |
| 3 | Profile Update | Settings | Firestore | Firestore | Remote |
| 4 | Memory Timeline | Timeline | Firestore + Cloudinary | Firestore | Remote |
| 5 | Journal Entries | Timeline | Firestore + Cloudinary | Firestore | Remote |
| 6 | Letters | Communication | None ❗ | None ❗ | **Local only** |
| 7 | Time Capsules | Communication | None ❗ | None ❗ | **Local only** |
| 8 | Daily Vibe Vinyl | Entertainment | YouTube API | None | Hybrid |
| 9 | Music Player | Entertainment | YouTube API + Firestore | Firestore | Remote |
| 10 | Music Queue | Entertainment | Firestore | Firestore | Remote |
| 11 | Watch Together | Entertainment | Firestore + YouTube | Firestore | Remote |
| 12 | Gratitude Practice | Productivity | Firestore | Firestore | Remote |
| 13 | Weather & Mood | Dashboard | wttr.in API + Firestore | Partial | Hybrid |
| 14 | Interactive Terrarium | Utilities | None | None | **Local only** |
| 15 | Photobooth | Media | Firestore + Cloudinary | Firestore | Remote |
| 16 | Sketch Canvas | Collaboration | Firestore + Cloudinary | Firestore | Remote |
| 17 | Games (3) | Entertainment | Firestore | Firestore | Remote |
| 18 | Mood Selector | Dashboard | Firestore | Firestore | Remote |
| 19 | Shared Calendar | Productivity | Firestore | Firestore | Remote |
| 20 | Sticky Notes | Communication | Firestore | Firestore | Remote |
| 21 | Custom Greetings | Settings | Firestore | Firestore | Remote |
| 22 | Dark Mode | Settings | None | None | Local |
| 23 | Admin Operations | Admin | Firestore + localStorage | Immediate | Both |

### Key Findings

| Aspect | Insight |
|--------|---------|
| **Features w/ Firestore sync** | 17 of 23 (74%) |
| **Local-only features** | 5 of 23 (22%) — Letters, Time Capsules, Terrarium, Dark Mode, parts of Vibe |
| **Features using YouTube API** | 3 — Vibe Vinyl, Music Player, Watch Together |
| **Features using Cloudinary** | 3 — Memories, Photobooth, Sketch |
| **Real-time sync pattern** | All Firestore features use `onSnapshot` listeners |
| **No REST endpoints** | Pure client → Firestore architecture (no backend server) |
| **Critical gap** | Letters and Time Capsules are local-only — partners on different devices cannot see each other's messages |

---

*Audit generated: July 13, 2026*  
*Based on code analysis of all features across src/ directory*
