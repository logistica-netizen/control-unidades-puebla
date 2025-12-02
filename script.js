// Datos iniciales de ejemplo
let unidades = JSON.parse(localStorage.getItem('unidadesControlPuebla')) || [
    {
        id: 1,
        numero: 'PU-001',
        tipo: 'camioneta',
        conductor: 'Juan Pérez',
        ruta: 'Puebla-CDMX',
        status: 'en-ruta',
        notas: 'Entrega programada 14:00',
        fechaActualizacion: '2024-03-15 10:30'
    },
    {
        id: 2,
        numero: 'PU-002',
        tipo: 'torton',
        conductor: 'Carlos Rodríguez',
        ruta: 'Puebla-Querétaro',
        status: 'disponible',
        notas: 'Revisión de frenos reciente',
        fechaActualizacion: '2024-03-15 09:15'
    },
    {
        id: 3,
        numero: 'PU-003',
        tipo: 'trailer',
        conductor: 'Miguel Sánchez',
        ruta: 'Puebla-Guadalajara',
        status: 'mantenimiento',
        notas: 'Cambio de llantas',
        fechaActualizacion: '2024-03-14 16:45'
    },
    {
        id: 4,
        numero: 'PU-004',
        tipo: 'van',
        conductor: 'Roberto López',
        ruta: 'Puebla-Tlaxcala',
        status: 'inactivo',
        notas: 'Motor en reparación',
        fechaActualizacion: '2024-03-13 11:20'
    }
];

// Variables globales
let unidadEditando = null;
let currentFilter = 'todos';
let currentSearch = '';

// Elementos del DOM
const elementos = {
    // Formulario
    numeroUnidad: document.getElementById('numeroUnidad'),
    tipoUnidad: document.getElementById('tipoUnidad'),
    conductor: document.getElementById('conductor'),
    ruta: document.getElementById('ruta'),
    status: document.getElementById('status'),
    notas: document.getElementById('notas'),
    
    // Botones
    btnAgregar: document.getElementById('btnAgregar'),
    btnActualizar: document.getElementById('btnActualizar'),
    btnCancelar: document.getElementById('btnCancelar'),
    btnLimpiar: document.getElementById('btnLimpiar'),
    btnExportar: document.getElementById('btnExportar'),
    btnImportar: document.getElementById('btnImportar'),
    btnReset: document.getElementById('btnReset'),
    btnBackup: document.getElementById('btnBackup'),
    fileImport: document.getElementById('fileImport'),
    
    // Tabla y filtros
    unidadesBody: document.getElementById('unidadesBody'),
    searchInput: document.getElementById('searchInput'),
    filterStatus: document.getElementById('filterStatus'),
    
    // Contadores
    totalUnidades: document.getElementById('totalUnidades'),
    countDisponible: document.getElementById('countDisponible'),
    countRuta: document.getElementById('countRuta'),
    countMantenimiento: document.getElementById('countMantenimiento'),
    countInactivo: document.getElementById('countInactivo'),
    showingCount: document.getElementById('showingCount'),
    totalCount: document.getElementById('totalCount'),
    
    // Fecha y hora
    currentDateTime: document.getElementById('currentDateTime'),
    lastSaved: document.getElementById('lastSaved'),
    
    // Modal
    confirmModal: document.getElementById('confirmModal'),
    modalTitle: document.getElementById('modalTitle'),
    modalMessage: document.getElementById('modalMessage'),
    modalConfirm: document.getElementById('modalConfirm'),
    modalCancel: document.getElementById('modalCancel'),
    
    // Notificación
    notification: document.getElementById('notification')
};

