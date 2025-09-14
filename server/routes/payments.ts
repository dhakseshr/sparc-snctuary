import { RequestHandler } from "express";
import { db } from "../services/dbService";

/**
 * This handler simulates a successful payment confirmation.
 * In a real-world app, this would be a secure webhook endpoint called by a payment gateway like Razorpay.
 * For the hackathon demo, it allows us to demonstrate the full workflow.
 */
export const handleMockPayment: RequestHandler = async (req, res) => {
  const { policyId } = req.body;

  if (!policyId) {
    return res.status(400).json({ status: "failure", message: "Policy ID is required." });
  }

  try {
    console.log(`(SIMULATED) Payment received for policy: ${policyId}`);
    
    // Simulate network and processing time for realism in the demo
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Update the policy status in our mock database from 'Renewal Due' to 'Active'
    const updatedPolicy = await db.updatePolicyStatus(policyId, "Active");

    if (!updatedPolicy) {
        return res.status(404).json({ status: "failure", message: "Policy not found." });
    }
    
    console.log(`(SIMULATED) Policy ${policyId} has been marked as Active.`);
    
    // In a production app, you would trigger a WhatsApp receipt notification from here.

    // Send a success response back to the frontend
    res.status(200).json({ status: "success", message: "Payment confirmed successfully.", updatedPolicy });

  } catch (error) {
    console.error("Mock payment processing failed:", error);
    res.status(500).json({ status: "failure", message: "An error occurred during mock payment processing." });
  }
};