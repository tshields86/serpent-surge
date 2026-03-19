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

### Screenshots Needed
Capture polished screenshots of key game screens. Need multiple device sizes.

**Screens to capture:**
- [ ] Title screen
- [ ] Active gameplay (snake eating food, hazards visible)
- [ ] Power-up selection screen
- [ ] Death/game-over screen with stats
- [ ] Collection screen
- [ ] Leaderboard screen

**iOS required sizes:**
- [ ] 6.7" iPhone (1290x2796) — required for iPhone 14 Pro Max
- [ ] 6.5" iPhone (1284x2778) — required for iPhone 13 Pro Max
- [ ] 5.5" iPhone (1242x2208) — required for iPhone 8 Plus
- [ ] iPad (2048x2732) — optional but recommended

**Google Play required sizes:**
- [ ] Phone screenshots (1080x1920 or 9:16 ratio, min 2, max 8)
- [ ] Feature graphic (1024x500 banner image)

**Approach:** Use Playwright script or manual capture at each size. Save to `screenshots/store/`.

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
