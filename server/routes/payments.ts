import { RequestHandler } from "express";
import { db } from "../services/supabaseService";

/**
 * This handler simulates a successful payment confirmation for UPI/Card etc.
 */
export const handleMockPayment: RequestHandler = async (req, res) => {
  const { policyId } = req.body;
  if (!policyId) {
    return res.status(400).json({ status: "failure", message: "Policy ID is required." });
  }
  try {
    await new Promise(resolve => setTimeout(resolve, 1500));
    const updatedPolicy = await db.updatePolicyStatus(policyId, "Active");

    if (!updatedPolicy) {
        return res.status(404).json({ status: "failure", message: "Policy not found." });
    }
    res.status(200).json({ status: "success", message: "Payment confirmed successfully.", updatedPolicy });
  } catch (error) {
    res.status(500).json({ status: "failure", message: "An error occurred during mock payment processing." });
  }
};

/**
 * NEW: This handler simulates a successful cash deposit confirmation from a kiosk.
 */
export const handleConfirmCashPayment: RequestHandler = async (req, res) => {
    const { policyId } = req.body;
    if (!policyId) {
        return res.status(400).json({ status: "failure", message: "Policy ID is required." });
    }
    try {
        const updatedPolicy = await db.updatePolicyStatus(policyId, "Active");
        if (!updatedPolicy) {
            return res.status(404).json({ status: "failure", message: "Policy not found." });
        }
        res.status(200).json({ status: "success", message: "Cash deposit confirmed.", updatedPolicy });
    } catch (error) {
        res.status(500).json({ status: "failure", message: "An error occurred during cash payment confirmation." });
    }
};