// =============================================
// CONFIGURACIÓN FIREBASE - SINCRONIZACIÓN TIEMPO REAL
// =============================================

// 🔥 CREDENCIALES FIREBASE - PROYECTO FRATSA
const firebaseConfig = {
    apiKey: "AIzaSyAhsWjpl-hF18w7UzL42YHE7zQ9tnlDQCs",
    authDomain: "fratsa-control-unidades.firebaseapp.com",
    databaseURL: "https://fratsa-control-unidades-default-rtdb.firebaseio.com",
    projectId: "fratsa-control-unidades",
    storageBucket: "fratsa-control-unidades.appspot.com",
    messagingSenderId: "963027992911",
    appId: "1:963027992911:web:7e3cd6a2af9fa68d56093b"
};

// Variables globales
let database = null;
let usarFirebase = false;
let sincronizando = false;

// =============================================
// INICIALIZACIÓN FIREBASE
// =============================================

// Intentar inicializar Firebase
function inicializarFirebase() {
    try {
        if (typeof firebase === 'undefined') {
            console.warn('⚠️ Firebase SDK no está cargado');
            return false;
        }
        
        // Verificar si ya está inicializado
        if (firebase.apps.length > 0) {
            database = firebase.database();
        } else {
            firebase.initializeApp(firebaseConfig);
            database = firebase.database();
        }
        
        usarFirebase = true;
        console.log('✅ Firebase inicializado correctamente');
        
        // Configurar listeners de conexión
        configurarListenersConexion();
        
        // Sincronizar datos existentes
        sincronizarDatosExistentes();
        
        return true;
    } catch (error) {
        console.error('❌ Error inicializando Firebase:', error);
        usarFirebase = false;
        return false;
    }
}

// Configurar listeners para estado de conexión
function configurarListenersConexion() {
    if (!usarFirebase || !database) return;
    
    const conexionRef = database.ref('.info/connected');
    conexionRef.on('value', (snap) => {
        const estado = document.getElementById('version-indicator');
        if (snap.val() === true) {
            estado.textContent = 'En Tiempo Real';
            estado.className = 'badge bg-success';
            estado.title = 'Conectado a Firebase - Sincronización activa';
        } else {
            estado.textContent = 'Sin Conexión';
            estado.className = 'badge bg-danger';
            estado.title = 'Sin conexión a Firebase - Modo local';
        }
    });
}

// =============================================
// FUNCIONES PRINCIPALES FIREBASE
// =============================================

// Guardar unidad en Firebase
async function guardarUnidadFirebase(unidad) {
    if (!usarFirebase || !database || sincronizando) return false;
    
    try {
        sincronizando = true;
        const unidadRef = database.ref('unidades/' + unidad.id);
        await unidadRef.set(unidad);
        console.log('✅ Unidad guardada en Firebase:', unidad.id);
        return true;
    } catch (error) {
        console.error('❌ Error guardando en Firebase:', error);
        return false;
    } finally {
        sincronizando = false;
    }
}

// Cargar todas las unidades desde Firebase
async function cargarUnidadesDesdeFirebase() {
    if (!usarFirebase || !database) {
        console.log('📱 Modo local - Cargando desde localStorage');
        return JSON.parse(localStorage.getItem('unidadesPuebla')) || [];
    }
    
    try {
        const snapshot = await database.ref('unidades').once('value');
        const unidadesFirebase = [];
        
        snapshot.forEach((childSnapshot) => {
            const unidad = childSnapshot.val();
            // Asegurar que todas las unidades tengan la propiedad 'despachada'
            if (unidad.despachada === undefined) {
                unidad.despachada = false;
            }
            unidadesFirebase.push(unidad);
        });
        
        console.log('📦 Cargadas desde Firebase:', unidadesFirebase.length, 'unidades');
        
        // Ordenar por ID (más antiguas primero)
        unidadesFirebase.sort((a, b) => a.id - b.id);
        
        return unidadesFirebase;
    } catch (error) {
        console.error('❌ Error cargando desde Firebase:', error);
        return JSON.parse(localStorage.getItem('unidadesPuebla')) || [];
    }
}

// Escuchar cambios en tiempo real
function iniciarEscuchaTiempoReal() {
    if (!usarFirebase || !database) {
        console.log('📱 Modo local - Sin sincronización en tiempo real');
        return;
    }
    
    console.log('👂 Iniciando escucha de cambios en tiempo real...');
    
    database.ref('unidades').on('value', (snapshot) => {
        console.log('🔄 Cambio detectado en Firebase');
        
        const nuevasUnidades = [];
        snapshot.forEach((childSnapshot) => {
            nuevasUnidades.push(childSnapshot.val());
        });
        
        // Ordenar por ID
        nuevasUnidades.sort((a, b) => a.id - b.id);
        
        // Actualizar array global
        if (typeof unidades !== 'undefined') {
            unidades = nuevasUnidades;
            
            // Actualizar localStorage como backup
            localStorage.setItem('unidadesPuebla', JSON.stringify(unidades));
            
            // Recalcular siguiente ID
            if (typeof siguienteIdUnidad !== 'undefined') {
                siguienteIdUnidad = unidades.length > 0 ? Math.max(...unidades.map(u => u.id)) + 1 : 1;
            }
            
            // Actualizar todas las vistas si las funciones existen
            if (typeof cargarUnidades === 'function') cargarUnidades();
            if (typeof cargarDespacho === 'function') cargarDespacho();
            if (typeof actualizarEstadisticas === 'function') actualizarEstadisticas();
            
            // Mostrar notificación sutil
            if (typeof mostrarNotificacion === 'function') {
                mostrarNotificacion('🔄 Datos actualizados', 'info', 2000);
            }
        }
    });
    
    console.log('👂 Escuchando cambios en tiempo real...');
}

