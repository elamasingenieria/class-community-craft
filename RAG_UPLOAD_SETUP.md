# 📚 Configuración de Subida de Archivos al RAG

## 🎯 Descripción

Se ha integrado un componente de subida de archivos en la sección de Administración que permite cargar documentos directamente a la base de conocimiento del Tutor Virtual usando el workflow de n8n.

## 🚀 Características

### ✅ **Funcionalidades Implementadas**
- **Drag & Drop** o clic para seleccionar archivos
- **Múltiples formatos** soportados: PDF, DOCX, TXT, CSV, JSON, Excel
- **Validación de archivos** (tamaño máximo 10MB, tipos permitidos)
- **Barra de progreso** en tiempo real
- **Notificaciones** de éxito/error
- **Integración con n8n** via webhook
- **Logging detallado** para debugging

### 📁 **Formatos Soportados**
- **PDF** - Documentos PDF
- **DOCX** - Documentos de Word
- **TXT** - Archivos de texto plano
- **CSV** - Archivos de datos tabulares
- **JSON** - Archivos de configuración/datos
- **Excel** - Hojas de cálculo (.xlsx, .xls)

## 🔧 Configuración

### **Webhook URL**
El componente está configurado para usar:
```
https://devwebhookn8n.ezequiellamas.com/webhook/upload-document
```

### **Datos Enviados al Webhook**
El componente envía un `FormData` con datos binarios:

```
Content-Type: multipart/form-data

- file: [archivo binario PDF]
- fileName: "documento.pdf"
- fileType: "application/pdf"
- userId: "user_uuid"
- userEmail: "user@example.com"
- courseId: "a-learn-general"
- timestamp: "2024-01-01T00:00:00.000Z"
```

## 📋 Cómo Usar

### **1. Acceder al Componente**
1. Ve a la página de **Administración**
2. Haz clic en el tab **"Base de Conocimiento"**
3. Verás la interfaz de subida de archivos

### **2. Subir un Archivo**
1. **Arrastra y suelta** un archivo en la zona designada
2. O **haz clic** para seleccionar un archivo
3. **Verifica** que el archivo sea válido (tamaño y tipo)
4. **Haz clic** en "Subir a la Base de Conocimiento"
5. **Espera** a que se complete el proceso

### **3. Verificar el Proceso**
- La barra de progreso muestra el avance
- Las notificaciones indican éxito o error
- Los logs en la consola muestran detalles del proceso

## 🔍 Troubleshooting

### **Error: "Archivo excede el límite de 10MB"**
- Comprime el archivo o divídelo en partes más pequeñas
- Considera usar un formato más eficiente

### **Error: "Tipo de archivo no válido"**
- Verifica que el archivo sea uno de los formatos soportados
- Asegúrate de que la extensión coincida con el contenido

### **Error: "Error en la subida"**
- Verifica la conexión a internet
- Revisa que el webhook de n8n esté funcionando
- Consulta los logs en la consola del navegador

### **El archivo se sube pero no aparece en el RAG**
- Verifica que el workflow de n8n esté procesando correctamente
- Revisa los logs del workflow en n8n
- Asegúrate de que la base de datos del RAG esté configurada

## 🛠️ Personalización

### **Cambiar la URL del Webhook**
```tsx
<FileUploadToRAG webhookUrl="https://tu-webhook-personalizado.com/webhook" />
```

### **Modificar Formatos Soportados**
Edita el array `ALLOWED_TYPES` en el componente:
```tsx
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // Agregar más tipos aquí
];
```

### **Cambiar el Límite de Tamaño**
Modifica la constante `MAX_FILE_SIZE`:
```tsx
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
```

## 📊 Monitoreo

### **Logs del Cliente**
El componente genera logs detallados en la consola del navegador:
- 🚀 Iniciando subida de archivo al RAG...
- 📁 Archivo: nombre.pdf 1024000 application/pdf
- 📤 Enviando archivo binario al webhook...
- 📥 Respuesta del webhook: { success: true, ... }

### **Respuesta del Webhook**
El webhook debe responder con:
```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "details": {
    "chunksProcessed": 15,
    "fileName": "documento.pdf",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## 🔗 Integración con n8n

### **Workflow Esperado**
1. **Webhook Trigger** - Recibe el FormData con el archivo binario
2. **File Processing** - Procesa el archivo PDF directamente
3. **Text Extraction** - Extrae el texto del documento PDF
4. **Chunking** - Divide el texto en fragmentos
5. **Vector Embedding** - Genera embeddings para cada fragmento
6. **Database Storage** - Almacena en la base de datos del RAG
7. **Response** - Devuelve confirmación al cliente

### **Configuración del Webhook**
- **Método**: POST
- **Content-Type**: multipart/form-data (automático)
- **Autenticación**: Según tu configuración de n8n
- **Rate Limiting**: Considera implementar límites de velocidad
- **File Handling**: El archivo PDF se envía como datos binarios

### **URLs de Webhook Disponibles**
- **Test**: `https://devn8n.ezequiellamas.com/webhook-test/upload-document`
- **Producción**: `https://devwebhookn8n.ezequiellamas.com/webhook/upload-document`

## 🎯 Próximos Pasos

### **Configuración de Entornos**
El componente incluye un selector de entorno que permite elegir entre:

- **TEST**: Para desarrollo y pruebas
  - URL: `https://devn8n.ezequiellamas.com/webhook-test/upload-document`
  - Uso: Probar cambios antes de implementarlos en producción

- **PRODUCCIÓN**: Para uso en vivo
  - URL: `https://devwebhookn8n.ezequiellamas.com/webhook/upload-document`
  - Uso: Entorno de producción para usuarios finales

### **Mejoras Sugeridas**
- [ ] **Historial de subidas** - Mostrar archivos subidos anteriormente
- [ ] **Procesamiento en lote** - Subir múltiples archivos a la vez
- [ ] **Categorización** - Permitir asignar categorías a los documentos
- [ ] **Búsqueda** - Buscar en documentos subidos
- [ ] **Eliminación** - Permitir eliminar documentos del RAG

### **Integración con el Tutor Virtual**
- [ ] **Contexto automático** - Usar documentos subidos en las respuestas
- [ ] **Referencias** - Mostrar fuentes de información
- [ ] **Actualización en tiempo real** - Sincronizar con el chat

## 📞 Soporte

Si encuentras problemas:
1. **Revisa los logs** en la consola del navegador
2. **Verifica el workflow** de n8n
3. **Comprueba la conectividad** del webhook
4. **Revisa la documentación** del workflow de n8n

---

**¡El componente está listo para usar!** 🚀 