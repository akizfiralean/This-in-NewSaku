import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";

export const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize GoogleGenAI lazily to ensure it doesn't crash on startup if key is missing.
let aiClient: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ GEMINI_API_KEY is not set in environment variables!");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Language resolver utility to enforce translation at Gemini response layer
function getLanguageInstruction(lang?: string): string {
  switch (lang) {
    case "en":
      return "IMPORTANT: All text and field values MUST be in English. Use standard English vocabulary appropriate for general family audiences.";
    case "zh":
      return "IMPORTANT: All text and field values MUST be in Traditional Chinese (繁體中文). Use warm, polite, and standard family-friendly phrases.";
    case "ar":
      return "IMPORTANT: All text and field values MUST be in polite and standard Arabic (العربية) readable by all family age groups.";
    case "id":
    default:
      return "IMPORTANT: All text and field values MUST be in standard Indonesian (Bahasa Indonesia) that is warm, polite, and very natural for everyday usage.";
  }
}

// Helper to perform robust generation with fallback to other models and automatic retry on transient errors (e.g. 503 Unavailable)
async function generateContentWithFallbackAndRetry(
  ai: GoogleGenAI,
  params: {
    model: string;
    contents: any;
    config?: any;
  },
  maxRetries = 2
): Promise<any> {
  const modelsToTry = [params.model];
  if (params.model === "gemini-3.5-flash") {
    // Offer multiple alternative flash models to fall back to in sequence if overloaded
    modelsToTry.push("gemini-flash-latest");
    modelsToTry.push("gemini-3.1-flash-lite");
    modelsToTry.push("gemini-3.1-pro-preview");
  }

  let lastError: any = null;

  for (const modelName of modelsToTry) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          ...params,
          model: modelName,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errStr = String(err.message || err || "");
        console.warn(`[Gemini API] Attempt ${attempt} with model ${modelName} failed. Error:`, errStr);
        
        // If the model is experiencing high demand / unavailable (503), do not retry this model.
        // Fall back to the next model immediately to avoid timeout and minimize latency.
        const isUnavailable = errStr.includes("503") || 
                              errStr.includes("UNAVAILABLE") || 
                              errStr.includes("demand") || 
                              errStr.includes("resource") ||
                              err.status === 503 || 
                              err.code === 503 ||
                              err.status === "UNAVAILABLE";
                              
        if (isUnavailable) {
          console.warn(`[Gemini API] Model ${modelName} is unavailable/overloaded. Switching to next model immediately...`);
          break; // Break the current retry loop to transition to the next model in modelsToTry
        }

        if (attempt < maxRetries) {
          // Exponential backoff for other transient errors
          await new Promise((resolve) => setTimeout(resolve, 800 * attempt));
        }
      }
    }
  }

  throw lastError;
}

// ==========================================
// API ROUTES
// ==========================================

// 1. Health & Configuration Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    apiKeyConfigured: !!process.env.GEMINI_API_KEY,
  });
});

// 2. Saku Resep (Ingredient Recipe Generator)
app.post("/api/resep", async (req, res) => {
  try {
    const { ingredients, speed, dietary, lang } = req.body;
    if (!ingredients || ingredients.length === 0) {
      return res.status(400).json({ error: "Ingredients cannot be empty!" });
    }

    const ai = getAI();
    const langRule = getLanguageInstruction(lang);
    const prompt = `Create a practical, budget-friendly and delicious home recipe based on ingredients: ${ingredients.join(", ")}.
    The recipe must be straightforward for any family member (grandma, student, beginner cook).
    Additional criteria:
    - Speed options level: ${speed || "normal"}
    - Dietary preference: ${dietary || "Default/No restriction"}
    
    ${langRule}

    You must return a raw valid JSON object match this schema:
    {
      "namaMasakan": "Exciting and appetizing meal name",
      "porsi": "Contoh: 2-3 porsi / servings",
      "waktuMemasak": "Contoh: 15 mins",
      "perkiraanBiaya": "Contoh: Rp 15.000 / $3.00 (Affordable)",
      "bahanBahan": ["Ingredient line 1 with simple measurement", "Ingredient line 2", ...],
      "langkahLangkah": ["Step 1 with direct cozy tone", "Step 2", ...],
      "tipsCerdas": "One smart cooking tip, money-saving advice, or substitute ingredient choice"
    }`;

    const response = await generateContentWithFallbackAndRetry(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            namaMasakan: { type: Type.STRING },
            porsi: { type: Type.STRING },
            waktuMemasak: { type: Type.STRING },
            perkiraanBiaya: { type: Type.STRING },
            bahanBahan: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            langkahLangkah: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            tipsCerdas: { type: Type.STRING }
          },
          required: ["namaMasakan", "porsi", "waktuMemasak", "bahanBahan", "langkahLangkah"]
        }
      }
    });

    const resultText = response.text || "{}";
    res.json(JSON.parse(resultText.trim()));
  } catch (error: any) {
    console.error("Error at /api/resep:", error);
    res.status(500).json({ error: error.message || "Failed to make pocket recipe" });
  }
});

