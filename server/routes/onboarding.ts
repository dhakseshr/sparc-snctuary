import { RequestHandler } from "express";
import multer from "multer";
import pdf from "pdf-parse";
import { db } from "../services/supabaseService";
import { llmService } from "../services/llmService";

const upload = multer({ storage: multer.memoryStorage() });
export const pdfUpload = upload.array("policyDocuments");

// AI-powered policy extraction and creation
export const handlePolicyUploadAndExtract: RequestHandler = async (req, res) => {
  if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
    return res.status(400).json({ error: "No policy documents uploaded." });
  }

  const files = req.files as Express.Multer.File[];
  const results = [];

  for (const file of files) {
    try {
      const data = await pdf(file.buffer);
      const documentText = data.text;

      if (documentText.trim().length < 100) {
        results.push({ fileName: file.originalname, status: 'failed', reason: 'Document content is too short or unreadable.' });
        continue;
      }

      const prompt = `
        You are an insurance data extraction expert. From the following policy document text, extract these exact details:
        - policy_number: The unique policy number.
        - insurer: The name of the insurance company.
        - type: The type of policy (e.g., Health, Life, Motor, Travel).
        - premium_amount: The numerical value of the premium.
        - coverage_amount: The numerical value of the coverage or sum assured.
        - start_date: The policy start date in YYYY-MM-DD format.
        - end_date: The policy end date in YYYY-MM-DD format.
        Return your analysis as a single, clean JSON object with these exact keys. If a value is not found, use null.
        Do not include any text or formatting outside of the JSON object.
        Document Text: """${documentText.substring(0, 8000)}"""
      `;

      const llmResponse = await llmService.getCompletion(prompt);
      const extractedData = JSON.parse(llmResponse.match(/\{[\s\S]*\}/)?.[0] || '{}');

      // Create a unique ID for the policy
      extractedData.id = `POL-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      
      const newPolicy = await db.addUnassignedPolicy(extractedData);
      results.push({ fileName: file.originalname, status: 'success', policy: newPolicy });

    } catch (error) {
      results.push({ fileName: file.originalname, status: 'failed', reason: (error as Error).message });
    }
  }

  res.status(201).json({ message: "Processing complete.", results });
};

// Fetching unassigned policies
export const getUnassignedPolicies: RequestHandler = async (req, res) => {
    try {
        const policies = await db.getUnassignedPolicies();
        res.status(200).json(policies);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

// Fetching all customers for the dropdown
export const getAllCustomers: RequestHandler = async (req, res) => {
    try {
        const customers = await db.getAllCustomers();
        res.status(200).json(customers);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

// Assigning a policy to a customer
export const assignPolicyToCustomer: RequestHandler = async (req, res) => {
    const { policyId, customerId } = req.body;
    if (!policyId || !customerId) {
        return res.status(400).json({ error: "Policy ID and Customer ID are required." });
    }
    try {
        const updatedPolicy = await db.assignPolicy(policyId, customerId);
        res.status(200).json({ message: "Policy assigned successfully.", policy: updatedPolicy });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};