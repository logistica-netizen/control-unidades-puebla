// =============================================
// CONTROL DE UNIDADES - PATIO PUEBLA
// FRATSA S.A. DE C.V.
// Versión: 2.1.0 (con Firebase)
// =============================================

// Variables globales
let unidades = [];
let siguienteIdUnidad = 1;
let modoDesarrollo = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// =============================================
// INICIALIZACIÓN
// =============================================

// Función principal de inicialización
async function inicializarSistema() {
    console.log('🚀 Sistema de Control de Unidades - Iniciando v2.1.0...');
    
    // 1. Cargar datos iniciales
    await cargarDatosIniciales();
    
    // 2. Configurar fecha y hora
    actualizarFechaHora();
    setInterval(actualizarFechaHora, 1000);
    
    // 3. Configurar fecha/hora por defecto
    const { fecha: fechaHoy, hora: horaActual } = obtenerFechaHoraActual();
    document.getElementById('unidad-fecha').value = fechaHoy;
    document.getElementById('unidad-hora').value = horaActual;
    
    // 4. Configurar eventos
    configurarEventos();
    
    // 5. Inicializar componentes
    inicializarCalendario();
    cargarUnidades();
    cargarDespacho();
    actualizarEstadisticas();
    controlarVisibilidadExportacion();
    
    // 6. Configurar URL para compartir
    document.getElementById('url-compartir').value = window.location.href;
    
    // 7. Verificar si es la primera vez
    if (!localStorage.getItem('primerUso')) {
        setTimeout(() => {
            mostrarInstrucciones();
            localStorage.setItem('primerUso', 'true');
        }, 1000);
    }
    
    console.log('✅ Sistema inicializado correctamente');
}

// Cargar datos iniciales (localStorage o Firebase)
async function cargarDatosIniciales() {
    console.log('📦 Cargando datos iniciales...');
    
    // Intentar cargar desde Firebase primero
    if (typeof cargarUnidadesDesdeFirebase === 'function' && usarFirebase) {
        try {
            const unidadesFirebase = await cargarUnidadesDesdeFirebase();
            if (unidadesFirebase.length > 0) {
                unidades = unidadesFirebase;
                siguienteIdUnidad = unidades.length > 0 ? Math.max(...unidades.map(u => u.id)) + 1 : 1;
                localStorage.setItem('unidadesPuebla', JSON.stringify(unidades));
                console.log('✅ Datos cargados desde Firebase:', unidades.length, 'unidades');
                return;
            }
        } catch (error) {
            console.warn('⚠️ Error cargando desde Firebase, usando localStorage:', error);
        }
    }
    
    // Si no hay Firebase o falló, usar localStorage
    unidades = JSON.parse(localStorage.getItem('unidadesPuebla')) || [];
    siguienteIdUnidad = unidades.length > 0 ? Math.max(...unidades.map(u => u.id)) + 1 : 1;
    console.log('📱 Datos cargados desde localStorage:', unidades.length, 'unidades');
}

// Configurar eventos
function configurarEventos() {
    document.getElementById('nueva-unidad-form').addEventListener('submit', function(e) {
        e.preventDefault();
        guardarNuevaUnidad();
    });
    
    document.getElementById('guardar-cambios-estatus').addEventListener('click', guardarCambiosEstatus);
    
    document.querySelectorAll('#myTab button').forEach(tab => {
        tab.addEventListener('shown.bs.tab', function (event) {
            controlarVisibilidadExportacion();
            if (event.target.id === 'config-tab') {
                actualizarEstadisticas();
            }
        });
    });
    
    // Evento para importar backup
    document.getElementById('backup-file').addEventListener('change', function(e) {
        importarBackupArchivo(e);
    });
}

// =============================================
// FUNCIONES PRINCIPALES
// =============================================

function controlarVisibilidadExportacion() {
    const exportButtons = document.getElementById('export-buttons');
    const visualizacionTab = document.getElementById('visualizacion-tab');
    exportButtons.style.display = visualizacionTab.classList.contains('active') ? 'block' : 'none';
}

function actualizarFechaHora() {
    const now = new Date();
    const optionsTime = { 
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };
    const optionsDate = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
    };
    
    document.getElementById('currentDateTime').textContent = 
        now.toLocaleTimeString('es-MX', optionsTime);
    document.getElementById('currentDate').textContent = 
        now.toLocaleDateString('es-MX', optionsDate);
}