// 3. Saku Sopan (WhatsApp & Chat Politeness Writer)
app.post("/api/sopan", async (req, res) => {
  try {
    const { target, purpose, detail, lang } = req.body;
    if (!target || !purpose) {
      return res.status(400).json({ error: "Target and purpose are required!" });
    }

    const ai = getAI();
    const langRule = getLanguageInstruction(lang);
    const prompt = `Write 3 polite, natural, and highly respectful chat templates (perfect for chat platforms like WhatsApp/Telegram) sent to: **${target}**.
    
    Reason/Core message goal: ${purpose}.
    Additional details/context parameters: ${detail || "(None)"}.
    
    ${langRule}

    Explain the exact context appropriately within these three distinct styles:
    1. "pilihanSangatSopan" (Highly formal, grand, ultra-respectful, suitable for senior bosses, professors, traditional authorities).
    2. "pilihanRamahHangat" (Polite but friendly, respectful yet warm, suitable for family groups, senior colleagues, or neighbors).
    3. "pilihanSingkatPadat" (Brief, directly to the point, highly polite, but skips unnecessary pleasantries - perfect for swift communications).

    Return JSON matching this schema:
    {
      "pilihanSangatSopan": "Message details for style 1",
      "pilihanRamahHangat": "Message details for style 2",
      "pilihanSingkatPadat": "Message details for style 3"
    }`;

    const response = await generateContentWithFallbackAndRetry(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            pilihanSangatSopan: { type: Type.STRING },
            pilihanRamahHangat: { type: Type.STRING },
            pilihanSingkatPadat: { type: Type.STRING }
          },
          required: ["pilihanSangatSopan", "pilihanRamahHangat", "pilihanSingkatPadat"]
        }
      }
    });

    const resultText = response.text || "{}";
    res.json(JSON.parse(resultText.trim()));
  } catch (error: any) {
    console.error("Error at /api/sopan:", error);
    res.status(500).json({ error: error.message || "Failed to draft templates" });
  }
});

// 4. Saku Curhat (Emotional Listener & Companion)
app.post("/api/curhat", async (req, res) => {
  try {
    const { feeling, story, lang } = req.body;
    if (!feeling && !story) {
      return res.status(400).json({ error: "How are you feeling harian?" });
    }

    const ai = getAI();
    const langRule = getLanguageInstruction(lang);
    const prompt = `You are 'Sobat Saku', an extremely empathetic, warm, understanding and wise digital companion.
    Listen to someone feeling: "${feeling || "Mixed/Ordinary"}" with story specifics: "${story || "(No story texted, user needs general comfort)"}".

    Provide gentle psychological validation, healthy advice free from toxic positivity, and a positive affirmation quote.
    
    ${langRule}

    Return JSON schema:
    {
      "balasanSobat": "Empathetic comforting paragraph response, readable, warm, about 3-4 sentences long.",
      "afirmasiSaku": "One line quote/affirmation of peace and self-love that the user can repeat.",
      "aktivitasMenolong": "One simple calming step or dynamic activity (e.g. stretch, have water, 4-7-8 breathing) appropriate for their distress"
    }`;

    const response = await generateContentWithFallbackAndRetry(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            balasanSobat: { type: Type.STRING },
            afirmasiSaku: { type: Type.STRING },
            aktivitasMenolong: { type: Type.STRING }
          },
          required: ["balasanSobat", "afirmasiSaku", "aktivitasMenolong"]
        }
      }
    });

    const resultText = response.text || "{}";
    res.json(JSON.parse(resultText.trim()));
  } catch (error: any) {
    console.error("Error at /api/curhat:", error);
    res.status(500).json({ error: error.message || "Failed to provide comforting ear" });
  }
});

