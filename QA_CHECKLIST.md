# QA Checklist — Serpent Surge

> Go through each item and verify it works. Mark with [x] when confirmed, or note issues.

---

## Title Screen
- [x] "SERPENT SURGE" text displayed in pixel font (Press Start 2P) with green glow
- [x] Pulsing "TAP TO START" / "PRESS ENTER" text below title
- [x] High score displayed below title
- [ ] Daily Challenge entry option visible
  - Didn't see this, should it always render or only under certain conditions?
- [x] Tapping/pressing Enter starts the game
- [] Chill synthwave menu music plays (after first interaction)
  - It plays on desktop but not an actual mobile device

## HUD (During Gameplay)
- [x] Top-left: Score display (animates/pulses on change)
- [ ] Top-right: Arena and wave info (e.g., "ARENA 1 — WAVE 1/3 — 0/5")
  - This is displayed top-center, we moved it to the center after adding the pause button top-right
- [x] Bottom: Snake length display
- [x] Bottom: Power-up icon slots (show active power-ups with countdown timers for temporary ones)
- [x] Pause button top-right (44px+ touch target)

## Snake
- [x] Snake body is green (#00ff41) with rounded segments
- [ ] Head is brighter green (#39ff14), distinguishable from body
  - Can't really tell if it is brighter green
- [x] Glow effect on snake (shadowBlur)
- [x] Smooth movement between ticks (lerp interpolation, not choppy)
- [ ] Head has subtle pulse/scale oscillation
  - I can't tell if the head is doing any subtle pulse/scale oscillation

## Controls
- [x] Arrow keys work
- [x] WASD works
- [x] Touch swipe works on mobile
- [x] Can't reverse 180 degrees (e.g., going right, can't go left)
- [x] Fast direction changes feel responsive (input buffering — one input queued ahead)

## Food Types
- [x] **Apple**: Red (#ff073a) circle, +10 pts, particle burst on eat
- [x] **Golden Apple**: Gold pulsing (#ffd700↔#ffaa00), +50 pts, ~15% chance, flash on eat
- [ ] **Shrink Pellet**: Blue (#00bfff), smaller, -2 length (min 3), +25 pts, appears after wave 3
  - Haven't gotten this far in the game
- [ ] **Speed Fruit**: Green (#39ff14), trailing particles, 1.5x speed for 3s
  - Haven't gotten this far in the game
- [ ] **Bomb Fruit**: Orange (#ff6600), flashing, destroys 3x3 hazards on eat
  - Haven't gotten this far in the game
- [x] Each food type has distinct eat particles and eat sound
  - Haven't validated the ones I haven't seen to consume yet

## Collision & Death
- [x] Wall collision kills you
- [x] Self-collision kills you
- [x] Death animation: segments scatter outward + screen flash (white, 200ms fade)
- [x] Screen shake on death (~300ms)
- [x] Death screen overlay: final score, length, food eaten
- [x] "Try Again" button works
- [x] Descending buzz + static death sound
  - Works on desktop but sound isn't working on real mobile devices
- [x] Death drone music plays

## Wave & Arena System
- [x] 3 waves per arena
  - Only validated arena 1
- [x] Wave food quotas increase (W1=5, W2=7, W3=9 base + arena scaling)
- [x] Wave clear: 500ms pause, score tally floats up, fanfare sound
- [x] Arena clear: "ARENA CLEAR" text, scales earned display, fade to power-up screen
- [ ] New arena: fade in, snake resets to length 3 at center, countdown "3, 2, 1, GO"
  - Haven't gotten this far in the game
- [ ] Difficulty scales: +2 food quota, +0.5 tick/sec per arena
  - Haven't gotten this far in the game

## Hazards (spawn Wave 2+, count increases with arena)
- [ ] **Wall Block**: Static gray 1x1 block, kills on contact
  - Haven't gotten this far in the game
- [ ] **Spike Trap**: Toggles on/off every 4 ticks, red when active / dim when off
  - Is this the red star looking thing? I somtimes go over it and it doesn't kill me and sometimes it does but seems to be the same color or at least I can't tell if it is dim
- [ ] **Poison Trail**: Kills on contact, fades after 8 ticks
  - Haven't gotten this far in the game
- [x] **Warp Hole**: Purple swirl pair — entering one teleports to the other
- [ ] **Magnet**: Pulls nearest food 1 cell/tick toward it, field lines visual
  - Haven't gotten this far in the game
- [ ] All hazards visually distinct and clearly dangerous

## Power-Up Selection Screen (after arena clear)
- [x] 3 cards shown: icon, name, rarity border, 1-line description
- [ ] Rarity borders: Common=white, Uncommon=blue, Rare=purple, Legendary=gold
  - Haven't gotten this far in the game
- [x] Tap to select: card zooms + sparkle
- [x] Current held power-ups shown at bottom

## Power-Ups (15 total — verify each works when selected)
- [ ] **Ghost Mode** (Common): Phase through tail 3s after eating — body turns translucent
- [ ] **Wall Wrap** (Common): Exit one side, enter opposite — warp effect at edges
- [ ] **Venom Trail** (Common): Tail leaves poison 3 ticks — green trail
- [ ] **Head Bash** (Common): Destroy 1 wall block on contact, 1x per wave — shatter particles
- [ ] **Iron Gut** (Common): +2 length per food — thicker growth pulse
- [ ] **Scavenger** (Common): 2 food on grid simultaneously
- [ ] **Dash** (Uncommon): Double-tap to skip 3 cells — motion blur trail
- [ ] **Time Dilation** (Uncommon): 30% slowdown 2s on near-miss — screen tint
- [ ] **Rewind** (Rare): Undo death, rewind 3s, 1x per arena — VHS static effect
- [ ] **Singularity** (Rare): Food within 3 cells drifts toward head — pull lines
- [ ] **Split Strike** (Rare): Split into 2 snakes for 5s
- [ ] **Ouroboros** (Legendary): Eating own tail heals, 1x per arena
- [ ] **Lucky** (Uncommon): Always 1+ Uncommon in power-up choices
- [ ] **Afterimage** (Uncommon): Decoy trail that fades
- [ ] **Shockwave** (Uncommon): Eating pushes hazards 2 cells — ripple visual

  - Haven't gotten this far in the game

## Power-Up Synergies (auto-detected when you have both)
- [ ] **Gluttony** (Ghost + Iron Gut): Always phase through tail when length > 15
- [ ] **Warp Speed** (Wall Wrap + Dash): Dash through wall → 1s invincibility
- [ ] **Toxic Blast** (Venom + Shockwave): Shockwave leaves venom trail
- [ ] **Black Hole** (Scavenger + Singularity): All food drifts toward head
- [ ] Discovery notification appears on first synergy trigger

  - Haven't gotten this far in the game

## Visual Effects
- [ ] CRT scanlines (horizontal lines, subtle)
- [ ] Vignette (edges darkened)
- [ ] Particle effects: eat burst, death scatter, power-up sparkle, venom trail, wall shatter
- [ ] Speed lines during dash
- [ ] Screen shake on death and bomb explosion
- [ ] Score pop animation on change

## Audio
- [x] Eat sound (rising blip)
- [x] Different sounds per food type
- [x] Death sound (descending buzz + static)
- [x] Wave clear fanfare
- [x] Arena clear chord
- [x] Power-up selection chime
- [ ] Hazard spawn warning pulse
  - I haven't come across this yet
- [ ] Near-miss whoosh
  - I haven't come across this yet
- [x] Menu music (chill synthwave)
- [ ] Gameplay music (layered, intensity builds)
  - Seems pretty consistent
- [x] Death music (drone)
- [ ] Crossfade between music tracks
  - Between which music tracks, isn't it the same music throughot the game, unless you pause or die?
- [ ] Mute toggle works and persists
  - I don't see a mute toggle
- [ ] Separate music/SFX volume controls
  - I don't see music/SFX volumn controls

## Pause Menu
- [x] Escape key toggles pause
- [x] Pause button (top-right) works
- [ ] Overlay shows: Resume, Settings, Quit Run
  - In mobile it says Tap to Resume, and Quit Run, and in desktop it says Tap to Resume, Quit Run, and Esc to Resume. It doesn't say setting anywhere for either desktop or mobile
- [x] Game loop fully pauses (snake doesn't move, music pauses)

## Settings Screen (accessible from title + pause)
- [ ] Music volume slider
- [ ] SFX volume slider
- [ ] CRT toggle
- [ ] Curvature toggle
- [ ] Control type selector
- [ ] Colorblind mode toggle
- [ ] Reduced motion option
- [ ] Reset progress option
- [ ] All settings persist across sessions

  - I don't see a setting screen anywhere

## Meta Progression
- [ ] Scales earned at end of run (formula: score/10 + 50/arena + 2/food)
- [ ] Scales persist in IndexedDB
- [ ] Collection screen accessible from title
- [ ] Unlocks purchasable: Starting Length 4 (100), Reroll (200), Arena Preview (300), Extra Life (500), Endless Mode (750)

  - I haven't gotten this far in the game

## Snake Skins (in Collection screen)
- [ ] 8 skins available: Default, Crimson, Cyan, Solar, Phantom, Toxic, Ember, Void
- [ ] Cost 50-500 scales each
- [ ] Selecting a skin changes body color, head color, glow, particle colors
- [ ] Selection persists

  - I haven't gotten this far in the game

## Achievements
- [ ] 15+ achievements exist
- [ ] Toast notification slides in from top on unlock, auto-dismisses ~3s
- [ ] Achievement gallery viewable in Collection screen

  - I haven't gotten this far in the game

## Daily Challenge
- [ ] Entry from title screen
- [ ] Deterministic: same day = same spawns/layouts/offerings
- [ ] Personal daily best displayed

  - I haven't gotten this far in the game or haven't encountered daily challenges

## Boss Arenas
- [ ] Every 5th arena has a boss enemy snake
- [ ] Boss leaves poison trail, speeds up over time
- [ ] Defeat boss → large scale bonus + guaranteed Rare+ power-up

  - I haven't gotten this far in the game

## Endless Mode
- [ ] Unlocks at 750 scales
- [ ] No arenas — continuous, escalating difficulty
- [ ] Power-up offered every 15 food eaten
- [ ] Separate leaderboard

  - I haven't gotten this far in the game

## Leaderboard (Supabase)
- [ ] Score submitted on death
- [ ] All-time top 50 viewable
- [ ] Daily top 50 viewable
- [ ] Personal history viewable
- [ ] Works offline (queues for sync)

- Supabase isn't set up so I can't validate this

## Social Sharing
- [ ] Death screen has share option
- [ ] Captures canvas as PNG
- [ ] Web Share API on mobile / copy-to-clipboard on desktop

  - I don't see a share option

## PWA
- [x] Installable on mobile (add to home screen)
- [x] Launches full-screen (standalone)
- [x] Works offline after first load

## Responsive Design
- [x] Looks good at 320x568 (iPhone SE)
- [x] Looks good at 390x844 (iPhone 14)
- [x] Looks good at 768x1024 (iPad)
- [x] Looks good at 1920x1080 (desktop)
- [x] Touch targets ≥ 44px
- [ ] Fonts scale appropriately
  - Fon't seems to get smaller on iPad with higher resolution?

## Accessibility
- [ ] `prefers-reduced-motion` auto-detected (disables particles, shake, CRT)
- [ ] Colorblind mode adds patterns/shapes to supplement color
  - Haven't validated this
