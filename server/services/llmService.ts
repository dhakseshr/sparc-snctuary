import fetch from 'node-fetch';

const LLM_API_URL = process.env.LLM_API_URL;
const LLM_API_KEY = process.env.LLM_API_KEY;

export const llmService = {
  getCompletion: async (prompt: string): Promise<string> => {
    if (!LLM_API_URL || !LLM_API_KEY || LLM_API_KEY === 'YOUR_API_KEY_HERE' || LLM_API_KEY === 'AIzaSyDcHnR6I_FhFEWR0teKQfCMPo5xmIgRTGA') {
      const errorMessage = "LLM API credentials are not set in .env. Please add your API key to enable this feature.";
      console.error(errorMessage);
      // Return a structured error that the frontend can gracefully handle
      return JSON.stringify({
        error: true,
        message: errorMessage,
        name: "Configuration Error",
        summary: "The AI analysis is currently unavailable. Please configure the API key in your server's .env file to proceed.",
        pros: [],
        cons: []
      });
    }

    const fullUrl = `${LLM_API_URL}?key=${LLM_API_KEY}`;
    try {
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
      if (!response.ok) {
        const errorBody = await response.text();
        console.error("Gemini API Error Response:", errorBody);
        throw new Error(`Gemini API request failed with status ${response.status}`);
      }
      const data: any = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return text || "I'm sorry, I couldn't generate a response.";
    } catch (error) {
      console.error("Failed to get completion from Gemini LLM:", error);
      throw error;
    }
  }
};