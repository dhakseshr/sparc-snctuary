import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleAiScan, aiScanUpload, handleGenerateDocument, handleNextBestAction } from "./routes/aiFeatures";
import { handleChatbotQuery } from "./routes/chatbot";
import { handleEngagementBlast, handleGetSuggestion } from "./routes/engagement";
import { handleSendReminder, handleSendRecommendation } from "./routes/notifications";
import { handleMockPayment } from "./routes/payments";

// --- NEW IMPORTS ---
import { handleAnalyzePolicy, policyUpload } from "./routes/policies";

export function createServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // AI & Core Features
  app.post("/api/ai-scan", aiScanUpload, handleAiScan);
  app.post("/api/generate-document", handleGenerateDocument);
  app.get("/api/next-best-action", handleNextBestAction);
  
  // --- NEW ROUTE ---
  app.post("/api/policies/analyze", policyUpload, handleAnalyzePolicy);

  // Communication & Engagement
  app.post("/api/chatbot", handleChatbotQuery);
  app.post("/api/engagement/send", handleEngagementBlast);
  app.post("/api/engagement/get-suggestion", handleGetSuggestion);
  app.post("/api/notifications/reminder", handleSendReminder);
  app.post("/api/notifications/recommend", handleSendRecommendation);

  // Payments
  app.post("/api/payments/confirm", handleMockPayment);

  return app;
}