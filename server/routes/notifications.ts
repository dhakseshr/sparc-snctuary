import { RequestHandler } from "express";
import fetch from "node-fetch";

// This workflow handles sending WhatsApp reminders.
export const handleSendReminder: RequestHandler = async (req, res) => {
  // ... (this function remains unchanged)
};

// --- NEW FUNCTION ---
// This workflow handles sending a specific plan recommendation to a customer.
export const handleSendRecommendation: RequestHandler = async (req, res) => {
  const { customerName, policyName, premium, coverage } = req.body;

  // --- WORKFLOW PLACEHOLDER ---
  // This can use the same notification workflow, just with a different message type.
  const buildshipApiUrl = "https://<YOUR_WORKFLOW_URL>.buildship.run/send_whatsapp_notification";

  try {
    const response = await fetch(buildshipApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName,
        messageType: "plan_recommendation",
        details: `Hi ${customerName}, based on your needs, I recommend the ${policyName} plan with ₹${coverage.toLocaleString()} coverage for a premium of just ₹${premium.toLocaleString()}. Let me know if you're interested!`
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send recommendation via Buildship.");
    }

    res.status(200).json({ message: "Recommendation sent successfully." });

  } catch (error) {
    console.error("Recommendation notification error:", error);
    res.status(500).json({ error: "Failed to send recommendation." });
  }
};