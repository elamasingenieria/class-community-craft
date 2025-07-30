import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Loader2, Database, BookOpen, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface FileUploadToRAGProps {
  webhookUrl?: string;
}

const FileUploadToRAG = ({ 
  webhookUrl 
}: FileUploadToRAGProps) => {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [selectedEnvironment, setSelectedEnvironment] = useState<'test' | 'production'>('production');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv',
    'application/json',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // Excel
    'application/vnd.ms-excel' // Excel antiguo
  ];

  const webhookUrls = {
    test: 'https://devn8n.ezequiellamas.com/webhook-test/upload-document',
    production: 'https://devwebhookn8n.ezequiellamas.com/webhook/upload-document'
  };

  const currentWebhookUrl = webhookUrl || webhookUrls[selectedEnvironment];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Validar tipo de archivo
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({ 
        title: "Tipo de archivo no soportado", 
        description: "Solo se permiten PDF, Word, Excel, TXT, CSV y JSON.", 
        variant: "destructive" 
      });
      return;
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      toast({ 
        title: "Archivo demasiado grande", 
        description: `El archivo debe ser menor a ${formatFileSize(MAX_FILE_SIZE)}.`, 
        variant: "destructive" 
      });
      return;
    }

    setSelectedFile(file);
    toast({ 
      title: "Archivo seleccionado", 
      description: `${file.name} (${formatFileSize(file.size)})` 
    });
  };

  // Función para crear FormData con archivo binario
  const createFormData = (file: File, userData: any) => {
    const formData = new FormData();
    formData.append('file', file); // Archivo binario
    formData.append('fileName', file.name);
    formData.append('fileType', file.type);
    formData.append('userId', userData.userId);
    formData.append('userEmail', userData.userEmail);
    formData.append('courseId', userData.courseId);
    formData.append('timestamp', userData.timestamp);
    return formData;
  };

  const uploadFile = async () => {
    if (!selectedFile || !user) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      console.log('🚀 Iniciando subida de archivo al RAG...');
      console.log('📁 Archivo:', selectedFile.name, selectedFile.size, selectedFile.type);
      console.log('🌐 Entorno:', selectedEnvironment);
      console.log('🔗 Webhook URL:', currentWebhookUrl);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Prepare user data
      const userData = {
        userId: user.id,
        userEmail: user.email,
        courseId: 'a-learn-general',
        timestamp: new Date().toISOString()
      };

      // Create FormData with binary file
      const formData = createFormData(selectedFile, userData);

      console.log('📤 Enviando archivo binario al webhook...');

      // Send to webhook with FormData
      const response = await fetch(currentWebhookUrl, {
        method: 'POST',
        body: formData // No Content-Type header needed, browser sets it automatically
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();
      console.log('📥 Respuesta del webhook:', result);

      if (response.ok && result.success) {
        toast({ 
          title: "¡Archivo subido exitosamente!", 
          description: `Documento agregado a la base de conocimiento. ${result.details?.chunksProcessed || 0} fragmentos procesados.` 
        });
        setTimeout(() => { 
          setSelectedFile(null); 
          setUploadProgress(0); 
        }, 2000);
      } else {
        throw new Error(result.message || 'Error en la subida');
      }

    } catch (error) {
      console.error('❌ Error en uploadFile:', error);
      toast({ 
        title: "Error al subir archivo", 
        description: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`, 
        variant: "destructive" 
      });
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />;
    if (fileType.includes('word') || fileType.includes('document')) return <FileText className="h-8 w-8 text-blue-500" />;
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return <FileText className="h-8 w-8 text-green-500" />;
    if (fileType.includes('text') || fileType.includes('csv')) return <FileText className="h-8 w-8 text-gray-500" />;
    return <FileText className="h-8 w-8 text-gray-400" />;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Subir Documento a Base de Conocimiento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Selector de Entorno */}
        <div className="space-y-2">
          <Label htmlFor="environment">Entorno de Webhook</Label>
          <Select value={selectedEnvironment} onValueChange={(value: 'test' | 'production') => setSelectedEnvironment(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar entorno" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="test">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">TEST</Badge>
                  <span className="text-sm text-muted-foreground">devn8n.ezequiellamas.com</span>
                </div>
              </SelectItem>
              <SelectItem value="production">
                <div className="flex items-center gap-2">
                  <Badge variant="default">PROD</Badge>
                  <span className="text-sm text-muted-foreground">devwebhookn8n.ezequiellamas.com</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Entorno actual: <code className="bg-muted px-1 py-0.5 rounded text-xs">{currentWebhookUrl}</code>
          </p>
        </div>

        {/* Área de Drop */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={ALLOWED_TYPES.join(',')}
            onChange={handleFileSelect}
          />
          
          {!selectedFile ? (
            <div className="space-y-4">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <p className="text-lg font-medium">Arrastra tu archivo aquí o</p>
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2"
                >
                  Seleccionar archivo
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                PDF, Word, Excel, TXT, CSV, JSON (máx. {formatFileSize(MAX_FILE_SIZE)})
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                {getFileIcon(selectedFile.type)}
                <div className="text-left">
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(selectedFile.size)} • {selectedFile.type}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 justify-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    setUploadProgress(0);
                  }}
                >
                  Cambiar archivo
                </Button>
                <Button 
                  onClick={uploadFile}
                  disabled={uploading}
                  className="gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Subir a {selectedEnvironment === 'test' ? 'TEST' : 'PROD'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Barra de Progreso */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progreso de subida</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

        {/* Información del Entorno */}
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="h-4 w-4" />
            <span className="font-medium">Configuración Actual</span>
          </div>
          <div className="space-y-1 text-sm">
            <p><strong>Entorno:</strong> {selectedEnvironment === 'test' ? 'Test' : 'Producción'}</p>
            <p><strong>Webhook:</strong> {currentWebhookUrl}</p>
            <p><strong>Usuario:</strong> {user?.email || 'No autenticado'}</p>
            <p><strong>Curso:</strong> a-learn-general</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FileUploadToRAG; 