// Inicialización
function init() {
    actualizarFechaHora();
    setInterval(actualizarFechaHora, 60000); // Actualizar cada minuto
    
    cargarUnidades();
    actualizarContadores();
    actualizarUltimoGuardado();
    
    // Event Listeners
    elementos.btnAgregar.addEventListener('click', agregarUnidad);
    elementos.btnActualizar.addEventListener('click', actualizarUnidad);
    elementos.btnCancelar.addEventListener('click', cancelarEdicion);
    elementos.btnLimpiar.addEventListener('click', limpiarFormulario);
    elementos.btnExportar.addEventListener('click', exportarCSV);
    elementos.btnImportar.addEventListener('click', () => elementos.fileImport.click());
    elementos.btnReset.addEventListener('click', confirmarReset);
    elementos.btnBackup.addEventListener('click', hacerBackup);
    elementos.fileImport.addEventListener('change', importarCSV);
    
    elementos.searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value.toLowerCase();
        cargarUnidades();
    });
    
    elementos.filterStatus.addEventListener('change', (e) => {
        currentFilter = e.target.value;
        cargarUnidades();
    });
    
    // Modal
    elementos.modalConfirm.addEventListener('click', confirmarAccion);
    elementos.modalCancel.addEventListener('click', cerrarModal);
    elementos.confirmModal.addEventListener('click', (e) => {
        if (e.target === elementos.confirmModal) {
            cerrarModal();
        }
    });
    
    // Inicializar con datos de ejemplo si no hay datos guardados
    if (unidades.length === 0) {
        unidades = [
            {
                id: 1,
                numero: 'PU-001',
                tipo: 'camioneta',
                conductor: 'Juan Pérez',
                ruta: 'Puebla-CDMX',
                status: 'en-ruta',
                notas: 'Entrega programada 14:00',
                fechaActualizacion: obtenerFechaHoraActual()
            }
        ];
        guardarDatos();
        cargarUnidades();
    }
}

// Funciones principales
function cargarUnidades() {
    elementos.unidadesBody.innerHTML = '';
    
    // Filtrar unidades
    let unidadesFiltradas = unidades.filter(unidad => {
        const coincideBusqueda = 
            unidad.numero.toLowerCase().includes(currentSearch) ||
            unidad.conductor.toLowerCase().includes(currentSearch) ||
            unidad.ruta.toLowerCase().includes(currentSearch) ||
            unidad.notas.toLowerCase().includes(currentSearch);
        
        const coincideFiltro = currentFilter === 'todos' || unidad.status === currentFilter;
        
        return coincideBusqueda && coincideFiltro;
    });
    
    // Ordenar por ID (más recientes primero)
    unidadesFiltradas.sort((a, b) => b.id - a.id);
    
    // Mostrar unidades
    unidadesFiltradas.forEach(unidad => {
        const fila = document.createElement('tr');
        
        // Mapear tipo a texto legible
        const tipoTexto = {
            'camioneta': 'Camioneta',
            'torton': 'Tortón',
            'trailer': 'Trailer',
            'van': 'Van',
            'motocicleta': 'Motocicleta'
        }[unidad.tipo] || unidad.tipo;
        
        // Mapear status a texto y clase
        const statusInfo = {
            'disponible': { texto: 'Disponible', clase: 'status-disponible-badge' },
            'en-ruta': { texto: 'En Ruta', clase: 'status-en-ruta-badge' },
            'mantenimiento': { texto: 'Mantenimiento', clase: 'status-mantenimiento-badge' },
            'inactivo': { texto: 'Inactivo', clase: 'status-inactivo-badge' }
        }[unidad.status] || { texto: 'Desconocido', clase: '' };
        
        fila.innerHTML = `
            <td><strong>${unidad.numero}</strong></td>
            <td>${tipoTexto}</td>
            <td>${unidad.conductor}</td>
            <td>${unidad.ruta}</td>
            <td><span class="status-badge ${statusInfo.clase}">${statusInfo.texto}</span></td>
            <td>${formatearFecha(unidad.fechaActualizacion)}</td>
            <td class="acciones-cell">
                <button class="btn-editar" onclick="editarUnidad(${unidad.id})">✏️ Editar</button>
                <button class="btn-eliminar" onclick="confirmarEliminar(${unidad.id})">🗑️ Eliminar</button>
            </td>
        `;
        
        elementos.unidadesBody.appendChild(fila);
    });
    
    // Actualizar contadores
    elementos.showingCount.textContent = unidadesFiltradas.length;
    elementos.totalCount.textContent = unidades.length;
}

function agregarUnidad() {
    if (!validarFormulario()) return;
    
    const nuevaUnidad = {
        id: unidades.length > 0 ? Math.max(...unidades.map(u => u.id)) + 1 : 1,
        numero: elementos.numeroUnidad.value.trim().toUpperCase(),
        tipo: elementos.tipoUnidad.value,
        conductor: elementos.conductor.value.trim(),
        ruta: elementos.ruta.value.trim(),
        status: elementos.status.value,
        notas: elementos.notas.value.trim(),
        fechaActualizacion: obtenerFechaHoraActual()
    };
    
    unidades.push(nuevaUnidad);
    guardarDatos();
    limpiarFormulario();
    cargarUnidades();
    actualizarContadores();
    mostrarNotificacion('✅ Unidad agregada exitosamente', 'success');
}

