import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wifi, WifiOff, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { n8nService } from '@/services/n8nService';
import { toast } from '@/hooks/use-toast';

interface WebhookStatus {
  webhook: 'checking' | 'connected' | 'disconnected';
  lastTest?: Date;
}

export const WebhookDiagnostics = () => {
  const [status, setStatus] = useState<WebhookStatus>({
    webhook: 'checking'
  });
  const [isTesting, setIsTesting] = useState(false);
  const [lastResponse, setLastResponse] = useState<any>(null);

  const testWebhooks = async () => {
    setIsTesting(true);
    setStatus({
      webhook: 'checking'
    });

    try {
      const response = await n8nService.sendMessage('Test message from diagnostics', 'diagnostic-user');
      setStatus(prev => ({ ...prev, webhook: 'connected' }));
      setLastResponse(response);
      toast({
        title: "Webhook",
        description: "✅ Conectado exitosamente",
      });
    } catch (error) {
      setStatus(prev => ({ ...prev, webhook: 'disconnected' }));
      console.error('Webhook failed:', error);
      toast({
        title: "Error en diagnóstico",
        description: "No se pudo conectar con el webhook",
        variant: "destructive"
      });
    } finally {
      setStatus(prev => ({ ...prev, lastTest: new Date() }));
      setIsTesting(false);
    }
  };

  const getStatusIcon = (status: 'checking' | 'connected' | 'disconnected') => {
    switch (status) {
      case 'checking':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: 'checking' | 'connected' | 'disconnected') => {
    switch (status) {
      case 'checking':
        return 'bg-yellow-100 text-yellow-800';
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'disconnected':
        return 'bg-red-100 text-red-800';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="h-5 w-5" />
          Diagnóstico de Webhooks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
                 <div className="border rounded-lg p-4">
           <div className="flex items-center justify-between mb-2">
             <h3 className="font-medium">Webhook</h3>
             <Badge className={getStatusColor(status.webhook)}>
               {getStatusIcon(status.webhook)}
               <span className="ml-1">
                 {status.webhook === 'checking' ? 'Verificando...' :
                  status.webhook === 'connected' ? 'Conectado' : 'Desconectado'}
               </span>
             </Badge>
           </div>
           <p className="text-sm text-muted-foreground">
             https://devwebhookn8n.ezequiellamas.com/webhook/ac5e3a10-d546-485d-af62-fbad22a30912
           </p>
         </div>

        {/* Test Button */}
        <div className="flex justify-center">
          <Button
            onClick={testWebhooks}
            disabled={isTesting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isTesting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Probando...
              </>
            ) : (
              <>
                <Wifi className="h-4 w-4 mr-2" />
                Probar Webhooks
              </>
            )}
          </Button>
        </div>

        {/* Last Test Info */}
        {status.lastTest && (
          <div className="text-center text-sm text-muted-foreground">
            Última prueba: {status.lastTest.toLocaleString()}
          </div>
        )}

        {/* Last Response */}
        {lastResponse && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <h4 className="font-medium mb-2">Última Respuesta:</h4>
            <pre className="text-xs overflow-auto bg-white p-2 rounded border">
              {JSON.stringify(lastResponse, null, 2)}
            </pre>
          </div>
        )}

        {/* Status Summary */}
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm">Funcionando</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm">Error</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <span className="text-sm">Verificando</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 