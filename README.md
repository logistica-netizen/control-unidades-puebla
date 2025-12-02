# 🚛 Sistema de Control de Unidades - Patio Puebla

Sistema web para el control, registro y despacho de unidades de transporte.

## 🚀 Características

- ✅ **Registro de unidades** con todos los datos necesarios
- ✅ **Visualización en tiempo real** organizada por tipo
- ✅ **Despacho automático** por WhatsApp
- ✅ **Exportación** a PDF y Excel
- ✅ **Backup automático** de datos
- ✅ **Diseño responsive** (funciona en móvil y desktop)
- ✅ **Modo offline** (trabaja sin internet)

## 📱 Cómo Usar

### 1. Registro de Unidades
1. Completa el formulario en la pestaña "Registro"
2. Todos los campos con * son obligatorios
3. El teléfono debe tener 10 dígitos sin espacios
4. Haz clic en "Registrar Unidad"

### 2. Visualización
1. Ve a la pestaña "Visualización"
2. Las unidades se ordenan por antigüedad
3. Colores según estatus:
   - 🔴 **Rojo**: Taller
   - 🟢 **Verde**: Listo
   - 🟡 **Amarillo**: Sin operador

### 3. Despacho
1. Solo unidades con estatus "LISTO"
2. Haz clic en "DESPACHAR"
3. Se abre WhatsApp con mensaje predefinido
4. La unidad se marca como despachada automáticamente

### 4. Configuración
- **Exportar respaldo**: Guarda todos los datos
- **Importar respaldo**: Restaura datos anteriores
- **Estadísticas**: Ver conteo de unidades
- **Compartir**: Comparte el sistema con tu equipo

## 🌐 Cómo Publicar en Internet

### Opción 1: GitHub Pages (Gratis)
1. Sube todos los archivos a GitHub
2. Activa GitHub Pages en Settings
3. Tu sitio estará en: `https://[usuario].github.io/[repositorio]`

### Opción 2: Netlify (Recomendado)
1. Ve a netlify.com
2. Arrastra y suelta la carpeta
3. ¡Listo! Netlify te da una URL

## 📦 Estructura de Archivos