function obtenerFechaHoraActual() {
    const ahora = new Date();
    const fecha = ahora.getDate().toString().padStart(2, '0') + '/' + 
                 (ahora.getMonth() + 1).toString().padStart(2, '0') + '/' + 
                 ahora.getFullYear();
    
    let horas = ahora.getHours();
    let minutos = ahora.getMinutes().toString().padStart(2, '0');
    const ampm = horas >= 12 ? 'PM' : 'AM';
    
    horas = horas % 12;
    horas = horas ? horas : 12;
    
    const hora = `${horas}:${minutos} ${ampm}`;
    
    return { fecha, hora };
}

function validarTelefono(telefono) {
    return /^[0-9]{10}$/.test(telefono);
}

function formatearTelefono(telefono) {
    if (!telefono) return 'No registrado';
    return telefono.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
}

// =============================================
// GESTIÓN DE UNIDADES
// =============================================

async function guardarNuevaUnidad() {
    // Obtener valores del formulario
    const numero = document.getElementById('unidad-numero').value.trim();
    const fecha = document.getElementById('unidad-fecha').value.trim();
    const hora = document.getElementById('unidad-hora').value.trim();
    const operador = document.getElementById('unidad-operador').value.trim();
    const telefono = document.getElementById('unidad-telefono').value.trim();
    const estatus = document.getElementById('unidad-estatus').value;
    const tipo = document.querySelector('input[name="unidad-tipo"]:checked')?.value;
    const linea = document.querySelector('input[name="unidad-linea"]:checked')?.value;
    const ultimoViaje = document.getElementById('unidad-ultimo-viaje').value.trim();
    const notas = document.getElementById('unidad-notas').value.trim();
    
    // Validaciones
    const errores = [];
    
    if (!numero) errores.push('Número económico');
    if (!fecha) errores.push('Fecha');
    if (!hora) errores.push('Hora');
    if (!operador) errores.push('Nombre del operador');
    if (!telefono) errores.push('Teléfono');
    if (!estatus) errores.push('Estatus');
    if (!tipo) errores.push('Tipo de unidad');
    if (!linea) errores.push('Línea');
    
    if (errores.length > 0) {
        mostrarNotificacion(`❌ Campos obligatorios faltantes: ${errores.join(', ')}`, 'error');
        return;
    }
    
    if (!validarTelefono(telefono)) {
        mostrarNotificacion('📱 Teléfono inválido (10 dígitos sin espacios)', 'error');
        return;
    }
    
    if (!validarFormatoFecha(fecha)) {
        mostrarNotificacion('📅 Formato de fecha incorrecto (DD/MM/AAAA)', 'error');
        return;
    }
    
    // Crear nueva unidad
    const nuevaUnidad = {
        id: siguienteIdUnidad++,
        numero: numero.toUpperCase(),
        fecha: fecha,
        hora: hora,
        patio: "Patio Puebla",
        operador: operador,
        telefono: telefono,
        estatus: estatus,
        tipo: tipo,
        linea: linea,
        ultimoViaje: ultimoViaje,
        notas: notas,
        fechaRegistro: new Date().toISOString(),
        despachada: false,
        usuarioRegistro: obtenerUsuarioActual()
    };
    
    // Guardar localmente
    unidades.push(nuevaUnidad);
    localStorage.setItem('unidadesPuebla', JSON.stringify(unidades));
    
    // Guardar en Firebase si está disponible
    if (typeof guardarUnidadFirebase === 'function' && usarFirebase) {
        guardarUnidadFirebase(nuevaUnidad);
    }
    
    // Limpiar formulario (excepto fecha y hora)
    document.getElementById('unidad-numero').value = '';
    document.getElementById('unidad-operador').value = '';
    document.getElementById('unidad-telefono').value = '';
    document.getElementById('unidad-estatus').value = '';
    document.getElementById('unidad-ultimo-viaje').value = '';
    document.getElementById('unidad-notas').value = '';
    document.querySelectorAll('input[name="unidad-tipo"]').forEach(radio => radio.checked = false);
    document.querySelectorAll('input[name="unidad-linea"]').forEach(radio => radio.checked = false);
    
    // Mostrar notificación
    mostrarNotificacion(`✅ Unidad ${nuevaUnidad.numero} registrada correctamente`, 'success');
    
    // Actualizar vistas
    cargarUnidades();
    cargarDespacho();
    actualizarEstadisticas();
}

