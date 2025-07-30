// Script de diagnóstico para el foro
// Ejecutar en la consola del navegador en la página del foro

console.log('🔍 Iniciando diagnóstico del foro...');

// 1. Verificar configuración de Supabase
console.log('\n📋 1. Configuración de Supabase:');
console.log('URL:', 'https://tspdorasqadfcantgaax.supabase.co');
console.log('Key presente:', !!'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzcGRvcmFzcWFkZmNhbnRnYWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5NDQ5OTksImV4cCI6MjA2NzUyMDk5OX0.WuY4xEi5c2Pf2TCDHKWyz9MBTg9ABSBKnD4VDjvUaH0');

// 2. Verificar autenticación
async function checkAuth() {
  console.log('\n🔐 2. Verificando autenticación:');
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('❌ Error al obtener sesión:', error);
      return false;
    }
    
    if (!session) {
      console.error('❌ No hay sesión activa');
      return false;
    }
    
    console.log('✅ Usuario autenticado:', session.user.email);
    console.log('✅ User ID:', session.user.id);
    return true;
  } catch (error) {
    console.error('❌ Error en verificación de auth:', error);
    return false;
  }
}

// 3. Verificar bucket de storage
async function checkStorage() {
  console.log('\n📦 3. Verificando bucket de storage:');
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
      console.error('❌ Error al listar buckets:', error);
      return false;
    }
    
    const forumBucket = data.find(bucket => bucket.id === 'forum-images');
    if (!forumBucket) {
      console.error('❌ Bucket "forum-images" no encontrado');
      console.log('📋 Buckets disponibles:', data.map(b => b.id));
      return false;
    }
    
    console.log('✅ Bucket "forum-images" encontrado');
    console.log('✅ Bucket público:', forumBucket.public);
    return true;
  } catch (error) {
    console.error('❌ Error en verificación de storage:', error);
    return false;
  }
}

// 4. Verificar políticas de RLS
async function checkRLS() {
  console.log('\n🛡️ 4. Verificando políticas RLS:');
  try {
    // Intentar insertar un post de prueba
    const { data, error } = await supabase
      .from('forum_posts')
      .insert({
        title: 'Test Post - ' + Date.now(),
        content: 'Este es un post de prueba para verificar RLS',
        category: 'general',
        user_id: (await supabase.auth.getSession()).data.session?.user.id
      })
      .select();
    
    if (error) {
      console.error('❌ Error al insertar post de prueba:', error);
      return false;
    }
    
    console.log('✅ Políticas RLS funcionando correctamente');
    
    // Limpiar el post de prueba
    if (data && data[0]) {
      await supabase.from('forum_posts').delete().eq('id', data[0].id);
      console.log('✅ Post de prueba eliminado');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error en verificación de RLS:', error);
    return false;
  }
}

// 5. Verificar estructura de la base de datos
async function checkDatabase() {
  console.log('\n🗄️ 5. Verificando estructura de la base de datos:');
  try {
    const { data, error } = await supabase
      .from('forum_posts')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error al consultar forum_posts:', error);
      return false;
    }
    
    console.log('✅ Tabla forum_posts accesible');
    console.log('✅ Estructura correcta');
    return true;
  } catch (error) {
    console.error('❌ Error en verificación de base de datos:', error);
    return false;
  }
}

// 6. Verificar permisos de storage
async function checkStoragePermissions() {
  console.log('\n📁 6. Verificando permisos de storage:');
  try {
    const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    const { data, error } = await supabase.storage
      .from('forum-images')
      .upload('test/test.txt', testFile);
    
    if (error) {
      console.error('❌ Error al subir archivo de prueba:', error);
      return false;
    }
    
    console.log('✅ Permisos de subida funcionando');
    
    // Limpiar archivo de prueba
    await supabase.storage
      .from('forum-images')
      .remove(['test/test.txt']);
    
    console.log('✅ Archivo de prueba eliminado');
    return true;
  } catch (error) {
    console.error('❌ Error en verificación de permisos de storage:', error);
    return false;
  }
}

// Ejecutar todas las verificaciones
async function runDiagnostics() {
  console.log('🚀 Ejecutando diagnóstico completo...\n');
  
  const results = {
    auth: await checkAuth(),
    storage: await checkStorage(),
    rls: await checkRLS(),
    database: await checkDatabase(),
    storagePermissions: await checkStoragePermissions()
  };
  
  console.log('\n📊 RESUMEN DEL DIAGNÓSTICO:');
  console.log('========================');
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASÓ' : 'FALLÓ'}`);
  });
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 ¡Todo está funcionando correctamente!');
    console.log('💡 Si aún tienes problemas, revisa:');
    console.log('   - La consola del navegador para errores JavaScript');
    console.log('   - La pestaña Network para errores de red');
    console.log('   - Los logs del servidor de Supabase');
  } else {
    console.log('\n⚠️ Se encontraron problemas:');
    if (!results.auth) {
      console.log('   - El usuario no está autenticado correctamente');
    }
    if (!results.storage) {
      console.log('   - El bucket de storage no está configurado');
    }
    if (!results.rls) {
      console.log('   - Las políticas RLS están bloqueando las operaciones');
    }
    if (!results.database) {
      console.log('   - La tabla forum_posts no es accesible');
    }
    if (!results.storagePermissions) {
      console.log('   - No hay permisos para subir archivos al storage');
    }
  }
}

// Ejecutar diagnóstico
runDiagnostics().catch(console.error); 