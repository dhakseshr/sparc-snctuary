import { RequestHandler } from "express";
import { db } from "../services/supabaseService";
import { whatsappService } from "../services/whatsappService"; // CORRECTED PATH
import { llmService } from "../services/llmService";

export const handleEngagementBlast: RequestHandler = async (req, res) => {
    const { customerSegment, message } = req.body;
    try {
      const customers = await db.findCustomersBySegment(customerSegment);
      if (!customers.length) {
        return res.status(200).json({ message: "No customers found in this segment.", sentCount: 0 });
      }
      let sentCount = 0;
      for (const customer of customers) {
        if (customer.phone) {
          await whatsappService.sendMessage(customer.phone, message);
          sentCount++;
        }
      }
      res.status(200).json({ message: `Engagement message sent to ${sentCount} customers.`, sentCount });
    } catch (error) {
      res.status(500).json({ error: "Failed to send engagement messages." });
    }
};

export const handleGetSuggestion: RequestHandler = async (req, res) => {
  const { text } = req.body;

  if (!text || text.trim().length < 15) {
    return res.status(200).json({ suggestion: "" });
  }

  const prompt = `
    You are a writing assistant for an insurance agent.
    Rephrase the following message to be more professional, engaging, and clear for a customer.
    Keep it concise and friendly.
    Do not add any preamble like "Here's a revised version:". Just provide the rephrased text directly.

    Original message: "${text}"
  `;

  try {
    const suggestion = await llmService.getCompletion(prompt);
    res.status(200).json({ suggestion });
  } catch (error) {
    res.status(500).json({ error: "Failed to get suggestion." });
  }
};