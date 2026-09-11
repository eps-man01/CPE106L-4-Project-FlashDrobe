# AGENTS.md

## Project Overview

- React 19 + Vite + Express SPA ("Flashdrobe - Digital Wardrobe & AI Stylist")
- Mobile-first PWA designed for Android with Gemini AI integration
- Firebase/Firestore backend for user data and storage

## Development Commands

```bash
# Install dependencies
npm install

# Create .env.local with GEMINI_API_KEY (required for AI features)
cp .env.example .env.local
# Edit .env.local and add your GEMINI_API_KEY

# Start development server (runs Express + Vite middleware)
npm run dev

# Lint (TypeScript type checking only - no ESLint)
npm run lint

# Build for production
npm run build

# Start production server
npm start

# Clean build artifacts
npm run clean
```

## Architecture Notes

- **Dev server**: `npm run dev` runs `tsx server.ts` (not `vite dev`). The Express server uses Vite in middleware mode.
- **AI endpoints**: `/api/recommend-outfit`, `/api/virtual-try-on`, `/api/virtual-try-on/generate` - all require `GEMINI_API_KEY` in `.env.local`
- **Weather API**: Uses Open-Meteo (no API key needed), requires GPS coordinates (lat/lon)
- **Path alias**: `@/` maps to project root (configured in `tsconfig.json` and `vite.config.ts`)

## Key Files

- `server.ts` - Express server with all API endpoints and Vite middleware
- `src/App.tsx` - Main app component with tab-based navigation
- `src/context/WardrobeContext.tsx` - Central state management (React Context)
- `src/types.ts` - TypeScript interfaces for wardrobe items
- `src/services/VirtualTryOnService.ts` - Virtual try-on orchestration
- `src/services/ImageProcessingService.ts` - Body image validation/capture
- `src/data/initialWardrobe.ts` - Default wardrobe items, categories, user profile
- `firestore.rules` / `storage.rules` - Firebase security rules

## Conventions

- **Linting**: Only TypeScript type checking (`tsc --noEmit`), no ESLint configured
- **Formatting**: No Prettier or formatter configured
- **Package manager**: npm (bun.lock present but npm is used in scripts)
- **Module type**: ES modules (`"type": "module"` in package.json)
- **UI**: Tailwind CSS 4.x with `@tailwindcss/vite` plugin
- **Animations**: Uses `motion` package (Framer Motion successor)
- **Icons**: Lucide React icons

## Environment Variables

- `GEMINI_API_KEY` - Required for AI outfit recommendations and virtual try-on
- `APP_URL` - The URL where this app is hosted
- `DISABLE_HMR` - Disables Vite HMR when set to 'true'

## Testing

No test framework is configured. No test scripts exist in package.json.

## Known Issues

- No ESLint or Prettier configured - rely on TypeScript for type safety
- `bun.lock` exists but npm is used in scripts - potential package manager mismatch
- `Zone.Identifier` files present (Windows NTFS artifact) - safe to ignore
