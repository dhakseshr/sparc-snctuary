import { RequestHandler } from "express";
import { db } from "../services/dbService"; // CORRECTED PATH
import { llmService } from "../services/llmService"; // CORRECTED PATH

export const handleChatbotQuery: RequestHandler = async (req, res) => {
  const { message, userId } = req.body;

  const context = `
    You are a helpful AI assistant for an insurance agent using the "Turtlemint B2B" dashboard.
    The agent manages customer policies (Health, Life, Motor, Travel).
    Key features of the app are: A dashboard to view all policies, "AI Scan" to autofill details, a "Policy Explainer", "Cash Deposit" logging, and an "Engagement" tool.
    The current user is an agent. A sample customer policy is provided for context. Keep answers concise.
  `;
  const policy = await db.findPolicyById("PL-1002");
  const personalizedContext = `
    Context about one of the agent's customers:
    - Customer Name: ${policy?.customer}, Policy ID: ${policy?.id}, Status: ${policy?.status}
  `;
  const prompt = `${context}\n${personalizedContext}\n\nAgent's Question: "${message}"`;

  try {
    const reply = await llmService.getCompletion(prompt);
    res.status(200).json({ reply });
  } catch (error) {
    res.status(500).json({ error: "The AI Chatbot service failed to respond. Please check the server logs and API keys." });
  }
};