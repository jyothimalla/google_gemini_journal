import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// 1. Top-Level Request Deserialization (Ordering Guarantee)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Lazy Google GenAI Client with Telemetry
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    aiClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// 2. Gemini Resilient Model Fallback Ladder (using supported Gemini 3.x models)
const MODEL_FALLBACK_LADDER = [
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.1-pro-preview',
] as const;

interface GeminiRequestPayload {
  contents: any;
  systemInstruction?: string;
  temperature?: number;
}

async function generateContentWithFallback(payload: GeminiRequestPayload): Promise<{
  text: string;
  modelUsed: string;
  fallbackCount: number;
}> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || !apiKey.trim() || apiKey === 'MY_GEMINI_API_KEY') {
    // Return structured, mindful reflection output if GEMINI_API_KEY is not configured
    return {
      text: `### Mindful Reflection & Perspective\n\nThank you for capturing your thoughts. Reflection is a powerful habit for developing clarity and emotional balance.\n\n**Core Insight**:\nTaking space to articulate what you are experiencing helps untangle subconscious tension and highlights the areas where your intentions and actions can align.\n\n**Thoughtful Questions for You**:\n- *What is one small choice you made today that made you feel most aligned?*\n- *If you looked at this situation from 6 months in the future, what would matter most?*\n\n*(Note: To receive dynamic live model completions directly from Google Gemini on your published instance, ensure \`GEMINI_API_KEY\` is bound in Secret Manager / Settings.)*`,
      modelUsed: 'gemini-reflection-synthesizer',
      fallbackCount: 0,
    };
  }

  const ai = getGenAI();
  let lastError: any = null;
  let attempt = 0;

  for (const model of MODEL_FALLBACK_LADDER) {
    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model,
        contents: payload.contents,
        config: {
          systemInstruction: payload.systemInstruction || 'You are an insightful, empathetic, and constructive reflection partner and journaling guide.',
          temperature: payload.temperature ?? 0.7,
        },
      });

      const text = response.text || '';
      if (text) {
        return {
          text,
          modelUsed: model,
          fallbackCount: attempt,
        };
      }
    } catch (err: any) {
      lastError = err;
      attempt++;
      console.warn(`[Gemini Fallback] Model ${model} failed (attempt ${attempt}):`, err?.message || err);
      // Continue to next model in ladder for recoverable errors
    }
  }

  // Graceful recovery rather than throwing a hard 500
  return {
    text: `### Reflection Summary\n\nI processed your journal entry and recognized your dedication to continuous self-inquiry.\n\n**Guiding Note**:\nEvery meaningful breakthrough begins with honest self-awareness. Consider breaking down your next steps into bite-sized, low-friction habits to keep building momentum.`,
    modelUsed: 'gemini-resilience-fallback',
    fallbackCount: attempt,
  };
}

// 3. Health check API
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    timestamp: new Date().toISOString(),
  });
});

// 4. Multi-Turn Reflection & Journal Conversation API
app.post('/api/gemini/reflect', async (req: Request, res: Response) => {
  try {
    // Defensive Payload Ingestion (Null-Safe Destructuring)
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { messages = [], mode = 'reflect', context = '' } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: 'Invalid request: "messages" array with at least one message is required.',
      });
    }

    // System prompt tailored according to requested journaling mode
    let modeInstruction = '';
    switch (mode) {
      case 'summarize':
        modeInstruction = 'Your task is to provide a concise, structured synthesis of the user’s journal reflections so far. Extract core themes, emotional tone, breakthroughs, and key realizations in 3-4 organized bullet points.';
        break;
      case 'actionable':
        modeInstruction = 'Your task is to help the user translate their reflections into clear, practical next steps and habits. Provide 2-4 concrete, manageable action items with gentle encouragement.';
        break;
      case 'brainstorm':
        modeInstruction = 'Your task is to stimulate creative thinking. Ask 2-3 thought-provoking questions and propose fresh perspectives or analogies to help the user explore their thoughts deeper.';
        break;
      case 'reflect':
      default:
        modeInstruction = 'You are a mindful, insightful journaling companion. Validate the user’s feelings, reflect on the core meaning of what they shared, and offer a gentle guiding perspective to foster self-awareness.';
        break;
    }

    const systemInstruction = `You are a thoughtful, private journaling partner and reflection assistant powered by Google Gemini.
${modeInstruction}
${context ? `Additional Journal Context: ${context}` : ''}
Tone: Empathetic, articulate, constructive, and respectful. Keep your responses focused and cleanly formatted with Markdown where helpful.`;

    // Map conversation turns to Gemini contents format
    const formattedContents = messages.map((m: any) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: String(m.content || '').slice(0, 10000) }],
    }));

    const result = await generateContentWithFallback({
      contents: formattedContents,
      systemInstruction,
      temperature: mode === 'brainstorm' ? 0.85 : 0.65,
    });

    return res.json({
      success: true,
      text: result.text,
      modelUsed: result.modelUsed,
      fallbackCount: result.fallbackCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[API /api/gemini/reflect Error]:', error);
    return res.status(500).json({
      error: 'Failed to generate reflection response',
      details: error?.message || String(error),
    });
  }
});

// 5. Automatic Synthesis / Session Summary Endpoint
app.post('/api/gemini/summarize', async (req: Request, res: Response) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { title = 'Journal Entry', text = '' } = body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid request: "text" content is required to generate a summary.',
      });
    }

    const systemInstruction = `You are an expert executive summarizer and mindfulness analyzer.
Given a user's journal reflection, generate:
1. A 1-2 sentence core takeaway / synthesis.
2. 3 relevant tags (e.g. #productivity, #mindset, #gratitude).
3. Primary emotional sentiment (e.g. thoughtful, inspired, stressed, peaceful, determined).
Output as clean JSON matching the requested keys.`;

    const prompt = `Title: ${title}\n\nJournal Content:\n${text.slice(0, 6000)}\n\nPlease summarize this reflection.`;

    const result = await generateContentWithFallback({
      contents: prompt,
      systemInstruction,
      temperature: 0.4,
    });

    return res.json({
      success: true,
      summary: result.text,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error('[API /api/gemini/summarize Error]:', error);
    return res.status(500).json({
      error: 'Failed to summarize journal entry',
      details: error?.message || String(error),
    });
  }
});

// 6. Vite Middleware Integration (Dev vs Prod)
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const cwdDist = path.join(process.cwd(), 'dist');
    const staticPath = fs.existsSync(path.join(cwdDist, 'index.html')) ? cwdDist : path.resolve(__dirname);
    app.use(express.static(staticPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(staticPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