function validarFormatoFecha(fecha) {
    const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    if (!regex.test(fecha)) return false;
    
    const [, dia, mes, anio] = fecha.match(regex);
    const fechaObj = new Date(anio, mes - 1, dia);
    
    return fechaObj.getDate() == dia && 
           fechaObj.getMonth() == mes - 1 && 
           fechaObj.getFullYear() == anio;
}

function cargarUnidades() {
    const unidadesActivas = unidades.filter(u => !u.despachada);
    const unidadesOrdenadas = [...unidadesActivas].sort((a, b) => {
        const fechaHoraA = convertirFechaHora(a.fecha, a.hora);
        const fechaHoraB = convertirFechaHora(b.fecha, b.hora);
        return fechaHoraA - fechaHoraB;
    });
    
    const sencillos = unidadesOrdenadas.filter(u => u.tipo === 'sencillo');
    const fulls = unidadesOrdenadas.filter(u => u.tipo === 'full');
    
    // Actualizar contadores
    document.getElementById('contador-sencillos').textContent = sencillos.length;
    document.getElementById('contador-fulls').textContent = fulls.length;
    document.getElementById('total-unidades').textContent = `Total: ${unidadesActivas.length} unidades`;
    
    // Actualizar estadísticas
    actualizarEstadisticas();
    
    // Cargar lista de sencillos
    const listaSencillos = document.getElementById('lista-sencillos');
    if (sencillos.length === 0) {
        listaSencillos.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-truck-loading"></i>
                <h6>No hay unidades sencillo</h6>
                <p>Registra la primera unidad sencillo</p>
            </div>
        `;
    } else {
        listaSencillos.innerHTML = '';
        sencillos.forEach((unidad) => {
            listaSencillos.appendChild(crearElementoUnidad(unidad, false));
        });
    }
    
    // Cargar lista de fulls
    const listaFulls = document.getElementById('lista-fulls');
    if (fulls.length === 0) {
        listaFulls.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-truck-loading"></i>
                <h6>No hay unidades full</h6>
                <p>Registra la primera unidad full</p>
            </div>
        `;
    } else {
        listaFulls.innerHTML = '';
        fulls.forEach((unidad) => {
            listaFulls.appendChild(crearElementoUnidad(unidad, false));
        });
    }
}

function cargarDespacho() {
    const unidadesDespacho = unidades.filter(u => !u.despachada && u.estatus === 'listo');
    const unidadesOrdenadas = [...unidadesDespacho].sort((a, b) => {
        const fechaHoraA = convertirFechaHora(a.fecha, a.hora);
        const fechaHoraB = convertirFechaHora(b.fecha, b.hora);
        return fechaHoraA - fechaHoraB;
    });
    
    const sencillos = unidadesOrdenadas.filter(u => u.tipo === 'sencillo');
    const fulls = unidadesOrdenadas.filter(u => u.tipo === 'full');
    
    // Actualizar contadores
    document.getElementById('contador-despacho-sencillos').textContent = sencillos.length;
    document.getElementById('contador-despacho-fulls').textContent = fulls.length;
    
    // Cargar lista de sencillos para despacho
    const listaSencillosDespacho = document.getElementById('lista-despacho-sencillos');
    if (sencillos.length === 0) {
        listaSencillosDespacho.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-truck-loading"></i>
                <h6>No hay unidades sencillo para despachar</h6>
                <p>Todas las unidades sencillo han sido despachadas o no hay unidades listas</p>
            </div>
        `;
    } else {
        listaSencillosDespacho.innerHTML = '';
        sencillos.forEach((unidad) => {
            listaSencillosDespacho.appendChild(crearElementoUnidad(unidad, true));
        });
    }
    
    // Cargar lista de fulls para despacho
    const listaFullsDespacho = document.getElementById('lista-despacho-fulls');
    if (fulls.length === 0) {
        listaFullsDespacho.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-truck-loading"></i>
                <h6>No hay unidades full para despachar</h6>
                <p>Todas las unidades full han sido despachadas o no hay unidades listas</p>
            </div>
        `;
    } else {
        listaFullsDespacho.innerHTML = '';
        fulls.forEach((unidad) => {
            listaFullsDespacho.appendChild(crearElementoUnidad(unidad, true));
        });
    }
}

