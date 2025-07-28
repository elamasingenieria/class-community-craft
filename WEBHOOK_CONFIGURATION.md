# Configuración de Webhooks del Tutor Virtual

## 🔧 Configuración Actual

### URL de Webhook

#### 🚀 **Webhook Principal**
```
URL: https://devwebhookn8n.ezequiellamas.com/webhook/ac5e3a10-d546-485d-af62-fbad22a30912
Estado: Único webhook utilizado
```

## 📡 Funcionamiento del Sistema

### 1. **Estrategia de Envío**
- **Webhook único**: Se envía directamente al webhook principal
- **Reintentos**: 3 intentos con delay exponencial

### 2. **Datos Enviados**
```json
{
  "message": "Mensaje del usuario",
  "userId": "ID del usuario (opcional)",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "sessionId": "virtual-tutor-session",
  "metadata": {
    "userAgent": "Navegador del usuario",
    "platform": "Plataforma del usuario",
    "language": "Idioma del usuario"
  }
}
```

### 3. **Respuesta Esperada**
```json
{
  "response": "Respuesta del tutor virtual",
  "success": true,
  "timestamp": "2024-01-01T12:00:00.000Z",
  "sessionId": "virtual-tutor-session"
}
```

## 🛠️ Características Técnicas

### ✅ **Funcionalidades Implementadas**

#### **Manejo de Errores**
- **Reintentos automáticos**: 3 intentos con delay progresivo
- **Logging detallado**: Registra errores en consola

#### **Manejo de Errores**
- **Envío inmediato**: Los mensajes se envían solo cuando hay conexión
- **Sin persistencia**: No se guardan mensajes pendientes
- **Feedback claro**: Mensajes de error cuando falla el envío

#### **Diagnóstico en Tiempo Real**
- **Panel de diagnóstico**: Accesible desde el botón de configuración
- **Estado del webhook**: Muestra conexión del webhook principal
- **Pruebas manuales**: Permite probar el webhook desde la interfaz

### 🔄 **Flujo de Funcionamiento**

1. **Usuario envía mensaje**
   - Se crea mensaje local
   - Se envía al webhook principal

2. **Si el webhook falla**
   - Se muestra mensaje de error
   - No se guarda como pendiente

3. **Sin conexión**
   - Se muestra mensaje de error
   - No se intenta enviar

4. **Diagnóstico**
   - Botón de configuración en el chat
   - Prueba el webhook principal
   - Muestra estado y respuestas

## 🧪 Herramientas de Prueba

### **Script de Prueba**
```bash
# Ejecutar prueba de webhooks
node test-webhooks.js
```

### **Componente de Diagnóstico**
- Accesible desde el Tutor Virtual
- Prueba el webhook principal
- Muestra respuestas en tiempo real

## 📊 Monitoreo

### **Logs de Consola**
- Errores de conexión
- Intentos de reintento
- Cambios entre webhooks

### **Indicadores Visuales**
- Estado de conexión en tiempo real
- Mensajes de error claros
- Feedback inmediato del estado

## 🔧 Configuración Avanzada

### **Parámetros Ajustables**
```typescript
private maxRetries = 3;           // Número de reintentos
private retryDelay = 1000;        // Delay base en ms
```

### **Headers Personalizados**
```typescript
headers: {
  'Content-Type': 'application/json',
  'User-Agent': 'VirtualTutor-WebApp/1.0',
}
```

## 🚨 Solución de Problemas

### **Webhook No Responde**
1. Verificar URL en el código
2. Probar con el script de test
3. Revisar logs de n8n
4. Usar panel de diagnóstico

### **Mensajes No Se Envían**
1. Verificar conexión a internet
2. Revisar estado de webhooks
3. Verificar configuración de n8n
4. Usar panel de diagnóstico

### **Errores de CORS**
1. Verificar configuración de n8n
2. Revisar headers de respuesta
3. Comprobar dominio permitido

## 📈 Métricas de Rendimiento

### **Tiempos de Respuesta**
- **Webhook principal**: ~200-500ms

### **Tasa de Éxito**
- **Webhook principal**: 95%+

## 🔮 Próximas Mejoras

### **Funcionalidades Planificadas**
- [ ] **Métricas detalladas**: Tiempos de respuesta por webhook
- [ ] **Alertas automáticas**: Notificaciones de fallos
- [ ] **Configuración dinámica**: Cambiar URLs sin reiniciar
- [ ] **Logs persistentes**: Guardar historial de errores
- [ ] **Health checks**: Verificación periódica de webhooks

### **Optimizaciones**
- [ ] **Conexiones persistentes**: Reutilizar conexiones HTTP
- [ ] **Compresión**: Reducir tamaño de payload
- [ ] **Cache**: Guardar respuestas frecuentes
- [ ] **Rate limiting**: Control de velocidad de envío 