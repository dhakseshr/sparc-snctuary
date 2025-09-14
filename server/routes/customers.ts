import { RequestHandler } from "express";
import { db } from "../services/supabaseService";
import { PostgrestError } from "@supabase/supabase-js";

export const addCustomer: RequestHandler = async (req, res) => {
  try {
    const customerDetails = req.body;
    if (!customerDetails || !customerDetails.name) {
      return res.status(400).json({ error: "Customer name is required." });
    }
    const newCustomer = await db.addCustomer(customerDetails);
    res.status(201).json(newCustomer);
  } catch (error) {
    console.error("Failed to add customer:", error);

    // Check if it's a Supabase/PostgrestError
    if (error && typeof error === 'object' && 'code' in error) {
        const dbError = error as PostgrestError;
        
        // Code '23505' is for unique constraint violation in PostgreSQL
        if (dbError.code === '23505') {
            return res.status(409).json({ error: "A customer with this email address already exists." });
        }
    }

    res.status(500).json({ error: "An unexpected error occurred while saving the customer." });
  }
};