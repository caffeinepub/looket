# Looket

## Current State
New project, no existing code.

## Requested Changes (Diff)

### Add
- Sign in / sign up with username (authorization)
- Home/discovery page: browse and play community question sets
- Study mode: flashcard-style study from a question set
- Game modes: Fishing Frenzy and Crypto Hack (mini-games using question sets)
- Question set creator: users create sets with title, description, questions (term + definition or MC)
- Publish/post question sets publicly so others can discover them
- Blook shop: buy cosmetic blooks (avatars) with Looket Coins
- Coins system: earn coins by playing games, spending in shop
- Leaderboard: top players by coins/XP
- Admin hacks panel: only accessible by username "loyak" - see all users, give coins, ban users
- Packs: bundle of blooks that can be purchased with coins (random blook reward)

### Modify
- N/A

### Remove
- N/A

## Implementation Plan
1. Backend: user auth, question sets CRUD, publish/discover, coins wallet, blook ownership, shop items, packs, leaderboard, admin endpoints
2. Frontend: sign in/up, home/discovery, set creator, study mode, fishing frenzy game, crypto hack game, blook shop, packs page, leaderboard, admin panel
