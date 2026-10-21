import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// Initialize Google Gen AI client with recommended user-agent header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// AI Chatbot endpoint with network context and multi-turn conversation
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, networkContext } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const systemInstruction = `You are the FlowSpectral Urban Assistant, an encouraging, friendly, and knowledgeable guide for urban road network analysis and linear algebra.
Your purpose is to help ordinary citizens, urban planners, and mathematics students understand how city road networks work.

Current active road network context:
${networkContext ? JSON.stringify(networkContext, null, 2) : 'No specific network loaded.'}

Guidelines:
1. Always be welcoming, concise, and clear. Avoid intimidating math jargon unless the user explicitly asks for the mathematical derivation.
2. When talking to beginners:
   - Use "Importance score" instead of "Eigenvector centrality".
   - Use "Network strength" instead of "Dominant eigenvalue / spectral radius".
   - Use "Backup routes / duplicate paths" instead of "Rank / nullity".
   - Use "Resilience / hardest to split" instead of "Algebraic connectivity / Fiedler vector".
   - Use "Traffic passes through" instead of "Betweenness centrality".
3. When answering about the current city:
   - Refer to specific intersection names (e.g., Central Hub, North Boulevard) and their actual lane capacities and scores from the provided context.
   - Explain why a specific intersection is a bottleneck, or how adding/closing roads would impact traffic.
4. If a student or teacher asks about the linear algebra, provide clear, step-by-step mathematical explanations (Gauss-Jordan elimination, Perron-Frobenius theorem, Jacobi diagonalization, Graph Laplacian L = D - A).
5. Keep responses direct, well-structured (using bullet points where helpful), and under 3-4 short paragraphs unless an in-depth explanation is requested.`;

    // Map conversation messages to GenAI contents format
    // Filter out initial empty prompts
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || 'I analyzed the network, but could not produce a response. Please try asking in another way.';
    return res.json({ reply });
  } catch (err: unknown) {
    console.error('Gemini chat error:', err);
    const message = err instanceof Error ? err.message : 'Unknown server error';
    return res.status(500).json({
      error: 'Failed to generate assistant response',
      details: message,
    });
  }
});

// Setup Vite in development or static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`FlowSpectral server listening on port ${port}`);
  });
}

startServer();
