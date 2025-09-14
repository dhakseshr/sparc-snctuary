import { RequestHandler } from "express";
import { whatsappService } from "../services/whatsappService";
import { db } from "../services/supabaseService";

export const handleSendReminder: RequestHandler = async (req, res) => {
  const { policyId, phone, customer } = req.body;
  if (!policyId || !phone || !customer) {
      return res.status(400).json({ error: "Policy ID, Phone, and Customer Name are required." });
  }
  const message = `Dear ${customer}, this is a friendly reminder that your policy ${policyId} is due for renewal soon. Please make the payment to ensure continued coverage. Thank you, Turtlemint.`;

  try {
      const success = await whatsappService.sendMessage(phone, message);
      if (success) {
          res.status(200).json({ message: "Reminder sent successfully." });
      } else {
          throw new Error("WhatsApp service failed to send the message.");
      }
  } catch (error) {
      res.status(500).json({ error: "Failed to send reminder." });
  }
};

export const handleSendRecommendation: RequestHandler = async (req, res) => {
  const { customerName, policyName, premium, coverage } = req.body;

  try {
    const customer = await db.findCustomerByName(customerName);
    if (!customer || !customer.phone) {
        return res.status(404).json({ error: "Customer phone number not found." });
    }

    const message = `Hi ${customerName}, based on your needs, I recommend the "${policyName}" plan. It offers coverage of ₹${coverage.toLocaleString()} for a premium of just ₹${premium.toLocaleString()}. Let me know if you're interested!`;
    
    const success = await whatsappService.sendMessage(customer.phone, message);
    if(success) {
      res.status(200).json({ message: "Recommendation sent successfully." });
    } else {
      throw new Error("WhatsApp service failed to send message");
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to send recommendation." });
  }
};