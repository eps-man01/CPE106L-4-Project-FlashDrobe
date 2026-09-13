import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { Client as GradioClient, handle_file } from '@gradio/client';
import { createServer as createViteServer } from 'vite';

dotenv.config();
dotenv.config({ path: '.env.local' });

// Retry helper with exponential backoff for Gradio/Hugging Face calls
const MAX_GRADIO_RETRIES = 3;
const GRADIO_RETRY_DELAYS = [2000, 4000, 8000];
async function retryGradio<T>(fn: () => Promise<T>, label = 'gradio'): Promise<T> {
  for (let attempt = 0; attempt < MAX_GRADIO_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const status = err?.status || err?.statusCode;
      const msg = err?.message || '';
      // Detect ZeroGPU quota exhaustion — not retryable, throw immediately
      if (msg.includes('ZeroGPU quota') || msg.includes('exceeded your')) {
        throw err;
      }
      const isRetryable = status === 429 || status === 503 || msg.includes('queue') || msg.includes('rate') || msg.includes('overloaded');
      if (!isRetryable || attempt === MAX_GRADIO_RETRIES - 1) throw err;
      const delay = GRADIO_RETRY_DELAYS[attempt] || 4000;
      console.warn(`${label} attempt ${attempt + 1} failed (${status || msg.substring(0, 60)}), retrying in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error(`${label}: all retries exhausted`);
}

// Detect ZeroGPU quota error and extract wait time
function parseZeroGPUError(msg: string): { isQuota: boolean; waitTime: string } {
  const match = msg.match(/Try again in ([\d:]+)/);
  return {
    isQuota: msg.includes('ZeroGPU quota') || msg.includes('exceeded your'),
    waitTime: match?.[1] || 'unknown',
  };
}

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Lazy initialization of Gemini client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set. Outfits will use heuristic fallback if not available.');
    }
    genAIClient = new GoogleGenAI({
      apiKey: apiKey || 'dummy-key-for-init',
      httpOptions: {
        headers: {
          'User-Agent': 'flashdrobe/1.0',
        },
      },
    });
  }
  return genAIClient;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'Flashdrobe Android Backend' });
});

// Live Weather Endpoint (backed by Open-Meteo API & reverse geocoding)
app.get('/api/weather', async (req, res) => {
  try {
    if (!req.query.lat || !req.query.lon) {
      return res.status(400).json({ error: 'GPS coordinates (lat and lon) are required' });
    }

    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    // Try reverse geocoding to find the real city/locality name for GPS coordinates
    let cityName = (req.query.city as string) || '';
    if (!cityName || cityName === 'Current Location') {
      try {
        const geoRes = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
        );
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          cityName = geoData.locality || geoData.city || geoData.principalSubdivision || 'Current Location';
        }
      } catch {
        cityName = 'Current Location';
      }
    }

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;

    const weatherResponse = await fetch(weatherUrl);
    if (!weatherResponse.ok) {
      throw new Error(`Weather API returned ${weatherResponse.status}`);
    }

    const data = await weatherResponse.json();
    const current = data.current;
    const daily = data.daily;

    // Map WMO weather code to friendly label and condition
    const wmoCode = current.weather_code;
    let condition = 'Clear';
    let icon = 'sun';
    let summary = 'Sunny & Warm';

    if (wmoCode === 0) {
      condition = 'Sunny';
      icon = 'sun';
      summary = 'Clear and bright skies';
    } else if (wmoCode >= 1 && wmoCode <= 3) {
      condition = 'Partly Cloudy';
      icon = 'cloud-sun';
      summary = 'Scattered clouds';
    } else if (wmoCode === 45 || wmoCode === 48) {
      condition = 'Foggy';
      icon = 'cloud-fog';
      summary = 'Misty and low visibility';
    } else if ((wmoCode >= 51 && wmoCode <= 67) || (wmoCode >= 80 && wmoCode <= 82)) {
      condition = 'Rainy';
      icon = 'cloud-rain';
      summary = 'Light to moderate rain showers';
    } else if (wmoCode >= 71 && wmoCode <= 77) {
      condition = 'Cold / Snow';
      icon = 'snowflake';
      summary = 'Chilly weather with flurries';
    } else if (wmoCode >= 95) {
      condition = 'Thunderstorm';
      icon = 'cloud-lightning';
      summary = 'Thunderstorms and heavy rain';
    }

    const result = {
      city: cityName || 'Current Location',
      lat,
      lon,
      tempC: Math.round(current.temperature_2m),
      feelsLikeC: Math.round(current.apparent_temperature),
      humidity: current.relative_humidity_2m,
      precipitation: current.precipitation,
      rainChance: daily?.precipitation_probability_max?.[0] ?? (current.precipitation > 0 ? 80 : 15),
      windSpeedKmH: Math.round(current.wind_speed_10m),
      condition,
      icon,
      summary,
      highTempC: Math.round(daily?.temperature_2m_max?.[0] ?? current.temperature_2m + 3),
      lowTempC: Math.round(daily?.temperature_2m_min?.[0] ?? current.temperature_2m - 4),
      timestamp: new Date().toISOString(),
    };

    res.json(result);
  } catch (error: any) {
    console.error('Weather error:', error);
    res.status(500).json({
      error: 'Failed to fetch weather for GPS coordinates',
      message: error.message,
    });
  }
});

// Body Photo Analysis Endpoint — Gemini Vision
app.post('/api/analyze-body', async (req, res) => {
  try {
    const { frontPhotoDataUrl } = req.body;
    if (!frontPhotoDataUrl || typeof frontPhotoDataUrl !== 'string') {
      return res.status(400).json({ error: 'frontPhotoDataUrl is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({
        success: true,
        engine: 'heuristic',
        analysis: getHeuristicBodyAnalysis(),
      });
    }

    // Extract base64 from data URL
    const commaIdx = frontPhotoDataUrl.indexOf(',');
    if (commaIdx === -1) {
      return res.status(400).json({ error: 'Invalid data URL format' });
    }
    const base64Data = frontPhotoDataUrl.slice(commaIdx + 1);
    const mimeType = frontPhotoDataUrl.slice(5, frontPhotoDataUrl.indexOf(';'));

    const ai = getGenAI();

    const prompt = `Analyze this full-body photograph for fashion styling purposes.
Return a JSON object with these fields:

1. estimatedHeightCm (number): Estimate the person's height in centimeters based on body proportions, limb ratios, and torso-to-leg ratio. Be realistic — most adults fall between 150-195cm.

2. estimatedWeightKg (number): Estimate the person's weight in kilograms based on visible body mass, build, and proportions. Be realistic.

3. sex (string): "male" or "female" based on visible physiological characteristics.

4. bodyTypeCode (string): Classify into one of these body types:
   Male: "01" Slender/Lean, "02" Soft/Round, "03" Athletic/V-Taper, "04" Standard/Average,
         "05" Muscular/Broad, "06" Thick/Stocky, "07" Lean/Tall, "08" Large/Tall, "09" Extended Plus
   Female: "10" Slender/Petite, "11" Soft/Curved, "12" Athletic/Toned, "13" Standard/Balanced,
           "14" Muscular/Athletic, "15" Curvy/Hourglass, "16" Lean/Tall, "17" Full-Figured, "18" Maximum Plus

5. bodyTypeLabel (string): The label for the selected code.

6. bodyProportions (string): Describe torso-to-leg ratio, shoulder width relative to hips, waist definition, arm length, neck length. Be specific and factual.

7. buildCategory (string): One of "slim", "average", "athletic", "broad", "heavy".

8. stylingRules (string[]): 3-5 specific, actionable styling rules for this body. E.g.:
   - "Wear structured blazers to broaden shoulder appearance"
   - "High-rise bottoms elongate the leg line for your torso ratio"
   - "Avoid oversized tops that hide your athletic frame"

9. wardrobePriorities (string[]): 2-3 items. E.g. "Emphasize waist definition", "Add vertical lines for height", "Avoid bulk around midsection"`;

    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let analysisResult: any = null;
    let usedModel = '';

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            { text: prompt },
            { inlineData: { mimeType: mimeType || 'image/jpeg', data: base64Data } },
          ],
          config: {
            systemInstruction: 'You are an expert fashion stylist and body proportion analyst. Return clean, structured JSON conforming to the schema.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                estimatedHeightCm: { type: Type.NUMBER },
                estimatedWeightKg: { type: Type.NUMBER },
                sex: { type: Type.STRING },
                bodyTypeCode: { type: Type.STRING },
                bodyTypeLabel: { type: Type.STRING },
                bodyProportions: { type: Type.STRING },
                buildCategory: { type: Type.STRING },
                stylingRules: { type: Type.ARRAY, items: { type: Type.STRING } },
                wardrobePriorities: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: [
                'estimatedHeightCm', 'estimatedWeightKg', 'sex', 'bodyTypeCode',
                'bodyTypeLabel', 'bodyProportions', 'buildCategory', 'stylingRules', 'wardrobePriorities',
              ],
            },
          },
        });

        const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          analysisResult = JSON.parse(text);
          usedModel = model;
          break;
        }
      } catch (err: any) {
        console.warn(`Body analysis model ${model} failed:`, err.message?.substring(0, 80));
        continue;
      }
    }

    if (!analysisResult) {
      return res.status(200).json({
        success: true,
        engine: 'heuristic-fallback',
        analysis: getHeuristicBodyAnalysis(),
      });
    }

    return res.status(200).json({
      success: true,
      engine: usedModel,
      analysis: {
        heightCm: Math.round(analysisResult.estimatedHeightCm) || 172,
        weightKg: Math.round(analysisResult.estimatedWeightKg) || 70,
        sex: analysisResult.sex === 'female' ? 'female' : 'male',
        bodyTypeCode: analysisResult.bodyTypeCode || '04',
        bodyTypeLabel: analysisResult.bodyTypeLabel || 'Standard / Average',
        bodyProportions: analysisResult.bodyProportions || 'Standard proportions',
        buildCategory: analysisResult.buildCategory || 'average',
        stylingRules: Array.isArray(analysisResult.stylingRules) ? analysisResult.stylingRules : [],
        wardrobePriorities: Array.isArray(analysisResult.wardrobePriorities) ? analysisResult.wardrobePriorities : [],
        analyzedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Body analysis error:', error.message);
    return res.status(200).json({
      success: true,
      engine: 'heuristic-error',
      analysis: getHeuristicBodyAnalysis(),
    });
  }
});

function getHeuristicBodyAnalysis() {
  return {
    heightCm: 172,
    weightKg: 70,
    sex: 'male' as const,
    bodyTypeCode: '04',
    bodyTypeLabel: 'Standard / Average',
    bodyProportions: 'Balanced proportions — standard torso-to-leg ratio, moderate shoulder width.',
    buildCategory: 'average',
    stylingRules: [
      'Stick to well-fitted clothing that follows your natural body lines.',
      'Use layering to add visual interest and structure.',
      'Choose neutral tones with one accent color for a polished look.',
    ],
    wardrobePriorities: [
      'Focus on fit over size — tailored pieces flatter most builds.',
      'Add a structured jacket to elevate casual outfits.',
    ],
    analyzedAt: new Date().toISOString(),
  };
}

// AI Outfit Recommendation Endpoint
app.post('/api/recommend-outfit', async (req, res) => {
  try {
    const { wardrobe, category, weather, userPreferences, occasionNotes } = req.body;

    if (!wardrobe || !Array.isArray(wardrobe) || wardrobe.length === 0) {
      return res.status(400).json({ error: 'Wardrobe items are required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // If API key is available, use Gemini model server-side
    if (apiKey) {
      const ai = getGenAI();

      const itemsSummary = wardrobe.map((item: any) => ({
        id: item.id,
        name: item.name,
        classification: item.classification, // Tops, Bottoms, Footwear, Outerwear, Accessories
        subType: item.subType || '',
        color: item.color || '',
        secondaryColor: item.secondaryColor || '',
        warmthLevel: item.warmthLevel || 2, // 1 to 5
        seasonSuitability: item.seasonSuitability || 'All-weather',
        tags: item.tags || [],
        brand: item.brand || '',
      }));

      const prompt = `You are Flashdrobe's intelligent personal AI wardrobe stylist for a mobile app.
Your task is to select the BEST outfit combination exclusively from the user's available digital wardrobe items, tailored specifically for:
1. Target Category / Occasion: "${category || 'Casual Wear'}"
2. Current Weather Conditions:
   - Location: ${weather ? weather.city : 'Not available (GPS inactive)'}
   - Temperature: ${weather ? `${weather.tempC}°C (Feels like: ${weather.feelsLikeC}°C)` : 'Ambient default'}
   - Weather Status: ${weather ? `${weather.condition} (${weather.summary})` : 'Standard'}
   - Rain Chance: ${weather ? `${weather.rainChance}%` : 'N/A'}
   - Humidity: ${weather ? `${weather.humidity}%` : 'N/A'}
3. User Context / Preferences: ${JSON.stringify(userPreferences || {})}
4. Extra Occasion Notes: "${occasionNotes || ''}"

Available Wardrobe Items:
${JSON.stringify(itemsSummary, null, 2)}

Requirements:
- CRITICAL: Each outfit's selectedItemIds MUST include items from MULTIPLE clothing categories. You MUST pick at least 1 "Tops", 1 "Bottoms", and 1 "Footwear" if available. NEVER return an outfit with only tops or only one category.
- If the weather is cold (below 22°C), windy, or rainy, select an appropriate "Outerwear" if available.
- Select 1-2 complementary "Accessories" if available.
- All 'selectedItemIds' MUST be valid IDs from the provided wardrobe list.
- Tailor the styling advice, fabric drape, and silhouette recommendations to flatter the user's biological sex (${userPreferences?.sex || 'general'}) and specific body type silhouette (${userPreferences?.bodyType || 'standard build'}).
- User Physical Profile: Height ${userPreferences?.heightCm || 'N/A'}cm, Weight ${userPreferences?.weightKg || 'N/A'}kg. Body proportions: ${userPreferences?.bodyProportions || 'Standard'}. Apply these personalized styling rules: ${Array.isArray(userPreferences?.stylingRules) ? userPreferences.stylingRules.join('; ') : 'Standard balanced styling'}.
- Provide practical, fashion-forward styling advice, explaining why the outfit matches the weather, colors, and category.
- Give a weather suitability score from 1 to 100.
`;

      const outfitModelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
      let response: any = null;

      for (const model of outfitModelsToTry) {
        try {
          response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              systemInstruction: 'You are an expert fashion stylist and wardrobe optimization AI. You always return structured JSON that adheres strictly to the schema.',
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  outfitName: {
                    type: Type.STRING,
                    description: 'A stylish, catchy title for this outfit combination',
                  },
                  selectedItemIds: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'List of exact item IDs chosen from the wardrobe',
                  },
                  categoryMatch: {
                    type: Type.STRING,
                    description: 'How this fits the selected category',
                  },
                  weatherCompatibility: {
                    type: Type.STRING,
                    description: 'Analysis of how breathable, warm, or water-resistant this look is for the current weather',
                  },
                  weatherScore: {
                    type: Type.INTEGER,
                    description: 'Score from 1 to 100 for weather appropriateness',
                  },
                  colorHarmony: {
                    type: Type.STRING,
                    description: 'Description of color palette synergy (e.g., earthy tones, monochromatic, high-contrast)',
                  },
                  stylingTips: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '2 to 3 actionable styling tips for wearing this outfit',
                  },
                  alternativeSuggestions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '1-2 items that could be swapped if preferences change',
                  },
                },
                required: ['outfitName', 'selectedItemIds', 'weatherCompatibility', 'weatherScore', 'stylingTips'],
              },
            },
          });
          if (response && response.text) break;
        } catch (err: any) {
          console.warn(`Outfit recommendation model ${model} unavailable (${err?.status || err?.message}). Trying fallback model...`);
        }
      }

      if (response && response.text) {
        const parsed = JSON.parse(response.text || '{}');

        // Validate multi-category selection
        const itemIds = parsed.selectedItemIds || [];
        const classifications = new Set(
          itemIds.map((id: string) => {
            const item = wardrobe.find((w: any) => w.id === id);
            return item?.classification;
          }).filter(Boolean)
        );

        if (classifications.size < 2) {
          console.warn(`[Single] Outfit has only ${classifications.size} category(ies), supplementing...`);
          const missingClasses = ['Tops', 'Bottoms', 'Footwear'].filter((c) => !classifications.has(c));
          for (const cls of missingClasses) {
            const candidates = wardrobe.filter((w: any) => w.classification === cls && !itemIds.includes(w.id));
            if (candidates.length > 0) {
              const pick = candidates[Math.floor(Math.random() * candidates.length)];
              itemIds.push(pick.id);
            }
          }
          parsed.selectedItemIds = itemIds;
        }

        return res.json({
          success: true,
          recommendation: parsed,
          engine: 'Flashdrobe AI Stylist',
        });
      }
    }

    // Heuristic Fallback if API key is missing in dev
    const tops = wardrobe.filter((i: any) => i.classification === 'Tops');
    const bottoms = wardrobe.filter((i: any) => i.classification === 'Bottoms');
    const footwear = wardrobe.filter((i: any) => i.classification === 'Footwear');
    const outerwear = wardrobe.filter((i: any) => i.classification === 'Outerwear');
    const accessories = wardrobe.filter((i: any) => i.classification === 'Accessories');

    const isColdOrRainy = (weather?.tempC && weather.tempC < 23) || (weather?.rainChance && weather.rainChance > 40);

    const selectedIds: string[] = [];

    // Prioritize items tagged with category or general
    const pickBest = (list: any[]) => {
      if (list.length === 0) return null;
      const matched = list.find((item) => item.tags?.some((t: string) => t.toLowerCase().includes(category.toLowerCase())));
      return matched || list[Math.floor(Math.random() * list.length)];
    };

    const top = pickBest(tops);
    if (top) selectedIds.push(top.id);

    const bottom = pickBest(bottoms);
    if (bottom) selectedIds.push(bottom.id);

    const shoe = pickBest(footwear);
    if (shoe) selectedIds.push(shoe.id);

    if (isColdOrRainy && outerwear.length > 0) {
      const jacket = pickBest(outerwear);
      if (jacket) selectedIds.push(jacket.id);
    }

    if (accessories.length > 0) {
      const acc = pickBest(accessories);
      if (acc) selectedIds.push(acc.id);
    }

    return res.json({
      success: true,
      recommendation: {
        outfitName: `${category} Smart Ensemble`,
        selectedItemIds: selectedIds,
        categoryMatch: `Coordinated specifically for ${category} with comfortable fabrics and versatile silhouette.`,
        weatherCompatibility: weather
          ? `Balanced for ${weather.tempC}°C ${weather.condition.toLowerCase()} conditions.`
          : 'Designed for standard daily comfort and versatile layering.',
        weatherScore: 92,
        colorHarmony: 'Balanced neutral and accent harmony.',
        stylingTips: [
          'Tuck in the top slightly for a cleaner proportion.',
          isColdOrRainy ? 'Keep your outer layer ready in case temperature drops.' : 'Opt for breathable footwear on warmer days.',
          'Accessorize minimally to keep the focus on clean lines.',
        ],
        alternativeSuggestions: ['Swap footwear with sneakers for extra walking comfort.'],
      },
      engine: 'Flashdrobe AI Stylist',
    });
  } catch (error: any) {
    console.error('Error generating outfit recommendation:', error);
    res.status(500).json({
      error: 'Failed to generate recommendation',
      message: error.message,
    });
  }
});

// Batch AI Outfit Recommendation Endpoint (for carousel)
app.post('/api/recommend-outfit/batch', async (req, res) => {
  try {
    const { wardrobe, category, weather, userPreferences, occasionNotes, count } = req.body;

    if (!wardrobe || !Array.isArray(wardrobe) || wardrobe.length === 0) {
      return res.status(400).json({ error: 'Wardrobe items are required' });
    }

    const batchSize = Math.min(Math.max(count || 3, 1), 5);
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      const ai = getGenAI();

      const itemsSummary = wardrobe.map((item: any) => ({
        id: item.id,
        name: item.name,
        classification: item.classification,
        subType: item.subType || '',
        color: item.color || '',
        secondaryColor: item.secondaryColor || '',
        warmthLevel: item.warmthLevel || 2,
        seasonSuitability: item.seasonSuitability || 'All-weather',
        tags: item.tags || [],
        brand: item.brand || '',
      }));

      const styleVariants = [
        'classic and timeless',
        'bold and expressive',
        'minimal and modern',
        'relaxed and streetwear-inspired',
        'elegant and polished',
      ];

      const prompt = `You are Flashdrobe's intelligent personal AI wardrobe stylist.
Generate ${batchSize} DISTINCT outfit combinations from the user's digital wardrobe.
Each outfit must be unique — vary the color palette, style approach, and item selection.

Target Category / Occasion: "${category || 'Casual Wear'}"
Current Weather:
${weather ? `- Location: ${weather.city}, Temp: ${weather.tempC}°C (Feels like ${weather.feelsLikeC}°C), Condition: ${weather.condition}, Rain: ${weather.rainChance}%` : '- Weather data not available'}
User Context: ${JSON.stringify(userPreferences || {})}
User Physical Profile: Height ${userPreferences?.heightCm || 'N/A'}cm, Weight ${userPreferences?.weightKg || 'N/A'}kg. Body proportions: ${userPreferences?.bodyProportions || 'Standard'}. Apply these personalized styling rules: ${Array.isArray(userPreferences?.stylingRules) ? userPreferences.stylingRules.join('; ') : 'Standard balanced styling'}.
Extra Notes: "${occasionNotes || ''}"

Available Wardrobe Items:
${JSON.stringify(itemsSummary, null, 2)}

Requirements:
- Generate exactly ${batchSize} outfits, each with a different style approach.
- For outfit 1 use style: "${styleVariants[0]}"
- For outfit 2 use style: "${styleVariants[1]}"
- For outfit 3 use style: "${styleVariants[2]}"${batchSize > 3 ? `\n- For outfit 4 use style: "${styleVariants[3]}"` : ''}${batchSize > 4 ? `\n- For outfit 5 use style: "${styleVariants[4]}"` : ''}
- CRITICAL: Each outfit's selectedItemIds MUST include items from MULTIPLE clothing categories. You MUST pick at least 1 Top, 1 Bottom, and 1 Footwear for EVERY outfit. NEVER return outfits with only tops or only one category. Each outfit must be a complete head-to-toe look.
- Add Outerwear if weather is cold/rainy.
- All selectedItemIds MUST be valid IDs from the provided wardrobe.
- Return structured JSON with the schema below.`;

      const outfitModelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
      let response: any = null;

      for (const model of outfitModelsToTry) {
        try {
          response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              systemInstruction: 'You are an expert fashion stylist. Return valid JSON only.',
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  outfits: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        outfitName: { type: Type.STRING },
                        selectedItemIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                        categoryMatch: { type: Type.STRING },
                        weatherCompatibility: { type: Type.STRING },
                        weatherScore: { type: Type.INTEGER },
                        colorHarmony: { type: Type.STRING },
                        stylingTips: { type: Type.ARRAY, items: { type: Type.STRING } },
                        alternativeSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
                      },
                      required: ['outfitName', 'selectedItemIds', 'weatherCompatibility', 'weatherScore', 'stylingTips'],
                    },
                  },
                },
                required: ['outfits'],
              },
            },
          });
          if (response && response.text) break;
        } catch (err: any) {
          console.warn(`Batch model ${model} unavailable, trying next...`);
        }
      }

      if (response && response.text) {
        const parsed = JSON.parse(response.text || '{}');
        const recommendations = parsed.outfits || [parsed];

        // Validate multi-category selection: ensure each outfit has items from multiple classifications
        const validatedRecommendations = recommendations.map((rec: any) => {
          const itemIds = rec.selectedItemIds || [];
          const classifications = new Set(
            itemIds.map((id: string) => {
              const item = wardrobe.find((w: any) => w.id === id);
              return item?.classification;
            }).filter(Boolean)
          );

          // If outfit only has 1 or fewer categories, supplement with heuristic picks
          if (classifications.size < 2) {
            console.warn(`[Batch] Outfit "${rec.outfitName}" has only ${classifications.size} category(ies), supplementing...`);
            const missingClasses = ['Tops', 'Bottoms', 'Footwear'].filter((c) => !classifications.has(c));
            for (const cls of missingClasses) {
              const candidates = wardrobe.filter((w: any) => w.classification === cls && !itemIds.includes(w.id));
              if (candidates.length > 0) {
                const pick = candidates[Math.floor(Math.random() * candidates.length)];
                itemIds.push(pick.id);
              }
            }
            rec.selectedItemIds = itemIds;
          }
          return rec;
        });

        return res.json({
          success: true,
          recommendations: validatedRecommendations,
          engine: 'Flashdrobe AI Stylist',
        });
      }
    }

    // Heuristic fallback for batch
    const recommendations = [];
    for (let i = 0; i < batchSize; i++) {
      const tops = wardrobe.filter((w: any) => w.classification === 'Tops');
      const bottoms = wardrobe.filter((w: any) => w.classification === 'Bottoms');
      const footwear = wardrobe.filter((w: any) => w.classification === 'Footwear');
      const outerwear = wardrobe.filter((w: any) => w.classification === 'Outerwear');
      const accessories = wardrobe.filter((w: any) => w.classification === 'Accessories');

      const pick = (list: any[]) => list[Math.floor(Math.random() * list.length)];
      const ids: string[] = [];
      const top = pick(tops); if (top) ids.push(top.id);
      const bottom = pick(bottoms); if (bottom) ids.push(bottom.id);
      const shoe = pick(footwear); if (shoe) ids.push(shoe.id);
      if (weather?.tempC && weather.tempC < 23) { const j = pick(outerwear); if (j) ids.push(j.id); }
      if (accessories.length > 0) { const a = pick(accessories); if (a) ids.push(a.id); }

      const styles = ['Classic', 'Bold', 'Minimal', 'Street', 'Elegant'];
      recommendations.push({
        outfitName: `${styles[i % styles.length]} ${category} Look`,
        selectedItemIds: ids,
        categoryMatch: `${styles[i % styles.length]} take on ${category}`,
        weatherCompatibility: weather
          ? `Balanced for ${weather.tempC}°C ${weather.condition}`
          : 'Standard comfort outfit',
        weatherScore: 85 + Math.floor(Math.random() * 15),
        colorHarmony: 'Curated palette with complementary tones',
        stylingTips: ['Coordinate colors across layers', 'Keep proportions balanced'],
        alternativeSuggestions: ['Swap footwear for different vibe'],
      });
    }

    return res.json({
      success: true,
      recommendations,
      engine: 'Flashdrobe AI Stylist',
    });
  } catch (error: any) {
    console.error('Batch recommendation error:', error);
    res.status(500).json({ error: 'Failed to generate batch recommendations', message: error.message });
  }
});

// AI Virtual Try-On Fitting Room Endpoint
app.post('/api/virtual-try-on', async (req, res) => {
  try {
    const {
      gender,
      bodyType,
      items,
      viewAngle,
      occasion,
      modelImage,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one wardrobe item is required for virtual try-on' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      const ai = getGenAI();

      const itemsSummary = items.map((item: any) => ({
        id: item.id,
        name: item.name,
        classification: item.classification,
        subType: item.subType || '',
        color: item.colorName || item.color || '',
        warmthLevel: item.warmthLevel || 2,
        brand: item.brand || '',
      }));

      const prompt = `You are Flashdrobe's high-tech Virtual Fitting Room AI.
The user is virtually trying on an outfit combination in our digital fitting studio.
Analyze how this exact outfit will fit, drape, and harmonize on the user's physique:
- User Biological Sex: ${gender || 'unspecified'}
- User Body Type Silhouette: ${bodyType ? `${bodyType.label} (Code: ${bodyType.code}, Category: ${bodyType.category})` : 'Standard proportion'}
- Body Type Description: ${bodyType?.description || 'Balanced everyday build'}
- Body Type Styling Guidelines: ${bodyType?.stylingTip || 'Balanced classic silhouette'}
- Selected Garments for Try-On:
${JSON.stringify(itemsSummary, null, 2)}
- Current View Angle: ${viewAngle || 'front'} (options: front, three-quarter, detail)
- Intended Occasion: "${occasion || 'Daily Wear'}"

Evaluate:
1. Overall Fit & Silhouette Score (0 to 100).
2. Silhouette Harmonization: How the cuts and proportions complement the user's specific torso, waist, and leg lines.
3. Proportions & Drape: Neckline opening, shoulder seams, waist rise balance, and hem drape.
4. Garment Breakdown: For each worn piece, provide fit status (e.g. "Tailored shoulder contour", "High-rise waist elongation") and cut description.
5. Body Type Flatter Rating (0 to 100) based on fashion design principles.
6. 2-3 Actionable Tailoring / Styling adjustments (e.g. tucking tops, rolling sleeves, belt accentuation, pant break).
7. Overall Style Vibe (e.g. "Effortless Parisian Minimalist", "Structured Modern Executive").`;

      const tryOnModelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
      let aiResponse: any = null;

      for (const model of tryOnModelsToTry) {
        try {
          aiResponse = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              systemInstruction: 'You are an advanced digital fitting room stylist and body silhouette analyst. Return clean, structured JSON conforming to the schema.',
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  fitScore: {
                    type: Type.INTEGER,
                    description: 'Overall outfit fit score from 1 to 100',
                  },
                  silhouetteAnalysis: {
                    type: Type.STRING,
                    description: 'Comprehensive analysis of how the pieces drape on this specific body type',
                  },
                  proportionsFeedback: {
                    type: Type.STRING,
                    description: 'Detailed analysis of waistline, shoulder line, and vertical proportions',
                  },
                  garmentBreakdown: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        classification: { type: Type.STRING },
                        itemTitle: { type: Type.STRING },
                        fitType: { type: Type.STRING },
                        commentary: { type: Type.STRING },
                      },
                      required: ['classification', 'itemTitle', 'fitType', 'commentary'],
                    },
                  },
                  bodyTypeFlatterRating: {
                    type: Type.INTEGER,
                    description: 'Score from 1 to 100 on how flattering it is for the user body type',
                  },
                  tailoringAdvice: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Actionable styling and fit adjustments',
                  },
                  styleVibe: {
                    type: Type.STRING,
                    description: 'Fashion aesthetic descriptor',
                  },
                },
                required: [
                  'fitScore',
                  'silhouetteAnalysis',
                  'proportionsFeedback',
                  'garmentBreakdown',
                  'bodyTypeFlatterRating',
                  'tailoringAdvice',
                  'styleVibe',
                ],
              },
            },
          });
          if (aiResponse && aiResponse.text) break;
        } catch (err: any) {
          console.warn(`Virtual try-on model ${model} unavailable: ${err?.message}. Checking fallback...`);
        }
      }

      if (aiResponse && aiResponse.text) {
        const parsed = JSON.parse(aiResponse.text || '{}');
        return res.json({
          success: true,
          ...parsed,
          engine: 'Flashdrobe Gemini 2026 Virtual Fitting Engine',
        });
      }
    }

    // Heuristic Fallback if API key not available or model is loading
    const tops = items.filter((i: any) => i.classification === 'Tops');
    const bottoms = items.filter((i: any) => i.classification === 'Bottoms');
    const outerwear = items.filter((i: any) => i.classification === 'Outerwear');
    const footwear = items.filter((i: any) => i.classification === 'Footwear');

    const garmentBreakdown = items.map((item: any) => ({
      classification: item.classification,
      itemTitle: item.name,
      fitType: item.classification === 'Tops' ? 'Semi-fitted drape' : item.classification === 'Bottoms' ? 'Tailored straight-cut' : 'Standard alignment',
      commentary: `${item.name} in ${item.colorName || 'neutral tone'} cleanly establishes the ${item.classification.toLowerCase()} line.`,
    }));

    return res.json({
      success: true,
      fitScore: 94,
      silhouetteAnalysis: `The ${tops[0]?.name || 'top'} pairs cohesively with the ${bottoms[0]?.name || 'bottoms'}, creating a flattering vertical column for your ${bodyType?.label || 'frame'}.`,
      proportionsFeedback: 'Balanced golden ratio proportion between torso and legs with clean shoulder line alignment.',
      garmentBreakdown,
      bodyTypeFlatterRating: 95,
      tailoringAdvice: [
        'Consider a slight French tuck at the front waistband to highlight your natural waist.',
        'Keep accessory tones aligned with the footwear hardware for refined polish.',
        outerwear.length > 0 ? 'Wear the outer layer open to create an elongating central vertical panel.' : 'Ensure collar lines sit flush against the clavicle for structured posture.',
      ],
      styleVibe: `${occasion || 'Contemporary'} Elevated Minimalist`,
      engine: 'Flashdrobe Virtual Fitting Studio',
    });
  } catch (error: any) {
    console.error('Virtual try-on error:', error);
    res.status(500).json({
      error: 'Failed to process virtual try-on',
      message: error.message,
    });
  }
});

// Dedicated Multi-View Virtual Try-On Generation Endpoint
// Uses Gemini native image generation to render the model wearing the selected garments
app.post('/api/virtual-try-on/generate', async (req, res) => {
  req.setTimeout(180000);
  res.setTimeout(180000);
  const requestStart = Date.now();
  try {
    const { userId, viewAngle, outfitTitle, userImage, proportions, clothingItems, targetClassification } = req.body;
    console.log(`\n=== TRY-ON REQUEST === Items: ${clothingItems?.length}, View: ${viewAngle}, Has userImage: ${!!userImage}`);

    if (!clothingItems || !Array.isArray(clothingItems) || clothingItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one wardrobe item is required for virtual try-on.',
        message: 'Please select clothes from your wardrobe.',
      });
    }

    if (!userImage) {
      return res.status(400).json({
        success: false,
        error: 'User body image is required.',
        message: 'Please capture or upload your body photograph.',
      });
    }

    // Parse user image (needed by IDM-VTON)
    const userImageParts = userImage.split(',');
    const userImageBase64 = userImageParts[1] || '';

    // Build garment descriptions (needed by text analysis and IDM-VTON)
    const garmentDescriptions: string[] = [];
    for (const item of clothingItems) {
      garmentDescriptions.push(
        `${item.classification} - ${item.name} (${item.colorName || item.color || 'colored'}, ${item.subType || item.classification})`
      );
    }
    const garmentList = garmentDescriptions.join('\n');

    let generatedImageUrl: string | null = null;
    let aiAnalysis: any = null;
    let engineUsed = '';
    let vtonQuotaExhausted = false;
    let vtonQuotaWaitTime = '';

    // ========== Gemini Text Analysis (requires API key) ==========
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const ai = getGenAI();

        const textModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
        const analysisPrompt = `You are Flashdrobe's Virtual Dressing Room AI stylist.
The user is trying on these garments:
${garmentList}
View angle: ${viewAngle || 'front'}
Body proportions: ${JSON.stringify(proportions || {})}

Provide a brief fit analysis as JSON:
- fitScore (85-99)
- silhouetteAnalysis (1-2 sentences)
- proportionsFeedback (1 sentence)
- garmentBreakdown (for each item: classification, itemTitle, fitType, commentary)
- tailoringAdvice (2-3 tips)
- styleVibe (descriptor)`;

        for (const model of textModels) {
          try {
            const textResponse = await ai.models.generateContent({
              model,
              contents: analysisPrompt,
              config: {
                systemInstruction: 'You are a digital fitting room stylist. Output valid JSON only.',
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    fitScore: { type: Type.INTEGER },
                    silhouetteAnalysis: { type: Type.STRING },
                    proportionsFeedback: { type: Type.STRING },
                    garmentBreakdown: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          classification: { type: Type.STRING },
                          itemTitle: { type: Type.STRING },
                          fitType: { type: Type.STRING },
                          commentary: { type: Type.STRING },
                        },
                        required: ['classification', 'itemTitle', 'fitType', 'commentary'],
                      },
                    },
                    tailoringAdvice: { type: Type.ARRAY, items: { type: Type.STRING } },
                    styleVibe: { type: Type.STRING },
                  },
                  required: ['fitScore', 'silhouetteAnalysis', 'proportionsFeedback', 'garmentBreakdown', 'tailoringAdvice', 'styleVibe'],
                },
              },
            });
            if (textResponse?.text) {
              aiAnalysis = JSON.parse(textResponse.text || '{}');
              break;
            }
          } catch (err: any) {
            console.warn(`Text analysis model ${model} unavailable: ${err?.message?.substring(0, 80)}`);
          }
        }
      } catch (aiErr: any) {
        console.warn(`Gemini AI block failed: ${aiErr?.message?.substring(0, 100)}`);
      }
    }

    // ========== Gemini Nano Banana Image Generation (free ~500/day, higher quality) ==========
    if (!generatedImageUrl && userImageBase64) {
      try {
        console.log('Trying Gemini Nano Banana image generation...');
        const geminiImageModels = ['gemini-2.5-flash-image'];
        const geminiImageAi = getGenAI();

        // Extract the target garment image for try-on
        const targetItem = targetClassification
          ? clothingItems.find((item: any) => item.classification === targetClassification)
          : null;
        const garmentDataUrl = (targetItem || clothingItems.find((item: any) => item.imageUrl?.startsWith('data:')))?.imageUrl;

        if (garmentDataUrl) {
          const gParts = garmentDataUrl.split(',');
          const garmentMime = gParts[0]?.match(/:(.*?);/)?.[1] || 'image/jpeg';
          const garmentBase64 = gParts[1] || '';
          const garmentName = (targetItem || clothingItems[0])?.name || (targetItem || clothingItems[0])?.classification || 'clothing';
          const garmentDescription = garmentDescriptions.join(', ');

          for (const model of geminiImageModels) {
            try {
              const imageResponse = await geminiImageAi.models.generateContent({
                model,
                contents: [
                  {
                    text: `Generate a photorealistic image of this person wearing this garment. The garment is: ${garmentName} (${garmentDescription}). Preserve the person's exact pose, skin tone, body shape, and proportions. Show the garment fitting naturally with realistic fabric drape, lighting, and shadows. The output should be only the try-on image with no text overlay.`,
                  },
                  { inlineData: { mimeType: 'image/jpeg', data: userImageBase64 } },
                  { inlineData: { mimeType: garmentMime, data: garmentBase64 } },
                ],
                config: {
                  responseModalities: ['TEXT', 'IMAGE'],
                },
              });

              // Extract image from response parts
              const parts = imageResponse.candidates?.[0]?.content?.parts || [];
              for (const part of parts) {
                if (part.inlineData?.mimeType?.startsWith('image/')) {
                  generatedImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                  console.log(`[Gemini] Image generated successfully with ${model}`);
                  break;
                }
              }
              if (generatedImageUrl) break;
            } catch (modelErr: any) {
              const errStr = modelErr?.message || '';
              if (errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED')) {
                console.warn(`[Gemini] Rate limited on ${model}, trying next...`);
              } else {
                console.warn(`[Gemini] Image model ${model} failed: ${errStr.substring(0, 100)}`);
              }
            }
          }
        } else {
          console.log('[Gemini] No garment image available for image generation');
        }
      } catch (geminiErr: any) {
        console.warn(`[Gemini] Image generation failed: ${geminiErr?.message?.substring(0, 100)}`);
      }
    }

    // ========== IDM-VTON Virtual Try-On (free, uses user's actual body photo) ==========
    if (!generatedImageUrl && userImageBase64) {
      let tempPersonPath = '';
      let tempGarmentPath = '';
      try {
        console.log('Trying IDM-VTON (Hugging Face free virtual try-on)...');
        const personBuffer = Buffer.from(userImageBase64, 'base64');
        tempPersonPath = path.join(os.tmpdir(), `vto-person-${Date.now()}.jpg`);
        fs.writeFileSync(tempPersonPath, personBuffer);
        console.log(`[IDM-VTON] Person image saved: ${tempPersonPath} (${personBuffer.length} bytes)`);

        // Prioritize the target garment classification (e.g., when user specifically changes Bottoms)
        const targetItem = targetClassification
          ? clothingItems.find((item: any) => item.classification === targetClassification)
          : null;
        const garmentDataUrl = (targetItem || clothingItems.find((item: any) => item.imageUrl?.startsWith('data:')))?.imageUrl;
        if (garmentDataUrl) {
          const gParts = garmentDataUrl.split(',');
          const gMime = gParts[0]?.match(/:(.*?);/)?.[1] || 'image/jpeg';
          const gBuf = Buffer.from(gParts[1] || '', 'base64');
          tempGarmentPath = path.join(os.tmpdir(), `vto-garment-${Date.now()}.${gMime === 'image/png' ? 'png' : 'jpg'}`);
          fs.writeFileSync(tempGarmentPath, gBuf);
          console.log(`[IDM-VTON] Garment (from data: URL) saved: ${tempGarmentPath} (${gBuf.length} bytes, mime=${gMime})`);
        } else {
          const garmentHttpUrl = clothingItems.find((item: any) => item.imageUrl?.startsWith('http'))?.imageUrl;
          console.log(`[IDM-VTON] No data: URL garment found. HTTP URL: ${garmentHttpUrl || 'NONE'}`);
          if (garmentHttpUrl) {
            const gResp = await fetch(garmentHttpUrl, { signal: AbortSignal.timeout(15000) });
            console.log(`[IDM-VTON] Garment fetch status: ${gResp.status}`);
            if (gResp.ok) {
              const gBuf = await gResp.arrayBuffer();
              tempGarmentPath = path.join(os.tmpdir(), `vto-garment-${Date.now()}.jpg`);
              fs.writeFileSync(tempGarmentPath, Buffer.from(gBuf));
              console.log(`[IDM-VTON] Garment (from HTTP) saved: ${tempGarmentPath} (${gBuf.byteLength} bytes)`);
            } else {
              console.warn(`[IDM-VTON] Garment fetch failed: ${gResp.status} ${gResp.statusText}`);
            }
          }
        }

        if (tempPersonPath && tempGarmentPath) {
          const garmentName = (targetItem || clothingItems[0])?.name || (targetItem || clothingItems[0])?.classification || 'clothing';
          console.log(`[IDM-VTON] Calling Gradio with garment="${garmentName}"...`);
          const hfToken = (process.env.HF_TOKEN || '') as `hf_${string}` | '';
          console.log(`[IDM-VTON] HF_TOKEN present: ${!!hfToken}`);
          const t0 = Date.now();
          const vtoResult: any = await retryGradio(async () => {
            const gradio = await GradioClient.connect('yisol/IDM-VTON', hfToken ? { token: hfToken } : undefined);
            console.log(`[IDM-VTON] Gradio connected, calling /tryon...`);
            return gradio.predict('/tryon', {
              dict: { background: handle_file(tempPersonPath), layers: [], composite: null },
              garm_img: handle_file(tempGarmentPath),
              garment_des: garmentName,
              is_checked: true,
              is_checked_crop: false,
              denoise_steps: 25,
              seed: Math.floor(Math.random() * 10000),
            });
          }, 'IDM-VTON');
          const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
          console.log(`[IDM-VTON] Gradio call completed in ${elapsed}s, result data count: ${vtoResult?.data?.length || 0}`);

          if (vtoResult?.data?.[0]?.url) {
            console.log(`[IDM-VTON] Fetching result image: ${vtoResult.data[0].url.substring(0, 80)}...`);
            const imgResp = await fetch(vtoResult.data[0].url, { signal: AbortSignal.timeout(30000) });
            console.log(`[IDM-VTON] Result image fetch status: ${imgResp.status}`);
            if (imgResp.ok) {
              const imgBuf = await imgResp.arrayBuffer();
              const base64 = Buffer.from(imgBuf).toString('base64');
              generatedImageUrl = `data:image/png;base64,${base64}`;
              engineUsed = 'Flashdrobe IDM-VTON Virtual Try-On (Free)';
              console.log(`[IDM-VTON] SUCCESS: image generated (${imgBuf.byteLength} bytes)`);
            } else {
              console.warn(`[IDM-VTON] Result image fetch failed: ${imgResp.status}`);
            }
          } else {
            console.warn(`[IDM-VTON] No image URL in result. Raw result:`, JSON.stringify(vtoResult).substring(0, 200));
          }
        } else {
          console.warn(`[IDM-VTON] SKIPPED: personPath=${!!tempPersonPath}, garmentPath=${!!tempGarmentPath}`);
        }
      } catch (vtoErr: any) {
        const vtoMsg = vtoErr?.message || '';
        console.warn(`[IDM-VTON] FAILED: ${vtoMsg.substring(0, 200)}`);
        const quota = parseZeroGPUError(vtoMsg);
        if (quota.isQuota) {
          console.warn(`[IDM-VTON] ZeroGPU quota exhausted. Try again in ${quota.waitTime}`);
          vtonQuotaExhausted = true;
          vtonQuotaWaitTime = quota.waitTime;
        }
      } finally {
        try { if (tempPersonPath) fs.unlinkSync(tempPersonPath); } catch {}
        try { if (tempGarmentPath) fs.unlinkSync(tempGarmentPath); } catch {}
      }
    } else if (!userImageBase64) {
      console.warn('[IDM-VTON] SKIPPED: no userImageBase64 provided');
    }

    console.log(`Response: ${generatedImageUrl ? 'SUCCESS' : 'NO_IMAGE'} (${Date.now() - requestStart}ms), engine=${engineUsed || 'none'}`);

    // ========== Return result ==========
    if (generatedImageUrl) {
      return res.json({
        success: true,
        tryOnImageUrl: generatedImageUrl,
        generatedByAI: true,
        ...(aiAnalysis || {}),
        fitScore: aiAnalysis?.fitScore || 96,
        engine: engineUsed,
      });
    }

    // Absolute last resort: return raw body photo with text analysis
    const fallbackAnalysis = aiAnalysis || {
      fitScore: 95,
      silhouetteAnalysis: `The combination of ${clothingItems.map((c: any) => c.name).join(', ')} falls with natural drape on your frame.`,
      proportionsFeedback: 'Body proportions preserved from original photograph.',
      garmentBreakdown: clothingItems.map((item: any) => ({
        classification: item.classification,
        itemTitle: item.name,
        fitType: 'Neural draped fit',
        commentary: `${item.name} conforms cleanly with your body proportions.`,
      })),
      tailoringAdvice: [
        'Consider a subtle half-tuck at the waistband to highlight your natural waist.',
        'Ensure top shoulder seams align squarely with the clavicle.',
      ],
      styleVibe: `${outfitTitle || 'Contemporary'} Virtual Fit`,
    };
    return res.json({
      success: true,
      tryOnImageUrl: userImage,
      generatedByAI: false,
      ...fallbackAnalysis,
      engine: 'Flashdrobe Body Photo (image generation unavailable)',
      ...(vtonQuotaExhausted ? {
        vtonQuotaExhausted: true,
        vtonQuotaWaitTime,
        vtonMessage: `AI try-on is temporarily unavailable (ZeroGPU quota resets in ${vtonQuotaWaitTime}). Authenticated HF users get higher quota — set HF_TOKEN in .env.local.`,
      } : {}),
    });
  } catch (error: any) {
    console.error('Virtual try-on generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Generation failed',
      message: 'Unable to generate the virtual try-on right now. Please try again.',
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Flashdrobe Android server running on http://localhost:${PORT}`);
  });
}

startServer();
