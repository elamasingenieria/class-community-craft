# 🔧 Configuración del Webhook en n8n para Archivos PDF

## 📋 Descripción

Este documento explica cómo configurar el webhook en n8n para recibir archivos PDF como datos binarios desde el componente FileUploadToRAG.

## 🚀 Configuración del Webhook

### **1. Crear el Webhook Trigger**

1. **Crear nuevo workflow** en n8n
2. **Agregar Webhook Trigger**
3. **Configurar el webhook:**

#### **Para Entorno de Test:**
```json
{
  "name": "Upload Document to RAG (Test)",
  "httpMethod": "POST",
  "path": "upload-document",
  "responseMode": "responseNode",
  "options": {
    "rawBody": true,
    "responseHeaders": {
      "Content-Type": "application/json"
    }
  }
}
```

#### **Para Entorno de Producción:**
```json
{
  "name": "Upload Document to RAG (Production)",
  "httpMethod": "POST",
  "path": "upload-document",
  "responseMode": "responseNode",
  "options": {
    "rawBody": true,
    "responseHeaders": {
      "Content-Type": "application/json"
    }
  }
}
```

### **2. URLs de Webhook**

#### **Entorno de Test:**
```
https://devn8n.ezequiellamas.com/webhook-test/upload-document
```

#### **Entorno de Producción:**
```
https://devwebhookn8n.ezequiellamas.com/webhook/upload-document
```

### **3. Configurar el Webhook para FormData**

El webhook debe estar configurado para recibir `multipart/form-data`:

```json
{
  "webhook": {
    "httpMethod": "POST",
    "path": "upload-document",
    "responseMode": "responseNode",
    "options": {
      "rawBody": true,
      "responseHeaders": {
        "Content-Type": "application/json"
      }
    }
  }
}
```

## 📊 Estructura de Datos Recibidos

### **FormData Fields**
El webhook recibirá los siguientes campos:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `file` | File (Binary) | Archivo PDF binario |
| `fileName` | String | Nombre del archivo |
| `fileType` | String | Tipo MIME (application/pdf) |
| `userId` | String | ID del usuario |
| `userEmail` | String | Email del usuario |
| `courseId` | String | ID del curso |
| `timestamp` | String | Timestamp ISO |

### **Ejemplo de Datos Recibidos**
```
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="file"; filename="documento.pdf"
Content-Type: application/pdf

[datos binarios del PDF]

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="fileName"

documento.pdf
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="fileType"

application/pdf
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="userId"

123e4567-e89b-12d3-a456-426614174000
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="userEmail"

usuario@example.com
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="courseId"

a-learn-general
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="timestamp"

2024-01-01T00:00:00.000Z
------WebKitFormBoundary7MA4YWxkTrZu0gW--
```

## 🔧 Procesamiento en n8n

### **1. Extraer el Archivo Binario**

```javascript
// En un nodo Function
const file = $input.all()[0].json.file;
const fileName = $input.all()[0].json.fileName;
const fileType = $input.all()[0].json.fileType;
const userId = $input.all()[0].json.userId;
const userEmail = $input.all()[0].json.userEmail;
const courseId = $input.all()[0].json.courseId;
const timestamp = $input.all()[0].json.timestamp;

return {
  file,
  fileName,
  fileType,
  userId,
  userEmail,
  courseId,
  timestamp
};
```

### **2. Guardar el Archivo Temporalmente**

```javascript
// Usar nodo "Write Binary File" o similar
const fs = require('fs');
const path = require('path');

const tempDir = '/tmp/uploads/';
const tempFileName = `${Date.now()}_${fileName}`;
const tempFilePath = path.join(tempDir, tempFileName);

// Crear directorio si no existe
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Guardar archivo
fs.writeFileSync(tempFilePath, file);

return {
  tempFilePath,
  fileName,
  fileType,
  userId,
  userEmail,
  courseId,
  timestamp
};
```

### **3. Procesar el PDF**

