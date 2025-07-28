// Test script for n8n webhooks
// Run with: node test-webhooks.js

const testWebhooks = async () => {
  const webhookUrl = 'https://devwebhookn8n.ezequiellamas.com/webhook/ac5e3a10-d546-485d-af62-fbad22a30912';

  const testData = {
    message: 'Test message from webhook tester',
    userId: 'test-user-123',
    timestamp: new Date().toISOString(),
    sessionId: 'test-session-' + Date.now(),
    metadata: {
      userAgent: 'Test-Script/1.0',
      platform: 'Node.js',
      language: 'en-US',
    }
  };

  console.log('🧪 Testing n8n Webhooks');
  console.log('========================');
  console.log('');

  // Test Webhook
  console.log('📡 Testing Webhook...');
  console.log(`URL: ${webhookUrl}`);
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Webhook-Tester/1.0',
      },
      body: JSON.stringify(testData),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Webhook SUCCESS');
      console.log('Response:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ Webhook FAILED');
      console.log('Status:', response.status);
      console.log('Status Text:', response.statusText);
    }
  } catch (error) {
    console.log('❌ Webhook ERROR');
    console.log('Error:', error.message);
  }

  console.log('');
  console.log('🏁 Test completed!');
};

// Run the test
testWebhooks().catch(console.error); 