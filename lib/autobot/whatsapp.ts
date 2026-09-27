export async function sendWhatsAppMessage(to: string, message: string): Promise<{ success: boolean; error?: string; data?: any }> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    const err = "WhatsApp API configuration (WHATSAPP_TOKEN or PHONE_NUMBER_ID) is missing in environment variables.";
    console.error(err);
    return { success: false, error: err };
  }

  // Clean the recipient phone number: only digits
  let cleanTo = to.replace(/\D/g, "");
  if (cleanTo.length === 10) {
    cleanTo = `91${cleanTo}`;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanTo,
          type: "text",
          text: {
            preview_url: false,
            body: message,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data?.error?.message || data?.error?.error_data?.details || "Failed to send WhatsApp message via Meta API.";
      console.error("Meta WhatsApp API error response:", data);
      return { success: false, error: errorMsg, data };
    }

    console.log(`WhatsApp message sent successfully to ${cleanTo}`);
    return { success: true, data };
  } catch (error: any) {
    console.error("Error sending WhatsApp message:", error);
    return { success: false, error: error?.message || "Network error communicating with Meta WhatsApp API." };
  }
}