// Sincronizar datos locales existentes con Firebase
async function sincronizarDatosExistentes() {
    if (!usarFirebase || !database || sincronizando) return;
    
    try {
        sincronizando = true;
        const unidadesLocales = JSON.parse(localStorage.getItem('unidadesPuebla')) || [];
        
        if (unidadesLocales.length === 0) {
            console.log('📱 No hay datos locales para sincronizar');
            return;
        }
        
        console.log('🔄 Sincronizando', unidadesLocales.length, 'unidades locales con Firebase...');
        
        // Subir cada unidad local a Firebase
        for (const unidad of unidadesLocales) {
            await database.ref('unidades/' + unidad.id).set(unidad);
        }
        
        console.log('✅ Datos locales sincronizados correctamente');
        
    } catch (error) {
        console.error('❌ Error sincronizando datos:', error);
    } finally {
        sincronizando = false;
    }
}

// Actualizar unidad en Firebase
async function actualizarUnidadFirebase(id, nuevosDatos) {
    if (!usarFirebase || !database || sincronizando) return false;
    
    try {
        sincronizando = true;
        await database.ref('unidades/' + id).update(nuevosDatos);
        console.log('✏️ Unidad actualizada en Firebase:', id);
        return true;
    } catch (error) {
        console.error('❌ Error actualizando en Firebase:', error);
        return false;
    } finally {
        sincronizando = false;
    }
}

// Eliminar unidad de Firebase
async function eliminarUnidadFirebase(id) {
    if (!usarFirebase || !database || sincronizando) return false;
    
    try {
        sincronizando = true;
        await database.ref('unidades/' + id).remove();
        console.log('🗑️ Unidad eliminada de Firebase:', id);
        return true;
    } catch (error) {
        console.error('❌ Error eliminando de Firebase:', error);
        return false;
    } finally {
        sincronizando = false;
    }
}

// =============================================
// FUNCIONES DE UTILIDAD
// =============================================

// Verificar estado de Firebase
function verificarEstadoFirebase() {
    if (!usarFirebase) {
        console.log('📱 Firebase no disponible - Modo local');
        return 'local';
    }
    
    try {
        // Verificar si hay conexión
        const estadoConexion = navigator.onLine;
        return estadoConexion ? 'conectado' : 'sin-conexion';
    } catch (error) {
        return 'error';
    }
}

// Obtener estadísticas de Firebase
async function obtenerEstadisticasFirebase() {
    if (!usarFirebase || !database) return null;
    
    try {
        const snapshot = await database.ref('unidades').once('value');
        const total = snapshot.numChildren();
        const activas = [];
        
        snapshot.forEach((childSnapshot) => {
            const unidad = childSnapshot.val();
            if (!unidad.despachada) {
                activas.push(unidad);
            }
        });
        
        return {
            total: total,
            activas: activas.length,
            despachadas: total - activas.length
        };
    } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
        return null;
    }
}

// =============================================
// INICIALIZACIÓN AL CARGAR LA PÁGINA
// =============================================

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando Firebase...');
    
    // Esperar un momento para que cargue Firebase SDK
    setTimeout(() => {
        const inicializado = inicializarFirebase();
        
        if (inicializado) {
            // Iniciar escucha en tiempo real
            iniciarEscuchaTiempoReal();
            
            // Cargar datos iniciales desde Firebase
            setTimeout(async () => {
                const unidadesFirebase = await cargarUnidadesDesdeFirebase();
                if (unidadesFirebase.length > 0 && typeof unidades !== 'undefined') {
                    unidades = unidadesFirebase;
                    localStorage.setItem('unidadesPuebla', JSON.stringify(unidades));
                    
                    // Recalcular siguiente ID
                    if (typeof siguienteIdUnidad !== 'undefined') {
                        siguienteIdUnidad = unidades.length > 0 ? Math.max(...unidades.map(u => u.id)) + 1 : 1;
                    }
                    
                    console.log('📊 Datos iniciales cargados desde Firebase');
                }
            }, 1000);
        } else {
            console.log('📱 Usando modo local (sin Firebase)');
        }
    }, 500);
});

// =============================================
// EXPORTAR FUNCIONES PARA USO GLOBAL
// =============================================

// Hacer funciones disponibles globalmente
window.guardarUnidadFirebase = guardarUnidadFirebase;
window.actualizarUnidadFirebase = actualizarUnidadFirebase;
window.eliminarUnidadFirebase = eliminarUnidadFirebase;
window.cargarUnidadesDesdeFirebase = cargarUnidadesDesdeFirebase;
window.verificarEstadoFirebase = verificarEstadoFirebase;
window.usarFirebase = usarFirebase;
window.database = database;