function editarUnidad(id) {
    const unidad = unidades.find(u => u.id === id);
    if (!unidad) return;
    
    unidadEditando = id;
    
    // Llenar formulario
    elementos.numeroUnidad.value = unidad.numero;
    elementos.tipoUnidad.value = unidad.tipo;
    elementos.conductor.value = unidad.conductor;
    elementos.ruta.value = unidad.ruta;
    elementos.status.value = unidad.status;
    elementos.notas.value = unidad.notas;
    
    // Cambiar botones
    elementos.btnAgregar.disabled = true;
    elementos.btnActualizar.disabled = false;
    elementos.btnCancelar.disabled = false;
    
    elementos.numeroUnidad.focus();
    
    mostrarNotificacion('✏️ Editando unidad ' + unidad.numero, 'info');
}

function actualizarUnidad() {
    if (!unidadEditando || !validarFormulario()) return;
    
    const index = unidades.findIndex(u => u.id === unidadEditando);
    if (index === -1) return;
    
    unidades[index] = {
        ...unidades[index],
        numero: elementos.numeroUnidad.value.trim().toUpperCase(),
        tipo: elementos.tipoUnidad.value,
        conductor: elementos.conductor.value.trim(),
        ruta: elementos.ruta.value.trim(),
        status: elementos.status.value,
        notas: elementos.notas.value.trim(),
        fechaActualizacion: obtenerFechaHoraActual()
    };
    
    guardarDatos();
    cancelarEdicion();
    cargarUnidades();
    actualizarContadores();
    mostrarNotificacion('✅ Unidad actualizada exitosamente', 'success');
}

function eliminarUnidad(id) {
    unidades = unidades.filter(u => u.id !== id);
    guardarDatos();
    cargarUnidades();
    actualizarContadores();
    mostrarNotificacion('🗑️ Unidad eliminada', 'success');
}

function confirmarEliminar(id) {
    const unidad = unidades.find(u => u.id === id);
    if (!unidad) return;
    
    abrirModal(
        'Confirmar eliminación',
        `¿Estás seguro de eliminar la unidad ${unidad.numero} conducida por ${unidad.conductor}?`,
        () => eliminarUnidad(id)
    );
}

function cancelarEdicion() {
    unidadEditando = null;
    limpiarFormulario();
    elementos.btnAgregar.disabled = false;
    elementos.btnActualizar.disabled = true;
    elementos.btnCancelar.disabled = true;
}

function limpiarFormulario() {
    elementos.numeroUnidad.value = '';
    elementos.tipoUnidad.value = 'camioneta';
    elementos.conductor.value = '';
    elementos.ruta.value = '';
    elementos.status.value = 'disponible';
    elementos.notas.value = '';
    
    if (unidadEditando) {
        elementos.btnAgregar.disabled = false;
        elementos.btnActualizar.disabled = true;
        elementos.btnCancelar.disabled = true;
        unidadEditando = null;
    }
    
    elementos.numeroUnidad.focus();
}

function validarFormulario() {
    if (!elementos.numeroUnidad.value.trim()) {
        mostrarNotificacion('❌ El número de unidad es requerido', 'error');
        elementos.numeroUnidad.focus();
        return false;
    }
    
    if (!elementos.conductor.value.trim()) {
        mostrarNotificacion('❌ El nombre del conductor es requerido', 'error');
        elementos.conductor.focus();
        return false;
    }
    
    if (!elementos.ruta.value.trim()) {
        mostrarNotificacion('❌ La ruta/destino es requerido', 'error');
        elementos.ruta.focus();
        return false;
    }
    
    return true;
}

// Funciones de utilidad
function actualizarContadores() {
    elementos.totalUnidades.textContent = unidades.length;
    
    const contadores = {
        disponible: 0,
        'en-ruta': 0,
        mantenimiento: 0,
        inactivo: 0
    };
    
    unidades.forEach(unidad => {
        if (contadores.hasOwnProperty(unidad.status)) {
            contadores[unidad.status]++;
        }
    });
    
    elementos.countDisponible.textContent = contadores.disponible;
    elementos.countRuta.textContent = contadores['en-ruta'];
    elementos.countMantenimiento.textContent = contadores.mantenimiento;
    elementos.countInactivo.textContent = contadores.inactivo;
}

function guardarDatos() {
    localStorage.setItem('unidadesControlPuebla', JSON.stringify(unidades));
    localStorage.setItem('ultimoGuardado', obtenerFechaHoraActual());
    actualizarUltimoGuardado();
}

function obtenerFechaHoraActual() {
    const ahora = new Date();
    const fecha = ahora.toISOString().split('T')[0];
    const hora = ahora.toTimeString().split(' ')[0].substring(0, 5);
    return `${fecha} ${hora}`;
}