```javascript
// Usar librería como pdf-parse o similar
const pdfParse = require('pdf-parse');
const fs = require('fs');

const pdfBuffer = fs.readFileSync(tempFilePath);
const pdfData = await pdfParse(pdfBuffer);

const text = pdfData.text;
const pageCount = pdfData.numpages;

return {
  text,
  pageCount,
  fileName,
  userId,
  userEmail,
  courseId,
  timestamp
};
```

### **4. Dividir en Chunks**

```javascript
// Dividir texto en fragmentos de ~1000 caracteres
const chunkSize = 1000;
const chunks = [];

for (let i = 0; i < text.length; i += chunkSize) {
  chunks.push(text.slice(i, i + chunkSize));
}

return {
  chunks,
  fileName,
  userId,
  userEmail,
  courseId,
  timestamp
};
```

### **5. Generar Embeddings**

```javascript
// Usar OpenAI o similar para generar embeddings
const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const embeddings = [];

for (const chunk of chunks) {
  const embedding = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: chunk
  });
  
  embeddings.push({
    text: chunk,
    embedding: embedding.data[0].embedding
  });
}

return {
  embeddings,
  fileName,
  userId,
  userEmail,
  courseId,
  timestamp
};
```

### **6. Almacenar en Base de Datos**

```javascript
// Almacenar en base de datos vectorial (Pinecone, Weaviate, etc.)
const { Pinecone } = require('@pinecone-database/pinecone');
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pinecone.index('a-learn-rag');

const vectors = embeddings.map((item, i) => ({
  id: `${fileName}_chunk_${i}`,
  values: item.embedding,
  metadata: {
    text: item.text,
    fileName,
    userId,
    userEmail,
    courseId,
    timestamp,
    chunkIndex: i
  }
}));

await index.upsert(vectors);

return {
  success: true,
  chunksProcessed: embeddings.length,
  fileName,
  userId
};
```

### **7. Respuesta al Cliente**

```javascript
// Nodo de respuesta
return {
  success: true,
  message: "Document uploaded successfully",
  details: {
    chunksProcessed: embeddings.length,
    fileName,
    timestamp,
    pageCount
  }
};
```

## 🔍 Troubleshooting

### **Error: "No file received"**
- Verifica que el webhook esté configurado para `multipart/form-data`
- Asegúrate de que el campo se llame `file`

### **Error: "File too large"**
- Configura límites de tamaño en n8n
- Considera comprimir archivos grandes

### **Error: "Invalid file type"**
- Verifica que solo se envíen archivos PDF
- Revisa la validación en el frontend

### **Error: "Processing failed"**
- Verifica las dependencias (pdf-parse, etc.)
- Revisa los logs del workflow

## 📊 Monitoreo

### **Logs del Workflow**
```javascript
// Agregar logging en cada paso
console.log('📁 Archivo recibido:', fileName, fileType);
console.log('📄 Páginas procesadas:', pageCount);
console.log('🔢 Chunks generados:', chunks.length);
console.log('💾 Embeddings almacenados:', embeddings.length);
```

### **Métricas Sugeridas**
- Tiempo de procesamiento por archivo
- Tamaño promedio de archivos
- Número de chunks por archivo
- Tasa de éxito de procesamiento

## 🎯 Configuración Completa

### **Variables de Entorno**
```bash
OPENAI_API_KEY=your_openai_key
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX_NAME=a-learn-rag
```

### **Dependencias n8n**
```json
{
  "dependencies": {
    "pdf-parse": "^1.1.1",
    "@pinecone-database/pinecone": "^1.1.2",
    "openai": "^4.20.1"
  }
}
```

### **Configuración de Entornos**

#### **Entorno de Test**
- **URL**: `https://devn8n.ezequiellamas.com/webhook-test/upload-document`
- **Propósito**: Desarrollo y pruebas
- **Base de datos**: Separada de producción

#### **Entorno de Producción**
- **URL**: `https://devwebhookn8n.ezequiellamas.com/webhook/upload-document`
- **Propósito**: Uso en vivo
- **Base de datos**: Producción

---

**¡El webhook está listo para recibir archivos PDF binarios!** 🚀 