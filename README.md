# FlashDrobe - Digital Wardrobe & AI Stylist

A mobile-first PWA for managing your wardrobe, getting AI-powered outfit recommendations, and virtually trying on clothes. Built with React 19, Vite, Express, Firebase, and Google Gemini AI.

> **Note:** This repository is under active development. Contributors may encounter experimental features that are still being improved.

## Quick Environment Example

```
GEMINI_API_KEY=xxxxxxxx

VITE_FIREBASE_API_KEY=xxxxxxxx
VITE_FIREBASE_AUTH_DOMAIN=xxxxxxxx
VITE_FIREBASE_PROJECT_ID=xxxxxxxx
VITE_FIREBASE_STORAGE_BUCKET=xxxxxxxx
VITE_FIREBASE_MESSAGING_SENDER_ID=xxxxxxxx
VITE_FIREBASE_APP_ID=xxxxxxxx

HF_TOKEN=xxxxxxxx
```

## Before You Start

Before running FlashDrobe, you must have the following accounts and access:

- **Firebase Project Access** - Contact a project administrator to be added to the FlashDrobe Firebase project
- **Google AI Studio Account** - For Gemini API key generation
- **Hugging Face Account** - For virtual try-on reliability and AI image features

> **Important:** Without Firebase project access, you cannot obtain the required environment variables and the app will not work.

## Firebase Project Access

FlashDrobe uses a shared Firebase project for all development. Contributors must be added to this project before they can retrieve the necessary credentials.

**How to request access:**

1. Contact a FlashDrobe project administrator
2. Provide your Gmail address to the administrator
3. Wait for confirmation that you've been added to the Firebase project
4. Once added, you can retrieve the Firebase Web App credentials

**Important:** You must be added to the Firebase project first. Credentials cannot be generated independently.

## Step 1 - Retrieve Firebase Credentials

Once you have access to the Firebase project:

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select the **FlashDrobe** project
3. Navigate to **Project Settings** → **General** → **Your Apps**
4. Select the **FlashDrobe Web App**
5. Copy the following values:

| Variable | Description |
|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Authentication domain |
| `VITE_FIREBASE_PROJECT_ID` | Project identifier |
| `VITE_FIREBASE_STORAGE_BUCKET` | Cloud storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Cloud Messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Web app identifier |

## Step 2 - Generate a Gemini API Key

FlashDrobe uses Google Gemini AI for outfit recommendations and virtual try-on features.

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click **Create API key**
4. Copy the generated key
5. Save it as `GEMINI_API_KEY` in your `.env.local` file

**Note:** The Gemini API has a free tier suitable for development.

## Step 3 - Generate a Hugging Face Token

**Strongly Recommended:** `HF_TOKEN` is strongly recommended for FlashDrobe to function properly.

The Hugging Face token is needed for:
- **Virtual Try-On reliability** - Ensures consistent access to AI models
- **AI image features** - Powers background removal and image processing
- **Future image-generation functionality** - Upcoming features will require this token

**How to obtain a Hugging Face token:**

