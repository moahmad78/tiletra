const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function testWhatsApp() {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.PHONE_NUMBER_ID;
  const to = '919264920211';

  console.log('Testing Meta Graph API:');
  console.log('Phone Number ID:', phoneNumberId);
  console.log('Token (length):', token ? token.length : 0);

  try {
    const url = "https://graph.facebook.com/v19.0/" + phoneNumberId + "/messages";
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'text',
        text: { preview_url: false, body: 'Hello from Intrihub Customer Desk Test' },
      }),
    });

    const data = await response.json();
    console.log('HTTP Status:', response.status);
    console.log('Response Data:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testWhatsApp();
