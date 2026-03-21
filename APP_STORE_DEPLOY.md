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

**Available scenes:** `title`, `gameplay`, `gameplay2`, `powerup`, `death`, `collection`, `leaderboard`

**Example:** `http://localhost:5174/?screenshot=gameplay`

The mock states are defined in `Game.setupScreenshot()` and related `setup*Screenshot()` methods in `src/game/Game.ts`. The game loop is frozen in screenshot mode so the state stays static.

**To recapture:** Run `npm run dev`, then use Playwright MCP or a browser to navigate to each scene at each viewport size.

**Screens captured:**
- [x] Title screen
- [x] Active gameplay — two variants (different snake shapes, arenas, hazards)
- [x] Power-up selection screen
- [x] Death/game-over screen (snake crashed into wall block)
- [x] Collection screen
- [x] Leaderboard screen

**Sizes captured** (saved to `screenshots/store/`, committed to repo):
- [x] 6.7" iPhone (430x932 CSS viewport) → `screenshots/store/ios-6.7/`
- [x] 5.5" iPhone (414x736 CSS viewport) → `screenshots/store/ios-5.5/`
- [x] iPad (1024x1366 CSS viewport) → `screenshots/store/ios-ipad/`
- [x] Google Play phone (360x640 CSS viewport) → `screenshots/store/google-play/`
- [ ] 6.5" iPhone — skipped, nearly identical to 6.7" (2px difference)
- [ ] Feature graphic (1024x500 banner image) — needs separate design

**Note:** Screenshots are at 1x CSS resolution. App stores may require device-pixel resolution (e.g. 1290x2796 for 6.7" iPhone at 3x). Upscale if needed or recapture with higher device scale factor.

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