1. Go to [Hugging Face](https://huggingface.co)
2. Create an account (or sign in if you already have one)
3. Open **Settings** → **Access Tokens**
4. Click **Create new token**
5. Give it a descriptive name (e.g., "FlashDrobe Development")
6. Copy the token
7. Save it as `HF_TOKEN` in your `.env.local` file

**Note:** Without `HF_TOKEN`, virtual try-on features may fail or be unreliable.

## Step 4 - Create .env.local

After obtaining all credentials, create your environment file:

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in all required values:

```bash
# Required - Gemini AI API Key
GEMINI_API_KEY="your-gemini-api-key-here"

# Required - Firebase Configuration
VITE_FIREBASE_API_KEY="your-firebase-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="000000000000"
VITE_FIREBASE_APP_ID="1:000000000000:web:xxxxxxxxxxxx"

# Strongly Recommended - Hugging Face Token
HF_TOKEN="your-hugging-face-token"

# Optional - App Configuration
APP_URL="http://localhost:3000"
DISABLE_HMR=""
```

**Note:** `.env.local` is git-ignored and will not be committed to the repository.

## Step 5 - Install Dependencies

```bash
npm install
```

This will install all required packages including React, Vite, Express, Firebase, and AI libraries.

## Step 6 - Run FlashDrobe

```bash
npm run dev
```

This starts both the Express API server and Vite development server.

## Step 7 - Open the App

Open your browser and navigate to:

```
http://localhost:3000
```

**Note:** The app runs on port 3000, not the default Vite port.

---

## Contributor Checklist

Use this checklist to ensure you have everything set up correctly:

- [ ] Request Firebase access from project administrator
- [ ] Get Gemini API key from Google AI Studio
- [ ] Get Hugging Face token from huggingface.co
- [ ] Create `.env.local` with all required variables
- [ ] Run `npm install`
- [ ] Run `npm run dev`
- [ ] Open http://localhost:3000 and verify the app loads

---

## Frequently Asked Questions

### Q: Why can't I access Firebase credentials?

**A:** You must be added to the FlashDrobe Firebase project. Contact a project administrator and provide your Gmail address. Once added, you can retrieve the credentials from the Firebase Console.

### Q: Why is Gemini not working?

**A:** Verify your `GEMINI_API_KEY` is set correctly in `.env.local`. You can check if the key is valid at [Google AI Studio](https://aistudio.google.com/apikey). Ensure the key hasn't exceeded its quota.

### Q: Why is Virtual Try-On failing?

**A:** Verify your `HF_TOKEN` is set correctly in `.env.local` and that your Gemini configuration is working. Virtual Try-On requires both the Hugging Face token and a valid Gemini API key.

---

## Common Setup Problems

### Firebase Access Denied

**Symptom:** Cannot access Firebase Console or credentials are invalid.

**Cause:** You haven't been added to the FlashDrobe Firebase project.

**Fix:** Contact a project administrator to be added to the Firebase project. You must be added before you can access the credentials.

### Invalid Firebase Credentials

**Symptom:** App shows "Invalid API Key" error or fails to connect to Firebase.

**Cause:** Missing or incorrect Firebase environment variables.

**Fix:** Verify all `VITE_FIREBASE_*` variables in `.env.local` match your Firebase Console project settings exactly.

### Gemini API Key Issues

**Symptom:** AI features (outfit recommendations, virtual try-on) fail to work.

**Cause:** Missing or invalid `GEMINI_API_KEY`.

**Fix:** 
1. Verify `GEMINI_API_KEY` is set in `.env.local`
2. Check that the key is valid at [Google AI Studio](https://aistudio.google.com/apikey)
3. Ensure the key hasn't exceeded its quota

### Hugging Face Token Issues

**Symptom:** Virtual try-on features fail or are unreliable.

**Cause:** Missing or invalid `HF_TOKEN`.

**Fix:**
1. Verify `HF_TOKEN` is set in `.env.local`
2. Check that the token is valid at [Hugging Face Settings](https://huggingface.co/settings/tokens)
3. Ensure the token has the correct permissions

### Camera Access Issues

**Symptom:** Camera preview not working or body capture fails.

**Cause:** Camera permission was denied or blocked by the browser.

**Fix:**
1. Allow camera access in your browser settings
2. Reload the page after granting permissions
3. Check that your device has a working camera

### Blank White Screen

**Symptom:** App loads but shows a blank white screen.

**Cause:** Runtime JavaScript error crashed the app.

**Fix:**
1. Open browser developer tools (F12)
2. Check the Console tab for error messages
3. Most common cause is missing or invalid environment variables
4. Verify all required variables are set in `.env.local`

### "Cannot find module" Errors

**Symptom:** Error messages about missing modules when starting the app.

**Cause:** Dependencies not installed.

**Fix:** Run `npm install` before starting the dev server.

### Port 3000 Already in Use

**Symptom:** Error that port 3000 is already in use.

**Cause:** Another process is using port 3000.

**Fix:**
1. Stop the other process using port 3000
2. Or change the `PORT` constant in `server.ts`

---

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

## Need Help?

If you encounter issues not covered in this guide:

1. Check the [Common Setup Problems](#common-setup-problems) section
2. Open browser developer tools (F12) and check the Console for errors
3. Contact a project administrator for Firebase access issues
4. Create an issue in the repository for bugs or feature requests