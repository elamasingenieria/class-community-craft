// Script de prueba rápida para el foro
// Ejecutar después de aplicar las correcciones SQL

console.log('🧪 Iniciando prueba rápida del foro...');

// Función para probar creación de post
async function testCreatePost() {
  console.log('\n📝 Probando creación de post...');
  
  try {
    // Verificar autenticación
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('❌ No hay sesión activa - inicia sesión primero');
      return false;
    }
    
    console.log('✅ Usuario autenticado:', session.user.email);
    
    // Probar con categoría válida
    const testPost = {
      title: 'Test Post - ' + Date.now(),
      content: 'Este es un post de prueba para verificar que funciona correctamente.',
      category: 'general',
      user_id: session.user.id
    };
    
    console.log('📊 Datos del post de prueba:', testPost);
    
    const { data, error } = await supabase
      .from('forum_posts')
      .insert(testPost)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error al crear post:', error);
      return false;
    }
    
    console.log('✅ Post creado exitosamente:', data);
    
    // Limpiar el post de prueba
    await supabase.from('forum_posts').delete().eq('id', data.id);
    console.log('✅ Post de prueba eliminado');
    
    return true;
  } catch (error) {
    console.error('❌ Error en testCreatePost:', error);
    return false;
  }
}

// Función para probar categorías
async function testCategories() {
  console.log('\n🏷️ Probando categorías válidas...');
  
  const validCategories = ['general', 'achievement', 'question', 'programming', 'design', 'announcements'];
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    console.error('❌ No hay sesión activa');
    return false;
  }
  
  for (const category of validCategories) {
    try {
      const testPost = {
        title: `Test ${category} - ${Date.now()}`,
        content: `Post de prueba para categoría ${category}`,
        category: category,
        user_id: session.user.id
      };
      
      const { data, error } = await supabase
        .from('forum_posts')
        .insert(testPost)
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Error con categoría "${category}":`, error);
      } else {
        console.log(`✅ Categoría "${category}" funciona correctamente`);
        // Limpiar
        await supabase.from('forum_posts').delete().eq('id', data.id);
      }
    } catch (error) {
      console.error(`❌ Error probando categoría "${category}":`, error);
    }
  }
  
  return true;
}

// Función para probar storage
async function testStorage() {
  console.log('\n📦 Probando storage...');
  
  try {
    // Verificar bucket
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) {
      console.error('❌ Error al listar buckets:', bucketError);
      return false;
    }
    
    const forumBucket = buckets.find(b => b.id === 'forum-images');
    if (!forumBucket) {
      console.error('❌ Bucket forum-images no encontrado');
      return false;
    }
    
    console.log('✅ Bucket forum-images encontrado');
    
    // Probar subida de archivo
    const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const { data, error } = await supabase.storage
      .from('forum-images')
      .upload('test/test.txt', testFile);
    
    if (error) {
      console.error('❌ Error al subir archivo:', error);
      return false;
    }
    
    console.log('✅ Archivo subido correctamente');
    
    // Limpiar
    await supabase.storage
      .from('forum-images')
      .remove(['test/test.txt']);
    
    console.log('✅ Archivo de prueba eliminado');
    return true;
  } catch (error) {
    console.error('❌ Error en testStorage:', error);
    return false;
  }
}

// Ejecutar todas las pruebas
async function runQuickTest() {
  console.log('🚀 Ejecutando pruebas rápidas...\n');
  
  const results = {
    createPost: await testCreatePost(),
    categories: await testCategories(),
    storage: await testStorage()
  };
  
  console.log('\n📊 RESULTADOS DE LAS PRUEBAS:');
  console.log('============================');
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASÓ' : 'FALLÓ'}`);
  });
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 ¡Todas las pruebas pasaron! El foro está funcionando correctamente.');
    console.log('💡 Ahora puedes crear publicaciones sin problemas.');
  } else {
    console.log('\n⚠️ Algunas pruebas fallaron. Revisa los errores arriba.');
    console.log('💡 Asegúrate de haber ejecutado el script SQL de corrección.');
  }
}

// Ejecutar pruebas
runQuickTest().catch(console.error); 