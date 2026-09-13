# FlashDrobe - Digital Wardrobe & AI Stylist

A mobile-first PWA for managing your wardrobe, getting AI-powered outfit recommendations, and virtually trying on clothes. Built with React 19, Vite, Express, Firebase, and Google Gemini AI.

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | >= 18.0 | Required for esbuild and ES module support |
| npm | >= 8.0 | Ships with Node.js |
| Firebase project | Free tier | For user auth, wardrobe sync, and cloud storage |
| Gemini API key | Free tier available | For AI outfit recommendations and virtual try-on |
| Hugging Face token | Optional | For higher-priority virtual try-on queue access |

## Installation

```bash
# 1. Clone the repository
git clone <repository-url>

# 2. Navigate to the project folder
cd flashdrobe

# 3. Install dependencies
npm install
```

## Environment Variables

After installing dependencies, you **must** create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Then open `.env.local` and fill in your API keys. See [`.env.example`](.env.example) for the full template with explanations.

### Required Variables

| Variable | Where to get it |
|----------|----------------|
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) |
| `VITE_FIREBASE_API_KEY` | Firebase Console > Project Settings > General > Your apps |
| `VITE_FIREBASE_AUTH_DOMAIN` | Same as above |
| `VITE_FIREBASE_PROJECT_ID` | Same as above |
| `VITE_FIREBASE_STORAGE_BUCKET` | Same as above |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Same as above |
| `VITE_FIREBASE_APP_ID` | Same as above |

### Optional Variables

| Variable | Purpose |
|----------|---------|
| `HF_TOKEN` | [Hugging Face token](https://huggingface.co/settings/tokens) for higher-priority virtual try-on queue |
| `APP_URL` | Override the public URL (defaults to `http://localhost:3000`) |
| `DISABLE_HMR` | Set to `true` to disable Vite hot module replacement |

## Running the App

```bash
npm run dev
```

The app runs at **http://localhost:3000** (not the default Vite port).

The Express server handles both the API endpoints and the Vite dev server middleware. This single command starts everything.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (Express + Vite) |
| `npm run build` | Build for production |
| `npm run start` | Run the production build |
| `npm run lint` | TypeScript type checking (no ESLint) |
| `npm run clean` | Remove build artifacts |

## Building for Production

```bash
npm run build    # Creates dist/ folder
npm run start    # Serves the production build on port 3000
```

## Type Checking

```bash
npm run lint
```

This runs `tsc --noEmit`. There is no ESLint or Prettier configured. TypeScript is the primary code quality tool.

## Common Issues

### Blank white screen

**Cause:** A runtime JavaScript error crashed the app.

**Fix:** Open the browser console (F12) and check the error message. The most common cause is missing or invalid environment variables.

### Firebase "Invalid API Key"

**Cause:** Missing or incorrect Firebase credentials in `.env.local`.

**Fix:** Verify all `VITE_FIREBASE_*` variables match your Firebase Console project settings.

### Camera preview not working

**Cause:** Camera permission was denied or blocked.

**Fix:** Allow camera access in your browser/device settings and reload the page.

### Virtual Try-On not working

**Cause:** Missing `GEMINI_API_KEY` or `HF_TOKEN`, or the model service is temporarily unavailable.

**Fix:** Verify your API keys in `.env.local`. Virtual try-on requires a valid Gemini API key. An optional Hugging Face token improves reliability.

### "Cannot find module" errors on startup

**Cause:** Dependencies not installed.

**Fix:** Run `npm install` before starting the dev server.

### Port 3000 already in use

**Cause:** Another process is using port 3000.

**Fix:** Stop the other process, or change the `PORT` constant in `server.ts`.

## Project Structure

```
flashdrobe/
  server.ts              # Express server + Vite middleware + API endpoints
  src/
    App.tsx              # Main app with tab-based navigation
    context/             # React Context for state management (WardrobeContext)
    components/          # UI components organized by feature
      wardrobe/          # Wardrobe grid, item detail, add/edit clothing
      tryon/             # Virtual Dressing Room, body capture, try-on
      match/             # Mix & Match, outfit recommendations
      favorites/         # Saved outfits
      stylist/           # AI Stylist
      profile/           # User profile and body type
    hooks/               # Custom React hooks
    services/            # Business logic services
    data/                # Initial wardrobe data, categories, try-on models
    types.ts             # TypeScript interfaces
  firestore.rules        # Firebase security rules
  storage.rules          # Firebase storage rules
```

## Key Features

- **Wardrobe Management** - Add, edit, organize clothing items with categories, tags, and photos
- **AI Outfit Recommendations** - Gemini AI suggests outfits based on your wardrobe, weather, and occasion
- **Mix & Match** - Manual outfit builder with drag-and-drop layering
- **Saved Outfits** - Save and manage favorite outfit combinations
- **Virtual Dressing Room** - Layer clothing items on a model or your own photo
- **Virtual Try-On** - AI-powered garment visualization on your body
- **Camera Body Capture** - Capture front/side photos for personalized try-on
- **Background Removal** - AI-powered background removal for clothing photos
- **Weather Integration** - Open-Meteo weather data for outfit suggestions (no API key needed)
- **Firebase Sync** - Cloud backup of wardrobe, outfits, and user profile

## Tech Stack

- **Frontend:** React 19, TypeScript 5.8, Tailwind CSS 4, Vite 6
- **Backend:** Express, tsx (dev), esbuild (production)
- **AI:** Google Gemini (`@google/genai`), Hugging Face Gradio client
- **Database:** Firebase Firestore, Firebase Auth, Firebase Storage
- **Animations:** Motion (Framer Motion successor)
- **Icons:** Lucide React
