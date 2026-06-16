# iOS App Store Launch Guide — First-Timer Walkthrough

This is a hand-holding, click-by-click guide for publishing **Serpent Surge** to the App Store. It assumes you've never done this before. The companion file `APP_STORE_DEPLOY.md` is the checklist version — read this one when you actually sit down to do the work.

**What you already have:**
- Apple Developer account paid and active
- App ID decided: `com.serpentsurge.app`
- Native iOS project at `ios/` (created by Capacitor)
- App icons + splash screens generated
- 28 store screenshots ready at `screenshots/store/`
- Store listing copy ready in `STORE_LISTING.md`
- Privacy policy live at https://serpentsurge.vercel.app/privacy

**What's left — the four big phases:**
1. Set up the app record in App Store Connect (web)
2. Build and archive the app in Xcode (your Mac)
3. Upload the build to App Store Connect (via Xcode)
4. Fill out metadata + screenshots + submit for review (web)

Expect this to take a focused half-day the first time. Plan for Apple's review to take 24–72 hours after submission.

---

## Phase 0 — One-time setup on developer.apple.com

You created the developer account; now confirm two things are in place.

### 0.1 Confirm your team is active
1. Go to https://developer.apple.com/account
2. Sign in with the Apple ID tied to your developer account
3. You should see your name + "Individual" or "Organization" and an active membership status. If it says "Pending," wait — you can't ship until it's active.

### 0.2 Register the App ID (Bundle ID)
This is the unique identifier Apple uses for your app. It must match what's in Xcode.

1. https://developer.apple.com/account/resources/identifiers/list
2. Click the **+** next to "Identifiers"
3. Select **App IDs** → Continue
4. Select **App** → Continue
5. Fill in:
   - **Description:** `Serpent Surge`
   - **Bundle ID:** Explicit, `com.serpentsurge.app`
