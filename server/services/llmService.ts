import fetch from 'node-fetch';

const LLM_API_URL = process.env.LLM_API_URL;
const LLM_API_KEY = process.env.LLM_API_KEY;

export const llmService = {
  getCompletion: async (prompt: string): Promise<string> => {
    if (!LLM_API_URL || !LLM_API_KEY || LLM_API_KEY === 'AIzaSyDcHnR6I_FhFEWR0teKQfCMPo5xmIgRTGA') {
      console.error("LLM API credentials are not set in .env");
      console.log(`(SIMULATED) LLM call with prompt: "${prompt}"`);
      // Return a valid JSON string for the policy analysis feature
      if (prompt.includes("Analyze the following policy document text")) {
        return `{
          "name": "Simulated SecureLife",
          "summary": "This is a simulated summary for the uploaded policy, as the AI service is not yet configured. To get real analysis, please set up your API key.",
          "pros": [
            "Simulated Benefit 1",
            "Simulated Benefit 2",
            "Simulated Benefit 3"
          ],
          "cons": [
            "Simulated Limitation 1",
            "Simulated Limitation 2"
          ]
        }`;
      }
      if (prompt.includes("writing assistant")) {
          return "Consider this improved version: Exciting new offers and benefits are now available exclusively for you!";
      }
      return "This is a simulated response from the LLM. Please configure your API keys to get a live answer.";
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