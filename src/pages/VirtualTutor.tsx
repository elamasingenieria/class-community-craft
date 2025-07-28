import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Bot, User, Loader2, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { n8nService } from '@/services/n8nService';


interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const VirtualTutor = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'maintenance'>('connected');
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);



  // Initialize with welcome message
  useEffect(() => {
    try {
      setMessages([
        {
          id: '1',
          content: '¡Hola! Soy tu tutor virtual. ¿En qué puedo ayudarte hoy?',
          sender: 'bot',
          timestamp: new Date()
        }
      ]);
    } catch (error) {
      console.error('Initialization error:', error);
      setError('Error al inicializar el tutor virtual');
    }
  }, []);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    try {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        content: inputMessage,
        sender: 'user',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage]);
      const currentMessage = inputMessage;
      setInputMessage('');
      setIsLoading(true);

      // Always try to send the message
      try {
        const response = await n8nService.sendMessage(currentMessage, user?.id);
        
        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: response.output || response.response || 'Lo siento, no pude procesar tu mensaje. ¿Podrías intentarlo de nuevo?',
          sender: 'bot',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, botMessage]);
        setConnectionStatus('connected'); // Reset to connected on success
      } catch (error) {
        console.error('Error sending message:', error);
        setConnectionStatus('maintenance'); // Change to maintenance on error
        
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: 'Lo siento, no se pudo enviar tu mensaje. Por favor, intenta de nuevo.',
          sender: 'bot',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, errorMessage]);
        
        toast({
          title: "Error",
          description: "No se pudo enviar el mensaje. Por favor, intenta de nuevo.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Unexpected error in sendMessage:', error);
      setError('Error inesperado al enviar mensaje');
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      try {
        sendMessage();
      } catch (error) {
        console.error('Error in handleKeyPress:', error);
        setError('Error al procesar el mensaje');
      }
    }
  };

  // Show error state if there's an error
  if (error) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">Tutor Virtual</h1>
            <p className="text-muted-foreground mt-2">
              Chatea con tu tutor virtual para obtener ayuda con tus estudios
            </p>
          </div>
          
          <Card className="p-6">
            <div className="text-center">
              <div className="text-red-500 mb-4">
                <AlertCircle className="h-12 w-12 mx-auto" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Error en el Tutor Virtual</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button 
                onClick={() => window.location.reload()} 
                className="bg-blue-600 hover:bg-blue-700"
              >
                Recargar Página
              </Button>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Tutor Virtual</h1>
          <p className="text-muted-foreground mt-2">
            Chatea con tu tutor virtual para obtener ayuda con tus estudios
          </p>
        </div>

        <Card className="h-[600px] flex flex-col">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-blue-600" />
                Tutor Virtual
              </div>
                             <div className="flex items-center gap-2">
                 {connectionStatus === 'connected' && (
                   <div className="flex items-center gap-1 text-xs text-green-600">
                     <Wifi className="h-3 w-3" />
                     Conectado
                   </div>
                 )}
                 {connectionStatus === 'maintenance' && (
                   <div className="flex items-center gap-1 text-xs text-yellow-600">
                     <WifiOff className="h-3 w-3" />
                     En mantenimiento
                   </div>
                 )}
               </div>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.sender === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {message.sender === 'bot' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div
                    className={cn(
                      "max-w-[70%] rounded-lg px-4 py-2 relative",
                      message.sender === 'user'
                        ? "bg-blue-600 text-white"
                        : "bg-muted text-foreground"
                    )}
                  >
                    <p className="text-sm">{message.content}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className={cn(
                        "text-xs",
                        message.sender === 'user' ? "text-blue-100" : "text-muted-foreground"
                      )}>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  {message.sender === 'user' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-green-100 text-green-600">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Escribiendo...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

                         {/* Connection Status Message */}
             {connectionStatus === 'maintenance' && (
               <div className="px-4 py-2 bg-yellow-50 border-t border-yellow-200">
                 <div className="flex items-center gap-2 text-sm text-yellow-800">
                   <WifiOff className="h-4 w-4" />
                   <span>El tutor virtual está en mantenimiento. Por favor, intenta más tarde.</span>
                 </div>
               </div>
             )}

            {/* Input Area */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe tu mensaje..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Presiona Enter para enviar, Shift+Enter para nueva línea
              </p>
            </div>
          </CardContent>
        </Card>

        
      </div>
    </DashboardLayout>
  );
};

export default VirtualTutor; 