function crearElementoUnidad(unidad, esParaDespacho = false) {
    const elemento = document.createElement('div');
    elemento.className = `unidad-item ${unidad.estatus}`;
    elemento.setAttribute('data-unidad-id', unidad.id);
    
    let tipoBadge = unidad.tipo === 'sencillo' 
        ? `<span class="sencillo-badge me-2">SENCILLO</span>` 
        : `<span class="full-badge me-2">FULL</span>`;
    
    let lineaBadge = unidad.linea === 'fratsa'
        ? `<span class="fratsa-badge">FRATSA</span>`
        : `<span class="alana-badge">ALANA</span>`;
    
    const botones = esParaDespacho
        ? `<button class="btn-whatsapp" onclick="despacharUnidad(${unidad.id})">
                <i class="fab fa-whatsapp me-1"></i>DESPACHAR
            </button>`
        : `<button class="btn-editar" onclick="abrirModalEditar(${unidad.id})">
                <i class="fas fa-edit me-1"></i>EDITAR
            </button>`;
    
    elemento.innerHTML = `
        <div class="unidad-info">
            <div class="unidad-numero">
                ${unidad.numero}
                ${tipoBadge}
                ${lineaBadge}
            </div>
            <div class="unidad-detalles">
                <span class="estatus-badge estatus-${unidad.estatus} me-2">${obtenerTextoEstatus(unidad.estatus)}</span>
                <i class="fas fa-user me-1"></i>${unidad.operador}
                <span class="telefono-badge ms-2"><i class="fas fa-phone me-1"></i>${formatearTelefono(unidad.telefono)}</span>
                <i class="fas fa-calendar ms-2 me-1"></i>${unidad.fecha}
                <i class="fas fa-clock me-1"></i>${unidad.hora}
                ${unidad.ultimoViaje ? `<br><i class="fas fa-route me-1"></i><strong>Destino:</strong> ${unidad.ultimoViaje}` : ''}
                ${unidad.notas ? `<br><small><i class="fas fa-sticky-note me-1"></i><em>${unidad.notas}</em></small>` : ''}
            </div>
        </div>
        <div class="acciones-unidad">
            ${botones}
        </div>
    `;
    
    return elemento;
}

function convertirFechaHora(fechaStr, horaStr) {
    try {
        const partesFecha = fechaStr.split('/');
        if (partesFecha.length !== 3) return new Date(0);
        
        const dia = parseInt(partesFecha[0]);
        const mes = parseInt(partesFecha[1]) - 1;
        const anio = parseInt(partesFecha[2]);
        
        if (isNaN(dia) || isNaN(mes) || isNaN(anio)) return new Date(0);
        
        let hora = horaStr.toUpperCase().trim();
        let horas, minutos;
        
        hora = hora.replace(/\s+/g, ' ');
        
        if (hora.includes('PM')) {
            hora = hora.replace('PM', '').trim();
            const partesHora = hora.split(':');
            horas = parseInt(partesHora[0]) || 0;
            minutos = parseInt(partesHora[1]) || 0;
            if (horas !== 12) horas += 12;
        } else if (hora.includes('AM')) {
            hora = hora.replace('AM', '').trim();
            const partesHora = hora.split(':');
            horas = parseInt(partesHora[0]) || 0;
            minutos = parseInt(partesHora[1]) || 0;
            if (horas === 12) horas = 0;
        } else {
            const partesHora = hora.split(':');
            horas = parseInt(partesHora[0]) || 0;
            minutos = parseInt(partesHora[1]) || 0;
        }
        
        if (horas < 0 || horas > 23 || minutos < 0 || minutos > 59) {
            return new Date(0);
        }
        
        return new Date(anio, mes, dia, horas, minutos);
    } catch (error) {
        console.error('Error convirtiendo fecha/hora:', error);
        return new Date(0);
    }
}

// =============================================
// DESPACHO DE UNIDADES
// =============================================