// 5. Saku Tanya Ramah (Kid & Grandma Explainer)
app.post("/api/tanya", async (req, res) => {
  try {
    const { audiens, question, lang } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Please write a question!" });
    }

    const ai = getAI();
    let targetPrompt = "";
    if (audiens === "anak") {
      targetPrompt = "Explain this concept to a 6-8 year old child using fun fairy tale storytelling or interactive animal analogies.";
    } else if (audiens === "lansia") {
      targetPrompt = "Explain this concept respectfully to a grandma/grandpa (elderly). Use vintage analog life comparisons, slow polite tones, and avoid modern text slang/jargons.";
    } else {
      targetPrompt = "Explain this concept to a complete beginner harian simply, directly, and practically.";
    }

    const langRule = getLanguageInstruction(lang);
    const prompt = `Explain the following topic or riddle: "${question}".
    Target audience focus: ${targetPrompt}
    
    ${langRule}

    Return JSON matching this schema:
    {
      "judulAnalogi": "Cute analogy title (e.g., The Story of Little Cloud)",
      "penjelasanPendek": "Primary warm body explanation, 3-5 concise sentences.",
      "satuKalimatInti": "One core takeaway sentence easy to remember"
    }`;

    const response = await generateContentWithFallbackAndRetry(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            judulAnalogi: { type: Type.STRING },
            penjelasanPendek: { type: Type.STRING },
            satuKalimatInti: { type: Type.STRING }
          },
          required: ["judulAnalogi", "penjelasanPendek", "satuKalimatInti"]
        }
      }
    });

    const resultText = response.text || "{}";
    res.json(JSON.parse(resultText.trim()));
  } catch (error: any) {
    console.error("Error at /api/tanya:", error);
    res.status(500).json({ error: error.message || "Failed to explain clearly" });
  }
});

// 6. Saku Belanja Cerdas (Smart Groceries budgeter)
app.post("/api/belanja", async (req, res) => {
  try {
    const { items, budgetLimit, lang } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Shopping list cannot be empty!" });
    }

    const ai = getAI();
    const langRule = getLanguageInstruction(lang);
    const prompt = `Formulate a smart budget family shopping plan for items: ${items.join(", ")}.
    Budget boundary target limit is: ${budgetLimit || "None/Flexible"}.
    Provide tips on how to trim costs, recommend specific packaging sizes or unit estimations, and suggests cheaper/smarter alternative switches for listed items.

    ${langRule}

    Return JSON matching this schema:
    {
      "namaRencana": "Friendly title of budget strategy",
      "totalEstimasi": "Total estimated cost with currency symbol match for user country reference",
      "tipsHemat": "Smart grocery trick (grosir/generic brand replacement tips)",
      "daftarBelanjaAnalis": [
        {
          "barang": "Item Name",
          "takaran": "Pack/Piece sizes advice - e.g. 500gr or 1 carton",
          "estimasiBiaya": "Estimation price range",
          "alternatifLebihMurah": "Cheaper option suggestion"
        }
      ]
    }`;

    const response = await generateContentWithFallbackAndRetry(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            namaRencana: { type: Type.STRING },
            totalEstimasi: { type: Type.STRING },
            tipsHemat: { type: Type.STRING },
            daftarBelanjaAnalis: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  barang: { type: Type.STRING },
                  takaran: { type: Type.STRING },
                  estimasiBiaya: { type: Type.STRING },
                  alternatifLebihMurah: { type: Type.STRING }
                },
                required: ["barang", "takaran", "estimasiBiaya", "alternatifLebihMurah"]
              }
            }
          },
          required: ["namaRencana", "totalEstimasi", "tipsHemat", "daftarBelanjaAnalis"]
        }
      }
    });

    const resultText = response.text || "{}";
    res.json(JSON.parse(resultText.trim()));
  } catch (error: any) {
    console.error("Error at /api/belanja:", error);
    res.status(500).json({ error: error.message || "Failed to draft budget plan" });
  }
});

