import { RequestHandler } from "express";
import fetch from "node-fetch";
import FormData from "form-data";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

export const handleAiScan: RequestHandler = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  // IMPORTANT: Replace with your actual Buildship API endpoint URL
  const buildshipApiUrl = "https://<YOUR_WORKFLOW_URL>.buildship.run/image-text-extraction-to-dynamic-database-4bafa2afc7a2";

  try {
    const formData = new FormData();
    formData.append("uploadImages", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });
    // You can make this dynamic if needed, e.g., from req.body
    formData.append("databaseTableName", "insurancePolicies");

    const response = await fetch(buildshipApiUrl, {
      method: "POST",
      body: formData,
      // Pass headers if required by Buildship, but FormData usually sets its own
      // headers: formData.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Buildship API Error:", errorText);
      throw new Error(`Buildship API failed with status: ${response.status}`);
    }

    const data = await response.json();

    // Assuming the final step in your Buildship workflow is named 'analyze_content_structure'
    // and returns the extracted data in its 'output' property.
    // Adjust this path based on your actual Buildship workflow structure.
    const extractedDetails = data.output; // Or data.steps.analyze_content_structure.output;

    res.status(200).json(extractedDetails);
  } catch (error) {
    console.error("Error calling Buildship workflow:", error);
    res.status(500).json({ error: "Failed to process document with AI." });
  }
};

// We need to export the upload middleware to use in the main server file
export const aiScanUpload = upload.single("document");