import { RequestHandler } from "express";
import fetch from "node-fetch";

// This workflow handles sending bulk customer engagement messages.
export const handleEngagementBlast: RequestHandler = async (req, res) => {
  const { customerSegment, message } = req.body;

  // --- WORKFLOW PLACEHOLDER ---
  // Replace with your Buildship URL for customer retention/engagement.
  const buildshipApiUrl = "https://<YOUR_WORKFLOW_URL>.buildship.run/customer_engagement_automation";

  try {
    const response = await fetch(buildshipApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerSegment, message }),
    });

    if (!response.ok) {
      throw new Error("Failed to send engagement blast via Buildship.");
    }

    const data = await response.json();
    res.status(200).json({ message: `Engagement message sent to ${data.sentCount} customers.` });

  } catch (error) {
    console.error("Engagement error:", error);
    res.status(500).json({ error: "Failed to send engagement message." });
  }
};