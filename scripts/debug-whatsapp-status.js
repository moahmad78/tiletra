const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const token = process.env.WHATSAPP_TOKEN?.trim();
const phoneId = process.env.PHONE_NUMBER_ID?.trim() || '1393425093847653';
const wabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID?.trim() || '1601513934764142';

function mask(str) {
  if (!str || str.length < 10) return '*** (EMPTY OR INVALID)';
  return str.slice(0, 6) + '...' + str.slice(-4);
}

async function run() {
  console.log('====================================================');
  console.log('🔍 LIVE WHATSAPP CLOUD API & WABA DIAGNOSTICS');
  console.log('====================================================');
  console.log(`Target Phone Number ID : ${phoneId}`);
  console.log(`Target WABA ID          : ${wabaId}`);
  console.log(`Masked Access Token     : ${mask(token)}`);
  console.log(`Token Length            : ${token ? token.length : 0} chars\n`);

  // 1. Phone number live status
  console.log('--- 1. PHONE NUMBER LIVE GRAPH API STATUS ---');
  try {
    const url = `https://graph.facebook.com/v21.0/${phoneId}?fields=code_verification_status,quality_rating,name_status,status,display_phone_number,messaging_limit_tier,verified_name,is_pin_enabled,account_mode,health_status,platform_type,throughput`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    console.log(`HTTP Status: ${res.status}`);
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Phone status error:', err);
  }

  // 2. WABA details & Business verification
  console.log('\n--- 2. WABA (WHATSAPP BUSINESS ACCOUNT) & BUSINESS VERIFICATION ---');
  try {
    const url = `https://graph.facebook.com/v21.0/${wabaId}?fields=id,name,timezone_id,account_review_status,business_verification_status,ownership_type,primary_funding_id,currency,message_template_namespace`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    console.log(`HTTP Status: ${res.status}`);
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('WABA status error:', err);
  }

  // 3. Subscribed apps
  console.log('\n--- 3. SUBSCRIBED APPS (WEBHOOK ROUTING) ---');
  try {
    const url = `https://graph.facebook.com/v21.0/${wabaId}/subscribed_apps`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    console.log(`HTTP Status: ${res.status}`);
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Subscribed apps error:', err);
  }

  // 4. Token Debug / Scope Check
  console.log('\n--- 4. ACCESS TOKEN DEBUG (SCOPES & APP ID) ---');
  try {
    const url = `https://graph.facebook.com/v21.0/debug_token?input_token=${token}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    console.log(`HTTP Status: ${res.status}`);
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Token debug error:', err);
  }

  // 5. Check Supabase recent incoming messages
  console.log('\n--- 5. SUPABASE RECENT LOGGED MESSAGES (LAST 20 RECORDS) ---');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && serviceKey) {
    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/messages?select=*&order=created_at.desc&limit=15`,
        {
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
          },
        }
      );
      const data = await res.json();
      console.log(`Total records found: ${Array.isArray(data) ? data.length : 0}`);
      if (Array.isArray(data)) {
        data.forEach((m, idx) => {
          console.log(`[${idx + 1}] ${m.created_at} | sender=${m.sender} | body="${m.body}" | chat_id=${m.chat_id}`);
        });
      } else {
        console.log(JSON.stringify(data, null, 2));
      }
    } catch (err) {
      console.error('Supabase query error:', err);
    }
  }
}

run();
