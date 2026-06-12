# App Store Deployment Checklist

## Status: In Progress

### Completed
- [x] Apple Developer Account created ($99/year)
- [x] Google Play Developer Account created ($25 one-time)
- [x] Privacy policy page live at https://serpentsurge.vercel.app/privacy
- [x] App ID set: `com.serpentsurge.app`
- [x] Version set to 1.0.0
- [x] iOS native project initialized (`ios/`)
- [x] Android native project initialized (`android/`)
- [x] App icons generated for all platforms (iOS, Android, PWA)
- [x] Splash screens generated (dark #0a0a0a)
- [x] Store listing copy drafted (`STORE_LISTING.md`)
- [x] Build scripts added (`cap:ios`, `cap:android`, `cap:sync`, `cap:assets`)
- [x] Capacitor packages installed (`@capacitor/ios`, `@capacitor/android`, `@capacitor/cli`, `@capacitor/assets`)
- [x] Collection screen wired up and working
- [x] Vercel config added for clean URLs

---

### Screenshots

Screenshots are captured using a built-in screenshot mode. Append `?screenshot=<scene>` to the dev server URL to load a pre-built game state with mock data (exciting mid-run snake, hazards, power-ups, scores, etc.).

**Store-shipping scenes** (used by `npm run screenshots:store`): `title`, `gameplay`, `gameplay2`, `powerup`, `death`, `collection`, `leaderboard`

**Additional QA-only scenes:** `gameplay-all` (every food + hazard for legend checks), `leaderboard-overflow` (player ranked outside top 10 — verifies the pinned YOU row), `settings`, `howtoplay`, `howtoplay-food`, `howtoplay-hazards`

**Example:** `http://localhost:5173/?screenshot=gameplay`

The mock states are defined in `Game.setupScreenshot()` and related `setup*Screenshot()` methods in `src/game/Game.ts`. The game loop is frozen in screenshot mode so the state stays static.

**To recapture all 28 store screenshots:**
```bash
npm run dev                # in one terminal
npm run screenshots:store  # in another
```
The capture script lives at `scripts/capture-store-screenshots.mjs` and uses Playwright with per-device `deviceScaleFactor` so the output PNGs match each store's required device-pixel resolution.

**Screens captured:**
- [x] Title screen
- [x] Active gameplay — two variants (different snake shapes, arenas, hazards)
- [x] Power-up selection screen
- [x] Death/game-over screen (snake crashed into wall block)
- [x] Collection screen
- [x] Leaderboard screen

**Sizes captured** (saved to `screenshots/store/`, committed to repo — all at device-pixel resolution):
- [x] 6.7" iPhone → `screenshots/store/ios-6.7/` — **1290×2796** (430×932 CSS @ 3x)
- [x] 5.5" iPhone → `screenshots/store/ios-5.5/` — **1242×2208** (414×736 CSS @ 3x)
- [x] iPad Pro 12.9" → `screenshots/store/ios-ipad/` — **2048×2732** (1024×1366 CSS @ 2x)
- [x] Google Play phone → `screenshots/store/google-play/` — **1080×1920** (360×640 CSS @ 3x)
- [ ] 6.5" iPhone — skipped, nearly identical to 6.7" (2px difference)
- [x] Feature graphic (1024x500 banner image) → `screenshots/store/serpent-surge-feature-graphic.png`

---

### iOS Deployment
- [ ] Open Xcode: `npm run cap:ios`
- [ ] Set signing team (Apple Developer account) in Signing & Capabilities
- [ ] Verify Bundle Identifier is `com.serpentsurge.app`
- [ ] Set Version to `1.0.0` and Build to `1`
- [ ] Test on a real device or simulator
- [ ] Archive: Product → Archive
- [ ] Upload to App Store Connect: Distribute App → App Store Connect
- [ ] In [App Store Connect](https://appstoreconnect.apple.com):
  - [ ] Create new app with bundle ID `com.serpentsurge.app`
  - [ ] Fill in app name, subtitle, description, keywords (see `STORE_LISTING.md`)
  - [ ] Upload screenshots for each required device size
  - [ ] Set category: Games → Arcade
  - [ ] Set privacy policy URL: `https://serpentsurge.vercel.app/privacy`
  - [ ] Complete age rating questionnaire (should be 4+)
  - [ ] App Privacy section: report data collected (leaderboard names, gameplay analytics)
  - [ ] Submit for review

### Android Deployment
- [ ] Open Android Studio: `npm run cap:android`
- [ ] Generate signing keystore (**back this up — can never be replaced**):
  ```
  keytool -genkey -v -keystore serpent-surge.keystore -alias serpentsurge -keyalg RSA -keysize 2048 -validity 10000
  ```
- [ ] Build signed AAB: Build → Generate Signed Bundle / APK → Android App Bundle
- [ ] In [Google Play Console](https://play.google.com/console):
  - [ ] Create new app
  - [ ] Fill in app name, short description, full description (see `STORE_LISTING.md`)
  - [ ] Upload screenshots and feature graphic
  - [ ] Set category: Game → Arcade
  - [ ] Set privacy policy URL: `https://serpentsurge.vercel.app/privacy`
  - [ ] Complete content rating questionnaire (IARC)
  - [ ] Complete data safety form (player name/initials, gameplay stats, Firebase)
  - [ ] Set target audience (not designed for children)
  - [ ] Upload AAB to production release track
  - [ ] Submit for review

---

### Key Files Reference
| File | Purpose |
|------|---------|
| `STORE_LISTING.md` | App name, descriptions, keywords, category, age rating |
| `privacy.html` | Hosted privacy policy (live on Vercel) |
| `capacitor.config.ts` | App ID, splash screen config |
| `resources/` | Source icons and splash images for `@capacitor/assets` |
| `ios/` | Xcode project |
| `android/` | Android Studio project |

### Useful Commands
```bash
npm run cap:sync      # Build web + sync to iOS & Android
npm run cap:ios       # Build, sync, and open Xcode
npm run cap:android   # Build, sync, and open Android Studio
npm run cap:assets    # Regenerate icons and splash screens
```