function formatearFecha(fechaHora) {
    const [fecha, hora] = fechaHora.split(' ');
    const [anio, mes, dia] = fecha.split('-');
    return `${dia}/${mes}/${anio} ${hora}`;
}

function actualizarFechaHora() {
    const ahora = new Date();
    const opciones = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    elementos.currentDateTime.textContent = ahora.toLocaleDateString('es-ES', opciones);
}

function actualizarUltimoGuardado() {
    const ultimo = localStorage.getItem('ultimoGuardado');
    elementos.lastSaved.textContent = ultimo ? 
        `Último guardado: ${formatearFecha(ultimo)}` : 
        'Último guardado: --';
}

// Exportar/Importar CSV
function exportarCSV() {
    if (unidades.length === 0) {
        mostrarNotificacion('ℹ️ No hay datos para exportar', 'info');
        return;
    }
    
    const headers = ['ID', 'Unidad', 'Tipo', 'Conductor', 'Ruta', 'Estado', 'Notas', 'Última Actualización'];
    const rows = unidades.map(u => [
        u.id,
        u.numero,
        u.tipo,
        u.conductor,
        u.ruta,
        u.status,
        u.notas,
        u.fechaActualizacion
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `unidades_puebla_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    mostrarNotificacion('📥 CSV exportado exitosamente', 'success');
}

function importarCSV(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const contenido = e.target.result;
            const lineas = contenido.split('\n');
            const headers = lineas[0].split(',').map(h => h.replace(/"/g, '').trim());
            
            const nuevasUnidades = [];
            let maxId = unidades.length > 0 ? Math.max(...unidades.map(u => u.id)) : 0;
            
            for (let i = 1; i < lineas.length; i++) {
                if (!lineas[i].trim()) continue;
                
                const valores = lineas[i].split(',').map(v => v.replace(/^"|"$/g, '').trim());
                if (valores.length !== headers.length) continue;
                
                const unidad = {
                    id: ++maxId,
                    numero: valores[1] || '',
                    tipo: valores[2] || 'camioneta',
                    conductor: valores[3] || '',
                    ruta: valores[4] || '',
                    status: valores[5] || 'disponible',
                    notas: valores[6] || '',
                    fechaActualizacion: valores[7] || obtenerFechaHoraActual()
                };
                
                nuevasUnidades.push(unidad);
            }
            
            unidades = [...unidades, ...nuevasUnidades];
            guardarDatos();
            cargarUnidades();
            actualizarContadores();
            
            mostrarNotificacion(`✅ ${nuevasUnidades.length} unidades importadas`, 'success');
            
        } catch (error) {
            console.error('Error importando CSV:', error);
            mostrarNotificacion('❌ Error al importar el archivo CSV', 'error');
        }
        
        // Limpiar input
        event.target.value = '';
    };
    
    reader.readAsText(file);
}

function hacerBackup() {
    const backup = JSON.stringify(unidades, null, 2);
    const blob = new Blob([backup], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `backup_unidades_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    mostrarNotificacion('💾 Backup creado exitosamente', 'success');
}

function confirmarReset() {
    abrirModal(
        'Confirmar restablecimiento',
        '¿Estás seguro de restablecer todos los datos? Esta acción eliminará todas las unidades registradas y no se puede deshacer.',
        resetDatos
    );
}

function resetDatos() {
    localStorage.removeItem('unidadesControlPuebla');
    localStorage.removeItem('ultimoGuardado');
    unidades = [];
    guardarDatos();
    cargarUnidades();
    actualizarContadores();
    mostrarNotificacion('🔄 Datos restablecidos exitosamente', 'success');
}

// Modal y notificaciones
function abrirModal(titulo, mensaje, confirmCallback) {
    elementos.modalTitle.textContent = titulo;
    elementos.modalMessage.textContent = mensaje;
    elementos.modalConfirm.onclick = () => {
        confirmCallback();
        cerrarModal();
    };
    elementos.confirmModal.classList.add('active');
}

function cerrarModal() {
    elementos.confirmModal.classList.remove('active');
}

function confirmarAccion() {
    // Esta función se asigna dinámicamente en abrirModal
    cerrarModal();
}

function mostrarNotificacion(mensaje, tipo = 'info') {
    elementos.notification.textContent = mensaje;
    elementos.notification.className = `notification ${tipo} show`;
    
    setTimeout(() => {
        elementos.notification.classList.remove('show');
    }, 3000);
}

// Inicializar aplicación
document.addEventListener('DOMContentLoaded', init);
