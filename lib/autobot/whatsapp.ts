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

export async function sendWhatsAppMediaMessage(
  to: string,
  mediaType: "image" | "document",
  mediaUrl: string,
  caption?: string,
  fileName?: string
): Promise<{ success: boolean; error?: string; data?: any }> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    const err = "WhatsApp API configuration (WHATSAPP_TOKEN or PHONE_NUMBER_ID) is missing in environment variables.";
    console.error(err);
    return { success: false, error: err };
  }

  let cleanTo = to.replace(/\D/g, "");
  if (cleanTo.length === 10) {
    cleanTo = `91${cleanTo}`;
  }

  try {
    const mediaPayload: Record<string, any> = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanTo,
      type: mediaType,
    };

    if (mediaType === "document") {
      mediaPayload.document = {
        link: mediaUrl,
        caption: caption || "",
        filename: fileName || "IntriHub_Catalog.pdf",
      };
    } else if (mediaType === "image") {
      mediaPayload.image = {
        link: mediaUrl,
        caption: caption || "",
      };
    }

    const response = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mediaPayload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data?.error?.message || data?.error?.error_data?.details || "Failed to send WhatsApp media message via Meta API.";
      console.error("Meta WhatsApp Media API error response:", data);
      return { success: false, error: errorMsg, data };
    }

    console.log(`WhatsApp media (${mediaType}) sent successfully to ${cleanTo}`);
    return { success: true, data };
  } catch (error: any) {
    console.error("Error sending WhatsApp media message:", error);
    return { success: false, error: error?.message || "Network error communicating with Meta WhatsApp API." };
  }
}

export async function sendWhatsAppTemplateMessage(
  to: string,
  templateName: string,
  languageCode: string = "en_US",
  components: any[] = []
): Promise<{ success: boolean; error?: string; data?: any }> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    const err = "WhatsApp API configuration (WHATSAPP_TOKEN or PHONE_NUMBER_ID) is missing in environment variables.";
    console.error(err);
    return { success: false, error: err };
  }

  let cleanTo = to.replace(/\D/g, "");
  if (cleanTo.length === 10) {
    cleanTo = `91${cleanTo}`;
  }

  try {
    const payload: Record<string, any> = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanTo,
      type: "template",
      template: {
        name: templateName,
        language: {
          code: languageCode,
        },
      },
    };

    if (components && components.length > 0) {
      payload.template.components = components;
    }

    const response = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data?.error?.message || data?.error?.error_data?.details || "Failed to send template message via Meta API.";
      console.error("Meta WhatsApp Template API error response:", data);
      return { success: false, error: errorMsg, data };
    }

    console.log(`WhatsApp template (${templateName}) sent successfully to ${cleanTo}`);
    return { success: true, data };
  } catch (error: any) {
    console.error("Error sending WhatsApp template message:", error);
    return { success: false, error: error?.message || "Network error communicating with Meta WhatsApp API." };
  }
}

export async function checkCustomerSessionWindow(phone: string): Promise<{ inside24h: boolean; lastMessageAt?: string }> {
  const { supabaseAdmin } = await import("@/lib/autobot/supabase");
  let cleanTo = phone.replace(/\D/g, "");
  if (cleanTo.length === 10) cleanTo = `91${cleanTo}`;

  try {
    const { data: chat } = await supabaseAdmin
      .from("chats")
      .select("id, last_message_at")
      .eq("customer_phone", cleanTo)
      .maybeSingle();

    if (!chat) {
      return { inside24h: false };
    }

    const { data: msg } = await supabaseAdmin
      .from("messages")
      .select("created_at")
      .eq("chat_id", chat.id)
      .eq("sender", "customer")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!msg || !msg.created_at) {
      return { inside24h: false };
    }

    const lastMsgTime = new Date(msg.created_at).getTime();
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const inside24h = now - lastMsgTime < twentyFourHours;

    return { inside24h, lastMessageAt: msg.created_at };
  } catch (err) {
    console.error("Error checking session window:", err);
    return { inside24h: false };
  }
}

export async function fetchWhatsAppTemplates(): Promise<{
  name: string;
  category: string;
  language: string;
  status: string;
  components?: any[];
}[]> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.PHONE_NUMBER_ID;

  const fallbackTemplates = [
    {
      name: "hello_world",
      category: "MARKETING",
      language: "en_US",
      status: "APPROVED",
      components: [
        { type: "BODY", text: "Welcome and congratulations on joining IntriHub!" },
      ],
    },
    {
      name: "intrihub_catalog_update",
      category: "MARKETING",
      language: "en_US",
      status: "APPROVED",
      components: [
        { type: "HEADER", format: "DOCUMENT" },
        { type: "BODY", text: "Hello! Here is the latest verified building materials & tiles catalog from IntriHub." },
      ],
    },
    {
      name: "intrihub_offer_alert",
      category: "MARKETING",
      language: "en_US",
      status: "APPROVED",
      components: [
        { type: "BODY", text: "Exciting special offers on tiles and sanitaryware at IntriHub! Contact our support desk for B2B wholesale pricing." },
      ],
    },
    {
      name: "customer_support_reconnect",
      category: "UTILITY",
      language: "en_US",
      status: "APPROVED",
      components: [
        { type: "BODY", text: "Hello! We are following up regarding your building materials inquiry on IntriHub. Reply to this message to resume instant chat." },
      ],
    },
  ];

  if (!token || !phoneNumberId) {
    return fallbackTemplates;
  }

  try {
    const phoneRes = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}?fields=whatsapp_business_account`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (phoneRes.ok) {
      const phoneData = await phoneRes.json();
      const wabaId = phoneData?.whatsapp_business_account?.id;
      if (wabaId) {
        const templatesRes = await fetch(`https://graph.facebook.com/v19.0/${wabaId}/message_templates`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (templatesRes.ok) {
          const tData = await templatesRes.json();
          if (tData.data && Array.isArray(tData.data) && tData.data.length > 0) {
            return tData.data.map((t: any) => ({
              name: t.name,
              category: t.category,
              language: t.language,
              status: t.status,
              components: t.components,
            }));
          }
        }
      }
    }
    return fallbackTemplates;
  } catch (err) {
    console.warn("Could not fetch Meta templates from API, using catalog templates:", err);
    return fallbackTemplates;
  }
}

