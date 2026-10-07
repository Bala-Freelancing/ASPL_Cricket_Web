import { CONFIG } from '../src/lib/config';

async function testMetaCloudAPI() {
  const token = CONFIG.WHATSAPP_API_TOKEN;
  const phoneId = CONFIG.WHATSAPP_PHONE_NUMBER_ID;
  const recipient = '919942653135'; // 9942653135

  console.log('Testing Meta Cloud API with Token & Phone ID...');
  console.log('Phone ID:', phoneId);

  // 1. Test sending hello_world template
  try {
    const res = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: recipient,
        type: 'template',
        template: {
          name: 'hello_world',
          language: { code: 'en_US' },
        },
      }),
    });

    const data = await res.json();
    console.log('Meta Cloud API Response for', recipient, '(hello_world template):', JSON.stringify(data, null, 2));

    // 2. Test sending custom text message
    const resText = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: recipient,
        type: 'text',
        text: {
          body: `🏏 *MINI IPL CRICKET TOURNAMENT 2026*
----------------------------------------
Registration Receipt & Payment Confirmation

Player Name: anas
Player ID: IPL26-P0004
Registration Fee: ₹108
Payment Status: Successful

Thank you for registering. Please keep your Player ID for future communication.`,
        },
      }),
    });

    const dataText = await resText.json();
    console.log('Meta Cloud API Response for', recipient, '(custom text):', JSON.stringify(dataText, null, 2));
  } catch (err: any) {
    console.error('Fetch error:', err.message);
  }
}

testMetaCloudAPI();
