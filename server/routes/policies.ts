import { RequestHandler } from "express";
import multer from "multer";
import pdf from "pdf-parse";
import { llmService } from "../services/llmService";

const upload = multer({ storage: multer.memoryStorage() });
export const policyUpload = upload.single("policyDocument");

/**
 * A robust function to parse potentially malformed JSON from an LLM.
 * It looks for a JSON block within markdown backticks and has strong error handling.
 */
const parseLlmJsonResponse = (llmResponse: string): any => {
    try {
        // Find a JSON block within markdown backticks, which LLMs often add.
        const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch && jsonMatch[0]) {
            return JSON.parse(jsonMatch[0]);
        } else {
            // If no block is found, try to parse the whole string.
            return JSON.parse(llmResponse);
        }
    } catch (parseError) {
        console.error("CRITICAL: Failed to parse LLM response as JSON. Response was:", llmResponse);
        // This error will be caught by the main handler.
        throw new Error("The AI returned an invalid or incomplete format. Please try analyzing again.");
    }
}

export const handleAnalyzePolicy: RequestHandler = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No policy document uploaded." });
  }

  try {
    let documentText = "";
    if (req.file.mimetype === "application/pdf") {
      const data = await pdf(req.file.buffer);
      documentText = data.text;
    } else {
      documentText = req.file.buffer.toString('utf-8');
    }

    if (documentText.trim().length < 50) {
        return res.status(400).json({ error: "Document content is too short or could not be read." });
    }

    const prompt = `
      You are an expert insurance policy analyst. Analyze the following policy document text.
      Provide a concise, one-sentence summary.
      Identify exactly 3 positive features (pros) and 2 negative features or limitations (cons).
      Return your analysis as a single, clean JSON object with the following keys: "name", "summary", "pros", "cons".
      - "name": A short, catchy name for the policy, like "SecureLife Plus".
      - "summary": The one-sentence summary.
      - "pros": An array of 3 strings.
      - "cons": An array of 2 strings.
      Do not include any text or formatting outside of the JSON object.
      Document Text: """${documentText.substring(0, 8000)}"""
    `;
    
    const llmResponse = await llmService.getCompletion(prompt);
    const analyzedData = parseLlmJsonResponse(llmResponse);

    // Final validation to ensure the object has the keys we need for the UI
    if (!analyzedData.name || !analyzedData.summary || !analyzedData.pros || !analyzedData.cons) {
        throw new Error("The AI response was missing required fields.");
    }

    res.status(200).json(analyzedData);

  } catch (error) {
    console.error("Policy analysis error in handler:", error);
    res.status(500).json({ error: (error as Error).message || "An unknown error occurred while analyzing the policy." });
  }
};