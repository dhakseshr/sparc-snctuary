import { RequestHandler } from "express";
import fetch from "node-fetch";
import FormData from "form-data";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

// Middleware to handle the file upload from the frontend
export const aiScanUpload = upload.single("document");

// Handler that forwards the file to your Buildship workflow
export const handleAiScan: RequestHandler = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  const buildshipApiUrl = process.env.BUILTSHIP_AI_SCAN_URL;
  if (!buildshipApiUrl) {
    console.error("Buildship AI Scan URL is not set in .env");
    return res.status(500).json({ error: "AI Scan service is not configured." });
  }

  try {
    // Create a new FormData object to send to Buildship
    const formData = new FormData();
    formData.append("uploadImages", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });
    formData.append("databaseTableName", "insurancePolicies"); // Pass other inputs your workflow needs

    // Call the Buildship workflow
    const response = await fetch(buildshipApiUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Buildship API failed: ${errorText}`);
    }

    const data = await response.json();
    
    // Assuming your workflow's final output is in a property named 'output'
    res.status(200).json(data.output);
    
  } catch (error) {
    console.error("Error proxying to Buildship AI workflow:", error);
    res.status(500).json({ error: (error as Error).message });
  }
};