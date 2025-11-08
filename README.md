# Gamedrop

Steam, but for Hack Clubbers!

## Features

(for users)

- **Browse Games**
- **Library**
- **Wishlist**
- **Web Games** :DDD (similar to itch.io)
- **News & Game Updates**
- **Search**

(for the game devs)

- **Game Management**
- **Media Support**
- **Versions**
- **Web Game Deployment**
- **Invites** (so you can manage your games)
- **Analytics**

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (I will implode if you use npm :3)
- Appwrite instance (cloud or self-hosted)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/justdanielndev/gamedrop.git
cd gamedrop
```

2. Install dependencies:
```bash
pnpm install
```

3. Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://your-appwrite-instance.com/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=drop-db
NEXT_PUBLIC_APPWRITE_COLLECTION_ID=games
NEXT_PUBLIC_OIDC_PROVIDER_NAME=oidc
NEXT_PUBLIC_SLACK_AVATAR_FUNCTION_ID=your-function-id
NEXT_PUBLIC_ADD_OWNER_FUNCTION_ID=your-function-id
NEXT_PUBLIC_WEB_DEPLOY_FUNCTION_ID=your-function-id
```

4. Run the development server:
```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building

```bash
pnpm build
pnpm start
```

## Appwrite Stuff because serverless is fun :D

### Required Collections

1. **games** - Game listings and metadata
2. **libraries** - User game libraries
3. **wishlists** - User wishlists
4. **news** - News articles
5. **invites** - Game ownership invites
6. **web-builds** - Web game deployment metadata

### Required Buckets

1. **game-builds** - Game build files (Windows, Mac, Linux)
2. **web-game-files** - Web game static files
3. **game-media** - Game screenshots, videos, and promotional images

(psst, this project was submitted to Moonshot, check it out!)
<div align="center">
  <a href="https://moonshot.hackclub.com" target="_blank">
    <img src="https://hc-cdn.hel1.your-objectstorage.com/s/v3/35ad2be8c916670f3e1ac63c1df04d76a4b337d1_moonshot.png" 
         alt="This project is part of Moonshot, a 4-day hackathon in Florida visiting Kennedy Space Center and Universal Studios!" 
         style="width: 100%;">
  </a>
</div>

### Required Functions

1. **add-owner-function** - Handle game ownership transfers
2. **slack-function** - Fetch user avatars from Slack
3. **web-game-deploy-function** - Deploy web games from zip files
4. **upload-game-media-function** - Process and upload game media