6. Capabilities: leave all unchecked (the game doesn't use Push, Game Center, In-App Purchase, etc.)
7. Continue → Register

If the bundle ID is already taken (unlikely for this name), pick a variation and update `capacitor.config.ts`, then re-run `npm run cap:sync`.

---

## Phase 1 — Create the app record in App Store Connect

App Store Connect is a separate website from developer.apple.com. It's where you manage metadata, screenshots, and submissions.

1. Go to https://appstoreconnect.apple.com
2. Sign in with the same Apple ID
3. Accept any new agreements that pop up (Paid Apps Agreement is NOT required since this is free)
4. Click **My Apps** → the **+** button → **New App**
5. Fill in:
   - **Platforms:** check **iOS** only
   - **Name:** `Serpent Surge` (this is the public store name, max 30 chars)
   - **Primary Language:** English (U.S.)
   - **Bundle ID:** select `com.serpentsurge.app` from the dropdown (it appears because you registered it in Phase 0.2)
   - **SKU:** any unique string you'll recognize internally, e.g. `serpent-surge-001`. Never shown publicly.
   - **User Access:** Full Access
6. Click **Create**

You now have an empty app record. Don't fill in metadata yet — it's easier to do after the build is uploaded, because then you can see your build attached and the form pre-populates a few fields.

---

## Phase 2 — Build and archive in Xcode

Everything in this phase happens on your Mac in Xcode.

### 2.1 Pre-flight: get the latest web build into the iOS project

From the repo root:
```bash
npm run cap:sync
```

This runs `vite build` and copies `dist/` into the native iOS project. **Run this every time you change web code before archiving**, or you'll ship an old build.

### 2.2 Open Xcode
```bash
npm run cap:ios
```

This opens `ios/App/App.xcworkspace` in Xcode. Always open the `.xcworkspace`, never `.xcodeproj` — the workspace knows about CocoaPods dependencies.

### 2.3 Configure signing (the part everyone fumbles)

In the Xcode left sidebar, click the blue **App** project icon at the top. In the center pane:

1. Select the **App** target (under TARGETS, not PROJECT)
2. Click the **Signing & Capabilities** tab
3. Check **Automatically manage signing**
4. **Team:** pick your team from the dropdown. If it doesn't appear:
   - Xcode menu → Settings → Accounts
   - Click **+** → Apple ID → sign in with the same Apple ID
   - Close Settings, return to Signing & Capabilities, and the team should now appear
5. **Bundle Identifier:** confirm it says `com.serpentsurge.app`. If it doesn't match exactly, the upload will fail.

After a few seconds, Xcode should show "Provisioning Profile: Xcode Managed Profile" with no errors. If there's a red error, click it and follow the suggested fix (usually "Try Again" works once the team is set).

### 2.4 Set version and build number

Still in the **App** target:

1. Click the **General** tab
2. Under **Identity:**
   - **Version:** `1.0.0` (this is the user-visible version)
   - **Build:** `1` (this is the internal build number — increment for every upload, even resubmissions)

### 2.5 Test on a simulator first

1. In the toolbar at the top, set the run destination to an iPhone simulator (e.g. **iPhone 15 Pro**)
2. Press **⌘R** (or click the play button) to build and run
3. The simulator launches, the splash shows, and the game should boot
4. Quickly play through: title → run → death → collection screen
5. Quit the simulator app (⌘Q in the simulator) when satisfied

If you have an iPhone, even better: plug it in via USB, trust the computer on the phone, select your device in the destination dropdown, and run on hardware. Real-device testing catches touch responsiveness issues that simulators miss.

### 2.6 Archive the build

This is the actual "build for the App Store" step. The archive is a signed, release-mode `.ipa`-equivalent that gets uploaded to Apple.

1. In the toolbar destination dropdown, change the destination from a simulator to **Any iOS Device (arm64)**. You cannot archive while a simulator is selected — the menu item will be greyed out.
2. Menu bar: **Product → Archive**
3. Wait. The first archive can take 2–5 minutes. Don't touch the Mac. If it succeeds, the **Organizer** window opens automatically with your archive selected.

If you get build errors:
- **"No account for team..."** → revisit 2.3
- **"Code signing failed"** → toggle Automatically manage signing off and back on; restart Xcode
- **TypeScript or Vite errors** → those are web-side; fix in the repo, re-run `npm run cap:sync`, archive again

---

## Phase 3 — Upload the build to App Store Connect

Still in Xcode, in the Organizer window that just opened:

1. Confirm your new archive is selected (top of the list, with today's date and version 1.0.0)
2. Click **Distribute App** on the right
3. **Distribution method:** select **App Store Connect** → Next
4. **Destination:** **Upload** → Next
5. Distribution options: leave all defaults checked (Upload symbols, Manage version and build number unchecked) → Next
6. **Re-sign:** **Automatically manage signing** → Next
7. Review the summary screen → click **Upload**
8. Wait 1–10 minutes. You'll see a green checkmark and "App Store Connect Upload Successful" when done.

**This does NOT submit the app for review.** It just uploads the binary. Apple then runs automated checks ("processing") which take 5–30 minutes. You'll get an email when the build is ready, or you can refresh App Store Connect.

If the upload fails, the error message is usually specific. Common ones:
- **ITMS-90683 missing privacy descriptions** — the game shouldn't need any; if Apple flags it, edit `ios/App/App/Info.plist` and remove unused entries
- **Invalid bundle ID** — Phase 2.3 wasn't done right
- **Build number must be greater than previous** — bump the Build field in 2.4 and re-archive

---

## Phase 4 — Fill out App Store Connect metadata + submit

Back to https://appstoreconnect.apple.com in the browser. Open your `Serpent Surge` app.

### 4.1 App Information (left sidebar)

- **Subtitle:** `Roguelike Snake Reimagined` (from `STORE_LISTING.md`)
- **Category:**
  - Primary: **Games**, then sub-category **Arcade**
  - Secondary: **Games** → **Casual**
- **Content Rights:** check the box confirming you own or have license for the content
- **Age Rating:** click **Edit**, answer the questionnaire honestly. For Serpent Surge: all "None" — no violence, no profanity, no mature themes, no gambling, no user-generated content. Result will be 4+.
- Save

### 4.2 Pricing and Availability

- **Price:** Free
- **Availability:** All countries and regions (default)
- Save

### 4.3 App Privacy

This is the form everyone dreads. Click **Get Started**.

Walk through it honestly. For Serpent Surge specifically:
- **Do you or your third-party partners collect data from this app?**
  - If you have Firebase / analytics: **Yes**, and disclose what's collected
  - If you have ONLY a local leaderboard with no network calls: **No**

If you said Yes, the form walks you through each data type. For a basic leaderboard with player initials:
- **Identifiers** → "User ID" — used for App Functionality (the leaderboard entry), not linked to user identity, not used for tracking
- **Usage Data** → if you log gameplay stats

When in doubt, declare it — under-disclosing is a review rejection; over-disclosing is fine.

Set the **Privacy Policy URL:** `https://serpentsurge.vercel.app/privacy`

### 4.4 The version page (the "1.0 Prepare for Submission" section)

In the left sidebar under iOS App, click **1.0 Prepare for Submission**.

#### Screenshots (the part that takes longest manually)

Apple requires screenshots for the largest device size; smaller sizes are auto-derived but you should upload them too for quality.

For each device size:

**6.7" iPhone display** (required — your largest):
1. Click the **6.7" Display** section
2. Drag the 7 PNG files from `screenshots/store/ios-6.7/` into the upload area:
   - title.png, gameplay.png, gameplay2.png, powerup.png, death.png, collection.png, leaderboard.png
3. Reorder by dragging — recommended order: title → gameplay → gameplay2 → powerup → death → collection → leaderboard
4. The first screenshot is the most important — it's what shows in search results

**6.5" iPhone display:** skipped (per `APP_STORE_DEPLOY.md` line 55, the 6.7" set is nearly identical and Apple now allows omitting this).

**5.5" iPhone display** (still required for older devices):
- Drag the 7 PNGs from `screenshots/store/ios-5.5/`

**iPad Pro 12.9" (6th gen) and 12.9" (2nd gen):**
- Drag the 7 PNGs from `screenshots/store/ios-ipad/` into the **iPad Pro 12.9" Display (6th gen)** slot
- For the 2nd gen slot (if shown as required), upload the same set

#### Promotional Text (optional, 170 chars)
Skip for launch. You can update this any time without a new review.

#### Description (4000 chars)
Paste the **Full Description** from `STORE_LISTING.md` (the multi-paragraph one starting "Serpent Surge takes the classic Snake formula…").

#### Keywords (100 chars, comma-separated)
Paste from `STORE_LISTING.md`:
```
snake,roguelike,arcade,retro,neon,power-ups,leaderboard,daily challenge,pixel,CRT
```

#### Support URL (required)
Use the privacy page or any reachable URL: `https://serpentsurge.vercel.app/privacy` works for v1.

#### Marketing URL (optional)
Skip or use `https://serpentsurge.vercel.app`.

#### Build
Scroll to the **Build** section. Click **+ Select a build before you submit your app**. Your uploaded build from Phase 3 should appear (after processing finishes — refresh if not). Select it.

Apple may ask **Export Compliance** questions:
- **Does your app use encryption?** Most likely **No** for this game. If it makes any HTTPS calls beyond standard URLs, technically yes — but standard HTTPS is exempt. When in doubt, answer "Yes" and then "Only uses exempt encryption (standard HTTPS / iOS-provided)" on the follow-up.

#### App Review Information
- **Sign-in required?** No
- **Contact info:** your name, phone (Apple won't call unless they reject), email (`travis.shields@gmail.com`)
- **Notes:** Leave a short note for the reviewer, e.g.:
  > Serpent Surge is a single-player arcade game. No account or sign-in required. Tap "Play" from the title screen, then swipe to control the snake. Power-up selection appears between waves. Leaderboard shows local + global scores.

#### Version Release
- **Automatically release this version** is fine for v1. If you'd rather flip the switch yourself when approved, choose **Manually release**.

### 4.5 Submit for Review

Top right of the version page: **Add for Review** → **Submit to App Review**.

You'll see the status change to **Waiting for Review**. Typical timeline:
- Waiting for Review: a few hours to 1 day
- In Review: 1–24 hours
- Approved or Rejected: you'll get an email

---

## Phase 5 — After submission

### If approved
You're live. If you chose Automatic release, the app appears on the store within an hour. If Manual, click **Release This Version** in App Store Connect.

Save the App Store URL once it's live — drop it into `STORE_LISTING.md`.

### If rejected
You'll get an email with a Resolution Center message. Common Serpent Surge–shaped rejections and fixes:

| Rejection reason | Fix |
|------------------|-----|
| **Guideline 5.1.1 — Privacy** | Your App Privacy answers don't match actual behavior. Re-check 4.3, re-submit. |
| **Guideline 4.0 — Design** (vague visual issue) | Reply in Resolution Center asking for specifics. Don't change anything blindly. |
| **Crash on launch** | Couldn't reproduce on simulator? Get a real device. Check the crash log Apple attaches to the rejection. |
| **Missing metadata** | Usually a required field on the version page is blank. Look for the red badge. |
| **Mentions of "beta" / "test"** in description | Remove. |

Reply in Resolution Center, fix the issue, and resubmit. The build doesn't need re-uploading unless the binary itself was the problem.

---

## Quick reference — what to run when

```bash
# Whenever you change web code and want to ship it:
npm run cap:sync

# Open Xcode for archiving:
npm run cap:ios

# Recapture screenshots (only if visuals changed):
npm run dev                # terminal 1
npm run screenshots:store  # terminal 2
```

Inside Xcode, the sequence is:
**Set destination to "Any iOS Device" → Product → Archive → Organizer → Distribute App → App Store Connect → Upload**

---

## Things that surprise first-timers

- **App Store Connect and developer.apple.com are different sites** with overlapping but distinct purposes. The first is for managing app submissions; the second is for certificates, identifiers, and account-level stuff.
- **The build number must always increase**, even between rejected submissions. Bumping Version (1.0.0 → 1.0.1) also requires a new version page in App Store Connect; bumping Build (1 → 2) does not.
- **Screenshots aren't validated for content** — Apple won't reject you for ugly screenshots, only for screenshots that include UI mockups that aren't in the app, or other apps, or device frames you didn't add. Yours are clean game captures, you're fine.
- **You can edit metadata after submission** up until "In Review." After that, you have to wait for the review outcome before editing.
- **The Privacy Policy URL is checked** by automated tooling. If `https://serpentsurge.vercel.app/privacy` returns a 404 at review time, you'll be rejected immediately. Confirm it loads in an Incognito window before submitting.
- **Sandbox accounts and TestFlight are optional** for v1. You can ship straight to public review. TestFlight is useful later for beta testing updates.

Good luck. Ping back if review comes back with anything weird.
