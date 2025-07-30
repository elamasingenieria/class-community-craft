// Script de prueba para verificar que las publicaciones se cargan en la web
// Ejecutar en la consola del navegador en la página del foro

console.log('🌐 Probando carga de publicaciones en la web...');

// Función para probar la carga de posts
async function testWebPosts() {
  console.log('\n📝 Probando carga de posts...');
  
  try {
    // Verificar que supabase está disponible
    if (typeof supabase === 'undefined') {
      console.error('❌ Supabase no está disponible');
      return false;
    }
    
    console.log('✅ Supabase disponible');
    
    // Probar la consulta exacta que usa el componente
    const { data, error } = await supabase
      .from('forum_posts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error en la consulta:', error);
      return false;
    }
    
    console.log('✅ Consulta exitosa');
    console.log('📊 Posts encontrados:', data?.length || 0);
    
    if (data && data.length > 0) {
      console.log('📋 Primer post:', {
        id: data[0].id,
        title: data[0].title,
        category: data[0].category,
        created_at: data[0].created_at
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error en testWebPosts:', error);
    return false;
  }
}

// Función para verificar el estado del componente
function checkComponentState() {
  console.log('\n🔍 Verificando estado del componente...');
  
  // Buscar elementos del DOM que deberían estar presentes
  const createPostForm = document.querySelector('[data-testid="create-post-form"]') || 
                        document.querySelector('form');
  
  const postsContainer = document.querySelector('.space-y-4') || 
                        document.querySelector('[class*="space-y"]');
  
  const loadingSpinner = document.querySelector('.animate-spin');
  
  console.log('📋 Elementos encontrados:');
  console.log('- Formulario de creación:', !!createPostForm);
  console.log('- Contenedor de posts:', !!postsContainer);
  console.log('- Spinner de carga:', !!loadingSpinner);
  
  // Verificar si hay posts renderizados
  const postCards = document.querySelectorAll('[class*="card"]');
  console.log('- Cards de posts:', postCards.length);
  
  return {
    hasForm: !!createPostForm,
    hasContainer: !!postsContainer,
    isLoading: !!loadingSpinner,
    postCards: postCards.length
  };
}

// Función para simular la carga de datos
async function simulateDataLoad() {
  console.log('\n🔄 Simulando carga de datos...');
  
  try {
    // Simular el mismo patrón que usa el componente
    const [postsResult, commentsResult] = await Promise.all([
      supabase.from('forum_posts').select('*').order('created_at', { ascending: false }),
      supabase.from('forum_comments').select('*').order('created_at', { ascending: true })
    ]);
    
    if (postsResult.error) {
      console.error('❌ Error al cargar posts:', postsResult.error);
      return false;
    }
    
    if (commentsResult.error) {
      console.error('❌ Error al cargar comentarios:', commentsResult.error);
      return false;
    }
    
    console.log('✅ Datos cargados correctamente:');
    console.log('- Posts:', postsResult.data?.length || 0);
    console.log('- Comentarios:', commentsResult.data?.length || 0);
    
    return true;
  } catch (error) {
    console.error('❌ Error en simulateDataLoad:', error);
    return false;
  }
}

// Función para verificar autenticación
async function checkAuth() {
  console.log('\n🔐 Verificando autenticación...');
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Error al obtener sesión:', error);
      return false;
    }
    
    if (!session) {
      console.log('⚠️ No hay sesión activa (esto puede ser normal)');
      return true; // No es un error, puede ser normal
    }
    
    console.log('✅ Usuario autenticado:', session.user.email);
    return true;
  } catch (error) {
    console.error('❌ Error en checkAuth:', error);
    return false;
  }
}

// Ejecutar todas las pruebas
async function runWebTests() {
  console.log('🚀 Ejecutando pruebas de la web...\n');
  
  const results = {
    auth: await checkAuth(),
    webPosts: await testWebPosts(),
    dataLoad: await simulateDataLoad(),
    componentState: checkComponentState()
  };
  
  console.log('\n📊 RESULTADOS DE LAS PRUEBAS WEB:');
  console.log('================================');
  
  console.log(`🔐 Autenticación: ${results.auth ? '✅ OK' : '❌ Error'}`);
  console.log(`📝 Posts web: ${results.webPosts ? '✅ OK' : '❌ Error'}`);
  console.log(`🔄 Carga de datos: ${results.dataLoad ? '✅ OK' : '❌ Error'}`);
  console.log(`🎨 Estado del componente:`, results.componentState);
  
  // Análisis de resultados
  if (results.webPosts && results.dataLoad) {
    console.log('\n🎉 ¡Los datos se cargan correctamente!');
    console.log('💡 Si no ves las publicaciones, puede ser un problema de renderizado.');
    console.log('🔍 Revisa la consola para ver si hay errores de JavaScript.');
  } else {
    console.log('\n⚠️ Hay problemas con la carga de datos.');
    console.log('💡 Verifica las políticas RLS y la conexión a Supabase.');
  }
  
  if (results.componentState.postCards === 0 && results.webPosts) {
    console.log('\n🔍 DIAGNÓSTICO: Los datos se cargan pero no se renderizan.');
    console.log('💡 Posibles causas:');
    console.log('   - Error en el componente React');
    console.log('   - Problema con el filtrado de posts');
    console.log('   - Error en el renderizado de PostCard');
  }
}

// Ejecutar pruebas
runWebTests().catch(console.error); 