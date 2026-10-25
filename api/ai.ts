import type { Request, Response } from 'express';

export default async function handler(req: Request, res: Response) {
  // CORS Headers for client requests
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  // Diagnostics Preflight Check: GET /api/ai or ?check=1
  if (req.method === 'GET' || req.query?.check === '1') {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'MY_GEMINI_API_KEY') {
      return res.status(200).json({
        status: 'warning',
        configured: false,
        message: 'Gemini API key is missing or set to placeholder in environment variables.',
        model: 'cached-field-guide',
      });
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash?key=${GEMINI_API_KEY}`;
      const pingRes = await fetch(url);
      if (pingRes.ok) {
        return res.status(200).json({
          status: 'ok',
          configured: true,
          message: 'Gemini Generative Language API Handshake successful (gemini-2.5-flash ready)',
          model: 'gemini-2.5-flash',
        });
      } else {
        const errJson: any = await pingRes.json().catch(() => ({}));
        return res.status(pingRes.status).json({
          status: 'error',
          configured: true,
          message: errJson?.error?.message || `Gemini API returned status ${pingRes.status}`,
          error: errJson?.error,
        });
      }
    } catch (err: any) {
      return res.status(500).json({
        status: 'error',
        configured: true,
        message: err.message || 'Network error reaching Generative Language API',
      });
    }
  }

  // POST generateContent for Roost Intelligence
  const { question } = req.body || {};
  const prompt = question || 'Provide a concise Portland winter crow mega-roost staging summary.';

  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'MY_GEMINI_API_KEY') {
    return res.json({
      summary: `**The Burd Field Intelligence:**\n\n• **Active Corridors:** Willamette and Columbia River flyways.\n• **Prime Vantage:** South Park Blocks and Waterfront Park.\n• **Roost Behavior:** Twilight flock convergence actively tracked.`,
      model: 'cached-field-guide',
    });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const payload = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      systemInstruction: {
        parts: [{ text: `You are The Burd's ornithological field intelligence specialist.` }],
      },
    };
    const gRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!gRes.ok) throw new Error(`Gemini API HTTP ${gRes.status}`);
    const gData: any = await gRes.json();
    const reply = gData?.candidates?.[0]?.content?.parts?.[0]?.text || 'No summary returned.';
    return res.json({ summary: reply, model: 'gemini-2.5-flash' });
  } catch (err: any) {
    return res.json({
      summary: `**The Burd Field Intelligence:** Offline field report.`,
      error: err.message,
    });
  }
}
