// Test script for n8n webhook response debugging
// Run with: node test-webhook-response.js

const testWebhookResponse = async () => {
  const webhookUrl = 'https://devwebhookn8n.ezequiellamas.com/webhook/ac5e3a10-d546-485d-af62-fbad22a30912';

  const testData = {
    message: 'Test message for debugging webhook response',
    userId: 'debug-user-123',
    timestamp: new Date().toISOString(),
    sessionId: 'debug-session-' + Date.now(),
    metadata: {
      userAgent: 'Debug-Script/1.0',
      platform: 'Node.js',
      language: 'en-US',
    }
  };

  console.log('🔍 Debugging n8n Webhook Response');
  console.log('==================================');
  console.log('');
  console.log('📡 Sending request to:', webhookUrl);
  console.log('📦 Payload:', JSON.stringify(testData, null, 2));
  console.log('');

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Webhook-Debugger/1.0',
      },
      body: JSON.stringify(testData),
    });

    console.log('📊 Response Details:');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    console.log('');

    if (response.ok) {
      try {
        const result = await response.json();
        console.log('✅ SUCCESS - Response Body:');
        console.log(JSON.stringify(result, null, 2));
      } catch (parseError) {
        console.log('⚠️  SUCCESS but could not parse JSON response');
        console.log('Raw response:', await response.text());
      }
    } else {
      console.log('❌ FAILED - Error Response:');
      try {
        const errorResult = await response.json();
        console.log(JSON.stringify(errorResult, null, 2));
      } catch (parseError) {
        console.log('Raw error response:', await response.text());
      }
    }
  } catch (error) {
    console.log('❌ NETWORK ERROR:');
    console.log('Error:', error.message);
    console.log('Type:', error.name);
  }

  console.log('');
  console.log('🔧 Troubleshooting Tips:');
  console.log('1. Check n8n workflow is active');
  console.log('2. Verify webhook URL is correct');
  console.log('3. Ensure "Respond to Webhook" node is configured');
  console.log('4. Check n8n logs for errors');
  console.log('5. Verify workflow execution in n8n dashboard');
};

// Run the test
testWebhookResponse().catch(console.error); 