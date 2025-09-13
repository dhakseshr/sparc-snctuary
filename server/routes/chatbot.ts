import { RequestHandler } from "express";
import fetch from "node-fetch";

// This workflow handles dynamic chatbot responses.
export const handleChatbotQuery: RequestHandler = async (req, res) => {
  const { message, userId } = req.body; // Assuming you can identify the user

  // --- WORKFLOW PLACEHOLDER ---
  // Replace with your Buildship URL for the advanced chatbot logic.
  const buildshipApiUrl = "https://<YOUR_WORKFLOW_URL>.buildship.run/advanced_chatbot";

  try {
    const response = await fetch(buildshipApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, userId }),
    });

    if (!response.ok) {
      throw new Error("Chatbot workflow failed in Buildship.");
    }

    const data = await response.json();
    // Assuming the workflow returns a JSON object like { reply: "..." }
    res.status(200).json(data);

  } catch (error) {
    console.error("Chatbot error:", error);
    res.status(500).json({ error: "Chatbot is currently unavailable." });
  }
};