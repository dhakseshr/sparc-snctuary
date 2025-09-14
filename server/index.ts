import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleAiScan, aiScanUpload, handleGenerateDocument, handleNextBestAction } from "./routes/aiFeatures";
import { handleChatbotQuery } from "./routes/chatbot";
import { handleEngagementBlast, handleGetSuggestion } from "./routes/engagement";
import { handleSendReminder, handleSendRecommendation } from "./routes/notifications";
import { handleMockPayment, handleConfirmCashPayment } from "./routes/payments";
import { handleAnalyzePolicy, policyUpload, getAllPolicies } from "./routes/policies";
import { addCustomer } from "./routes/customers";
import { pdfUpload, handlePolicyUploadAndExtract, getUnassignedPolicies, getAllCustomers, assignPolicyToCustomer } from "./routes/onboarding";

export function createServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // --- CORE DATA ROUTES ---
  app.get("/api/policies", getAllPolicies);
  app.post("/api/customers", addCustomer);

  // --- ONBOARDING ROUTES ---
  app.post("/api/onboarding/extract-policies", pdfUpload, handlePolicyUploadAndExtract);
  app.get("/api/onboarding/unassigned-policies", getUnassignedPolicies);
  app.get("/api/onboarding/customers", getAllCustomers);
  app.post("/api/onboarding/assign-policy", assignPolicyToCustomer);

  // AI & Core Features
  app.post("/api/ai-scan", aiScanUpload, handleAiScan);
  app.post("/api/generate-document", handleGenerateDocument);
  app.get("/api/next-best-action", handleNextBestAction);
  app.post("/api/policies/analyze", policyUpload, handleAnalyzePolicy);

  // Communication & Engagement
  app.post("/api/chatbot", handleChatbotQuery);
  app.post("/api/engagement/send", handleEngagementBlast);
  app.post("/api/engagement/get-suggestion", handleGetSuggestion);
  app.post("/api/notifications/reminder", handleSendReminder);
  app.post("/api/notifications/recommend", handleSendRecommendation);

  // Payments
  app.post("/api/payments/confirm", handleMockPayment);
  app.post("/api/payments/confirm-cash", handleConfirmCashPayment);

  return app;
}