import fetch from 'node-fetch';

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;
const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN;
const WHATSAPP_SENDER_PHONE = process.env.WHATSAPP_SENDER_PHONE;

export const whatsappService = {
  sendMessage: async (to: string, message: string): Promise<boolean> => {
    if (!WHATSAPP_API_URL || !WHATSAPP_API_TOKEN || !WHATSAPP_SENDER_PHONE) {
      console.error("WhatsApp API credentials are not set in .env");
      console.log(`(SIMULATED) WhatsApp message to ${to}: ${message}`);
      return true;
    }

    try {
      const response = await fetch(WHATSAPP_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: to,
          type: "text",
          text: { body: message }
        })
      });
      return response.ok;
    } catch (error) {
      console.error("Failed to send WhatsApp message:", error);
      return false;
    }
  }
};