# Redesign Follow-ups

Polish items deferred during the App Store redesign — revisit before final QA.

## Infrastructure

- [ ] **Self-host Press Start 2P + VT323 for the Capacitor build.** The dev/web
  builds use Google Fonts; the iOS / Android Capacitor builds need offline
  font files. Flagged in `index.html` with a TODO comment.

- [ ] **Add proper gameplay analytics post-launch (v1.1).** The pre-launch
  `src/meta/Analytics.ts` was removed during App Store prep — it was writing
  to `analytics_runs` / `analytics_daily` collections that weren't covered by
  `firestore.rules`, so the writes were silently failing. The right rebuild
  is decide-what-questions-to-answer first, then either: (a) extend the custom
  Firestore collections with matching rules, or (b) integrate the Firebase
  Analytics SDK (`firebase/analytics`) for automatic event tracking. Either
  way, update the App Privacy declaration in App Store Connect at the same
  time — currently only **Identifiers → User ID** is declared (linked to the
  anonymous Firebase Auth UID + 3-char player name).

- [ ] **Leaderboard pin rank is approximate at scale.** `getPlayerStanding`
  in `src/meta/Leaderboard.ts` uses a Firestore count aggregation
  (`where('score', '>', yourBest)`) to compute the rank shown in the pinned
  YOU row. The count is over raw documents, not distinct players, so if
  three other players each have two entries scoring above you, you'll be
  shown as rank 7 instead of rank 4. Fine while the player base is small
  and most users have one or two submissions. When it starts to matter,
  the fix is server-side dedupe: a Firestore Cloud Function on submit
  that upserts into `bestScores/{player_name}` (only overwrite if the new
  score is higher), then query/count against that collection instead of
  raw `leaderboard`. Bonus: simplifies `getTopScores` too — no more
  client-side overfetch + dedupe.