async function despacharUnidad(id) {
    const unidad = unidades.find(u => u.id === id);
    if (!unidad) {
        mostrarNotificacion('❌ Unidad no encontrada', 'error');
        return;
    }
    
    if (!unidad.telefono || !validarTelefono(unidad.telefono)) {
        mostrarNotificacion(`📱 ${unidad.operador} no tiene un teléfono válido`, 'error');
        return;
    }
    
    const { fecha, hora } = obtenerFechaHoraActual();
    let mensaje = '';
    
    if (unidad.linea === 'fratsa') {
        mensaje = `🚛 *FRATSA - NUEVO VIAJE ASIGNADO* 🚛

*INFORMACIÓN DEL VIAJE:*
📋 Unidad: ${unidad.numero}
👤 Operador: ${unidad.operador}
📅 Fecha: ${fecha}
⏰ Hora: ${hora}

📍 *PROCEDIMIENTO DE SALIDA:*
1. 📋 Pase a oficina por GASTOS
2. 📄 Revisión de documentación
3. ✅ Confirmar salida con MONITOREO 
4. 🚛 AUTORIZACION DE SALIDA POR VIGILANCIA

¡Buen viaje! 🛣️
*FRATSA S.A. DE C.V.*`;
    } else {
        mensaje = `🚛 *ALANA - NUEVO VIAJE ASIGNADO* 🚛

*INFORMACIÓN DEL VIAJE:*
📋 Unidad: ${unidad.numero}
👤 Operador: ${unidad.operador}
📅 Fecha: ${fecha}
⏰ Hora: ${hora}

📍 *PROCEDIMIENTO DE SALIDA:*
1. 📋 Pase a oficina por GASTOS
2. 📄 Revisión de documentación
3. ✅ Confirmar salida con MONITOREO 
4. 🚛 AUTORIZACION DE SALIDA POR VIGILANCIA

¡Buen viaje! 🛣️
*ALANA TRANSPORTES S.A. DE C.V.*`;
    }
    
    const mensajeCodificado = encodeURIComponent(mensaje);
    const telefonoFormateado = `52${unidad.telefono}`;
    const urlWhatsApp = `https://web.whatsapp.com/send?phone=${telefonoFormateado}&text=${mensajeCodificado}`;
    
    if (confirm(`¿DESPACHAR UNIDAD ${unidad.numero}?\n\nOperador: ${unidad.operador}\nTeléfono: ${unidad.telefono}\nLínea: ${unidad.linea.toUpperCase()}`)) {
        // Marcar como despachada localmente
        const unidadIndex = unidades.findIndex(u => u.id === id);
        if (unidadIndex !== -1) {
            unidades[unidadIndex].despachada = true;
            unidades[unidadIndex].fechaDespacho = new Date().toISOString();
            localStorage.setItem('unidadesPuebla', JSON.stringify(unidades));
            
            // Actualizar en Firebase si está disponible
            if (typeof actualizarUnidadFirebase === 'function' && usarFirebase) {
                await actualizarUnidadFirebase(id, {
                    despachada: true,
                    fechaDespacho: new Date().toISOString()
                });
            }
            
            // Actualizar vistas
            cargarUnidades();
            cargarDespacho();
            actualizarEstadisticas();
            
            mostrarNotificacion(`✅ Unidad ${unidad.numero} despachada`, 'success');
        }
        
        // Abrir WhatsApp
        const ventanaWhatsApp = window.open(urlWhatsApp, 'WhatsApp_FRATSA', 'width=1000,height=700');
        
        setTimeout(() => {
            if (!ventanaWhatsApp || ventanaWhatsApp.closed) {
                window.location.href = `https://api.whatsapp.com/send?phone=${telefonoFormateado}&text=${mensajeCodificado}`;
            }
        }, 2000);
    }
}

function obtenerTextoEstatus(estatus) {
    const estatusMap = {
        'taller': 'TALLER',
        'listo': 'LISTO',
        'sin-operador': 'SIN OPERADOR'
    };
    return estatusMap[estatus] || estatus;
}

function obtenerUsuarioActual() {
    return navigator.userAgent.split(' ')[0] || 'Usuario';
}

// =============================================
// FUNCIONES DE EXPORTACIÓN
// =============================================

