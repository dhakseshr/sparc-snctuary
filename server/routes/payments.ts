import { RequestHandler } from "express";
import fetch from "node-fetch";

// This workflow handles payment processing and policy activation.
export const handlePaymentCreation: RequestHandler = async (req, res) => {
  const { policyId, amount, customer, method } = req.body;

  // --- WORKFLOW PLACEHOLDER ---
  // Replace with your actual Buildship URL for creating a payment order.
  const buildshipApiUrl = "https://<YOUR_WORKFLOW_URL>.buildship.run/create_payment_order";

  try {
    const response = await fetch(buildshipApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ policyId, amount, customer, method }),
    });

    if (!response.ok) {
      throw new Error("Failed to create payment order in Buildship.");
    }

    const data = await response.json();
    // Assuming Buildship returns data needed by a payment gateway SDK on the frontend
    res.status(200).json(data);

  } catch (error) {
    console.error("Payment creation error:", error);
    res.status(500).json({ error: "Failed to initiate payment." });
  }
};