// 7. Saku Kamus Gaul (Slang and Cultural slang Translation)
app.post("/api/kamus", async (req, res) => {
  try {
    const { phrase, lang } = req.body;
    if (!phrase) {
      return res.status(400).json({ error: "Please enter a word or phrase to translate/explain!" });
    }

    const ai = getAI();
    const langRule = getLanguageInstruction(lang);
    const prompt = `Deconstruct and explain the slang, netizen word, abbreviation or foreign colloquial expression: "${phrase}".
    Translate it and explain it simply and politely so any elder family member (parent or grandparent) can comprehend it instantly without feel confused. Write natural usage scenario examples.

    ${langRule}

    Return JSON matching this schema:
    {
      "kataAsli": "The query term requested",
      "artiHarfiah": "Direct Translation or literal breakdown",
      "penjelasanSantai": "Comfortable warmth paragraph explaining the background or emotion of the word",
      "contohKalimat": "Sample sentence illustration that makes perfect sense to anyone"
    }`;

    const response = await generateContentWithFallbackAndRetry(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            kataAsli: { type: Type.STRING },
            artiHarfiah: { type: Type.STRING },
            penjelasanSantai: { type: Type.STRING },
            contohKalimat: { type: Type.STRING }
          },
          required: ["kataAsli", "artiHarfiah", "penjelasanSantai", "contohKalimat"]
        }
      }
    });

    const resultText = response.text || "{}";
    res.json(JSON.parse(resultText.trim()));
  } catch (error: any) {
    console.error("Error at /api/kamus:", error);
    res.status(500).json({ error: error.message || "Failed to search dictionary" });
  }
});

// 8. Saku Solusi Rumah (DIY Household Repair Tips)
app.post("/api/solusi", async (req, res) => {
  try {
    const { problem, lang } = req.body;
    if (!problem) {
      return res.status(400).json({ error: "Please describe the household issue!" });
    }

    const ai = getAI();
    const langRule = getLanguageInstruction(lang);
    const prompt = `Provide a smart, cheap, and safe household Do-It-Yourself repair guide or stain-remover life hack for: "${problem}".
    Instruct the user to use daily kitchen cabinet materials (e.g., vinegar, baking soda, candle wax, hair dryer, table salt). Specify clear step-by-step instructions.

    ${langRule}

    Return JSON matching this schema:
    {
      "namaMasalah": "Treated issue name",
      "tingkatKesulitan": "Tingkat kesulitan (e.g. Pemula / Sangat Mudah / Menengah)",
      "bahanRumahan": ["Cabinet ingredient 1", "Cabinet ingredient 2", ...],
      "langkahSolusi": ["Step 1 sequence detail", "Step 2", ...],
      "tipsPencegahan": "How to prevent this problem or mold/rust from returning"
    }`;

    const response = await generateContentWithFallbackAndRetry(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            namaMasalah: { type: Type.STRING },
            tingkatKesulitan: { type: Type.STRING },
            bahanRumahan: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            langkahSolusi: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            tipsPencegahan: { type: Type.STRING }
          },
          required: ["namaMasalah", "tingkatKesulitan", "bahanRumahan", "langkahSolusi", "tipsPencegahan"]
        }
      }
    });

    const resultText = response.text || "{}";
    res.json(JSON.parse(resultText.trim()));
  } catch (error: any) {
    console.error("Error at /api/solusi:", error);
    res.status(500).json({ error: error.message || "Failed to generate DIY solution" });
  }
});

// 9. Saku Premium TTS (Text-to-Speech Option with Language tuning)
app.post("/api/tts", async (req, res) => {
  try {
    const { text, voice, lang } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is empty!" });
    }

    const ai = getAI();
    const selectedVoice = voice === "male" ? "Zephyr" : "Kore";
    const targetLangLabel = lang === "zh" ? "Traditional Chinese" : lang === "en" ? "English" : lang === "ar" ? "Arabic" : "Indonesian";

    console.log(`Generating Multilingual TTS audio for language: ${targetLangLabel} | Voice: ${selectedVoice}`);

    const response = await generateContentWithFallbackAndRetry(ai, {
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: `Say clearly with a natural, friendly, warm and clear tone matching a human native speaker of ${targetLangLabel}: ${text}` }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: selectedVoice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: "Failed to render TTS audio stream from Gemini." });
    }

    res.json({ audio: base64Audio });
  } catch (error: any) {
    console.error("Error at /api/tts:", error);
    res.status(500).json({ error: error.message || "Failed to synthesize speech" });
  }
});

// ==========================================
// VITE OR STATIC SERVICE SEAMLESS INTERACTION
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 SakuDaya AI Full Server running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}
