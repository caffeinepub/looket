# Looket

## Current State
- Auth, user profiles, question sets, shop, leaderboard, game modes (FishingFrenzy, CryptoHack, StudyMode) all exist.
- AdminPage: give coins requires manual principal input; Give button in user list shows a toast redirect instead of actually working. No ban/suspend UI.
- No multiplayer system.
- HacksPage (loyak-only): only has "set coin balance" hack via saveCallerUserProfile. saveCallerUserProfile does NOT sync the users Map, so leaderboard coins don't update.
- banUser exists in backend but UI doesn't expose it.
- No suspendUser functionality.

## Requested Changes (Diff)

### Add
- Backend: `giveCoinsToName(name: Text, amount: Nat)` - admin gives coins by username (no principal needed)
- Backend: `suspendUser(user: Principal, hours: Nat)` - admin suspends for N hours
- Backend: `unsuspendUser(user: Principal)` - admin lifts suspension early
- Backend: `isUserSuspended(user: Principal)` - query check
- Backend: Multiplayer room system: `createRoom(questionSetId: Nat)` returns room code, `joinRoom(code: Text)` joins, `getRoomState(code: Text)` polls state, `submitRoomAnswer(code: Text, questionIdx: Nat, answerIdx: Nat)` records answer, `leaveRoom(code: Text)`, `startRoom(code: Text)` host starts game
- Backend: Fix `saveCallerUserProfile` to also update users Map so coins sync
- Frontend: AdminPage - Give Coins by username input (not principal), ban button per user, suspend button per user with hours input
- Frontend: MultiplayerPage - Create Room (get 6-char code), Join Room (enter code), lobby, game with polling, scoreboard
- Frontend: HacksPage expanded - set coins, set XP, view all answers toggle (stored in context for game pages), skip question hack, infinite time hack toggle, auto-answer hack
- Frontend: Pass "hacksEnabled" and "showAnswers" flags from HacksPage/App down to game pages so they can reveal answers

### Modify
- AdminPage: replace principal-input Give Coins with username-based give coins; make per-user Give button actually call giveCoinsToName
- AdminPage: add Ban and Suspend controls per user
- App.tsx: add MultiplayerPage route; pass hack flags to game pages
- FishingFrenzy, CryptoHack, StudyMode: accept optional `showAnswers` prop that highlights correct answer

### Remove
- Nothing removed

## Implementation Plan
1. Generate new Motoko backend with: giveCoinsToName, suspendUser/unsuspendUser/isUserSuspended, multiplayer room system, fixed saveCallerUserProfile sync
2. Update backend.d.ts interface to match
3. Rewrite AdminPage with working give coins (by name), ban button, suspend UI
4. Add MultiplayerPage with create/join room, lobby, polling game loop, scoreboard
5. Expand HacksPage with multiple working hacks
6. Update game pages to accept showAnswers prop
7. Add multiplayer nav link for all users
