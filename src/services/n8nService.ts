interface N8nMessage {
  message: string;
  userId?: string;
  timestamp: string;
  sessionId: string;
  metadata?: {
    userAgent?: string;
    platform?: string;
    language?: string;
  };
}

interface N8nResponse {
  output?: string;
  response?: string;
  success?: boolean;
  timestamp?: string;
  sessionId?: string;
}

class N8nService {
  private webhookUrl = 'https://devwebhookn8n.ezequiellamas.com/webhook/ac5e3a10-d546-485d-af62-fbad22a30912';
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  private async makeRequest(url: string, data: N8nMessage): Promise<N8nResponse> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'VirtualTutor-WebApp/1.0',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  }

  private async retryRequest(url: string, data: N8nMessage, attempt: number = 1): Promise<N8nResponse> {
    try {
      return await this.makeRequest(url, data);
    } catch (error) {
      if (attempt < this.maxRetries) {
        console.warn(`Attempt ${attempt} failed, retrying in ${this.retryDelay}ms...`, error);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        return this.retryRequest(url, data, attempt + 1);
      }
      throw error;
    }
  }

  async sendMessage(
    message: string, 
    userId?: string, 
    sessionId: string = 'virtual-tutor-session'
  ): Promise<N8nResponse> {
    const data: N8nMessage = {
      message,
      userId,
      timestamp: new Date().toISOString(),
      sessionId,
      metadata: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
      }
    };

    try {
      // Send to webhook
      const response = await this.retryRequest(this.webhookUrl, data);
      return response;
    } catch (error) {
      console.error('Webhook failed:', error);
      throw new Error('No se pudo conectar con el tutor virtual. Por favor, intenta más tarde.');
    }
  }

  // Method to test webhook connectivity without sending actual messages
  async testConnection(): Promise<boolean> {
    try {
      // Just check if the webhook endpoint is reachable without sending a test message
      const response = await fetch(this.webhookUrl, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'VirtualTutor-WebApp/1.0',
        },
      });
      
      // Consider it connected if we get any response (even 404 is better than network error)
      return response.status < 500; // Any status < 500 means the server is reachable
    } catch (error) {
      console.error('Webhook connectivity test failed:', error);
      return false;
    }
  }
}

export const n8nService = new N8nService();
export type { N8nMessage, N8nResponse }; 