function exportarPDF() {
    if (unidades.length === 0) {
        mostrarNotificacion('No hay unidades para exportar', 'warning');
        return;
    }

    const btnPdf = document.getElementById('btn-pdf');
    const originalText = btnPdf.innerHTML;

    btnPdf.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Generando PDF...';
    btnPdf.disabled = true;

    // Ir a pestaña de visualización si no está activa
    const visualizacionTab = document.getElementById('visualizacion-tab');
    if (!visualizacionTab.classList.contains('active')) {
        const tab = new bootstrap.Tab(visualizacionTab);
        tab.show();
    }

    setTimeout(() => {
        const contenido = document.getElementById('visualizacion');
        
        // Ocultar elementos no deseados
        const elementosOcultar = contenido.querySelectorAll('.btn-editar, .btn-despachar, .nav-tabs, .export-buttons, .fixed-bottom');
        const estilosOriginales = [];
        
        elementosOcultar.forEach(el => {
            estilosOriginales.push({ element: el, display: el.style.display });
            el.style.display = 'none';
        });

        html2canvas(contenido, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        }).then(canvas => {
            // Restaurar elementos
            estilosOriginales.forEach(estilo => {
                if (estilo.element && estilo.element.style) {
                    estilo.element.style.display = estilo.display;
                }
            });

            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('l', 'mm', 'a4');
            const imgWidth = 280;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
            
            const fecha = new Date().toLocaleDateString('es-MX');
            const hora = new Date().toLocaleTimeString('es-MX');
            pdf.setFontSize(10);
            pdf.setTextColor(100);
            pdf.text(`FRATSA S.A. DE C.V. - Control de Unidades Patio Puebla - Generado: ${fecha} ${hora}`, 10, 5);
            
            const nombreArchivo = `Unidades_Patio_Puebla_${fecha.replace(/\//g, '-')}.pdf`;
            pdf.save(nombreArchivo);
            
            mostrarNotificacion('✅ PDF generado correctamente', 'success');
            
        }).catch(error => {
            console.error('Error al generar PDF:', error);
            mostrarNotificacion('❌ Error al generar PDF', 'error');
        }).finally(() => {
            btnPdf.innerHTML = originalText;
            btnPdf.disabled = false;
        });
    }, 1000);
}

function exportarExcel() {
    if (unidades.length === 0) {
        mostrarNotificacion('No hay unidades para exportar', 'warning');
        return;
    }

    const datos = unidades.map(unidad => ({
        'ID': unidad.id,
        'Número Económico': unidad.numero,
        'Tipo': unidad.tipo.toUpperCase(),
        'Línea': unidad.linea.toUpperCase(),
        'Operador': unidad.operador,
        'Teléfono': formatearTelefono(unidad.telefono),
        'Estatus': obtenerTextoEstatus(unidad.estatus),
        'Fecha': unidad.fecha,
        'Hora': unidad.hora,
        'Destino': unidad.ultimoViaje || 'N/A',
        'Notas': unidad.notas || 'N/A',
        'Patio': unidad.patio,
        'Despachada': unidad.despachada ? 'Sí' : 'No',
        'Fecha Registro': new Date(unidad.fechaRegistro).toLocaleString(),
        'Usuario Registro': unidad.usuarioRegistro || 'N/A'
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(datos);
    
    // Ajustar anchos
    ws['!cols'] = [
        { wch: 5 }, { wch: 15 }, { wch: 8 }, { wch: 8 }, { wch: 20 },
        { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 8 }, { wch: 20 },
        { wch: 30 }, { wch: 12 }, { wch: 8 }, { wch: 20 }, { wch: 15 }
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, 'Unidades Patio Puebla');
    
    const fecha = new Date().toISOString().slice(0,10);
    XLSX.writeFile(wb, `Unidades_Patio_Puebla_${fecha}.xlsx`);
    
    mostrarNotificacion('✅ Excel exportado correctamente', 'success');
}

// =============================================
// FUNCIONES DE UTILIDAD
// =============================================

function inicializarCalendario() {
    const calendario = document.getElementById('mini-calendario');
    const hoy = new Date();
    const mes = hoy.getMonth();
    const anio = hoy.getFullYear();
    
    let html = '<div class="text-center mb-2">';
    html += `<small class="fw-bold">${obtenerNombreMes(mes)} ${anio}</small>`;
    html += '</div><div class="d-flex flex-wrap">';
    
    const diasSemana = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];
    diasSemana.forEach(dia => {
        html += `<div class="text-center" style="width: 14.28%; font-size: 0.7rem; padding: 2px;">${dia}</div>`;
    });
    
    const primerDia = new Date(anio, mes, 1).getDay();
    const ultimoDia = new Date(anio, mes + 1, 0).getDate();
    
    for (let i = 0; i < primerDia; i++) {
        html += '<div style="width: 14.28%; padding: 2px;"></div>';
    }
    
    for (let dia = 1; dia <= ultimoDia; dia++) {
        const fechaStr = dia.toString().padStart(2, '0') + '/' + 
                       (mes + 1).toString().padStart(2, '0') + '/' + 
                       anio;
        const esHoy = dia === hoy.getDate() && mes === hoy.getMonth() && anio === hoy.getFullYear();
        const claseBoton = esHoy ? 'btn-fratsa' : 'btn-outline-primary';
        
        html += `<div class="text-center" style="width: 14.28%; padding: 2px;">`;
        html += `<button type="button" class="btn btn-sm ${claseBoton} w-100" 
                 onclick="seleccionarFecha('${fechaStr}')" style="font-size: 0.7rem; padding: 2px;">${dia}</button>`;
        html += '</div>';
    }
    
    html += '</div>';
    calendario.innerHTML = html;
}

function mostrarCalendario() {
    const modal = new bootstrap.Modal(document.getElementById('calendarioModal'));
    modal.show();
}

function seleccionarFecha(fecha) {
    document.getElementById('unidad-fecha').value = fecha;
    const modal = bootstrap.Modal.getInstance(document.getElementById('calendarioModal'));
    if (modal) modal.hide();
}

function usarFechaHoy() {
    const { fecha: fechaHoy } = obtenerFechaHoraActual();
    document.getElementById('unidad-fecha').value = fechaHoy;
    const modal = bootstrap.Modal.getInstance(document.getElementById('calendarioModal'));
    if (modal) modal.hide();
}

function obtenerNombreMes(mes) {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return meses[mes];
}

function abrirModalEditar(id) {
    const unidad = unidades.find(u => u.id === id);
    if (!unidad) {
        mostrarNotificacion('Unidad no encontrada', 'error');
        return;
    }
    
    document.getElementById('editar-unidad-id').value = unidad.id;
    document.getElementById('editar-unidad-numero').textContent = unidad.numero;
    document.getElementById('editar-estatus').value = unidad.estatus;
    document.getElementById('editar-ultimo-viaje').value = unidad.ultimoViaje || '';
    document.getElementById('editar-notas').value = unidad.notas || '';
    
    const modal = new bootstrap.Modal(document.getElementById('editarEstatusModal'));
    modal.show();
}

async function guardarCambiosEstatus() {
    const id = parseInt(document.getElementById('editar-unidad-id').value);
    const nuevoEstatus = document.getElementById('editar-estatus').value;
    const nuevoUltimoViaje = document.getElementById('editar-ultimo-viaje').value;
    const nuevasNotas = document.getElementById('editar-notas').value;
    
    if (!nuevoEstatus) {
        mostrarNotificacion('Seleccione un estatus', 'warning');
        return;
    }
    
    const unidadIndex = unidades.findIndex(u => u.id === id);
    if (unidadIndex === -1) {
        mostrarNotificacion('Unidad no encontrada', 'error');
        return;
    }
    
    // Actualizar localmente
    unidades[unidadIndex].estatus = nuevoEstatus;
    unidades[unidadIndex].ultimoViaje = nuevoUltimoViaje;
    unidades[unidadIndex].notas = nuevasNotas;
    unidades[unidadIndex].fechaActualizacion = new Date().toISOString();
    
    localStorage.setItem('unidadesPuebla', JSON.stringify(unidades));
    
    // Actualizar en Firebase si está disponible
    if (typeof actualizarUnidadFirebase === 'function' && usarFirebase) {
        await actualizarUnidadFirebase(id, {
            estatus: nuevoEstatus,
            ultimoViaje: nuevoUltimoViaje,
            notas: nuevasNotas,
            fechaActualizacion: new Date().toISOString()
        });
    }
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('editarEstatusModal'));
    if (modal) modal.hide();
    
    cargarUnidades();
    cargarDespacho();
    actualizarEstadisticas();
    
    mostrarNotificacion('Estatus actualizado correctamente', 'success');
}

// Continuo con las funciones de notificaciones en la siguiente respuesta...
