# 🚛 Sistema de Control de Unidades - Patio Puebla

Sistema web para el control, registro y despacho de unidades de transporte **con sincronización en tiempo real**.

## 🚀 Características Principales

### ✅ **Sincronización en Tiempo Real**
- **Firebase Integration**: Todos los cambios se sincronizan instantáneamente entre dispositivos
- **Modo offline**: Funciona sin conexión a internet
- **Backup automático**: Datos respaldados en la nube

### ✅ **Funcionalidades Completas**
- **Registro de unidades** con todos los datos necesarios
- **Visualización organizada** por tipo (Sencillo/Full)
- **Despacho automático** por WhatsApp con mensajes predefinidos
- **Exportación** a PDF y Excel
- **Gestión de estatus** (Taller, Listo, Sin Operador)
- **Estadísticas en tiempo real**

### ✅ **Diseño Profesional**
- **Responsive**: Funciona en móviles y desktop
- **Tema FRATSA**: Colores corporativos
- **Interfaz intuitiva**: Fácil de usar
- **PWA**: Instalable como aplicación nativa

## 📱 Cómo Usar

### 1. Registro de Unidades
1. Ve a la pestaña **"Registro"**
2. Completa todos los campos obligatorios (*)
3. Teléfono: **10 dígitos sin espacios**
4. Haz clic en **"Registrar Unidad"**

### 2. Visualización
1. Ve a la pestaña **"Visualización"**
2. Las unidades se ordenan por antigüedad
3. **Colores según estatus**:
   - 🔴 **Rojo**: Taller
   - 🟢 **Verde**: Listo
   - 🟡 **Amarillo**: Sin operador
4. Haz clic en **"EDITAR"** para cambiar estatus

### 3. Despacho
1. Solo unidades con estatus **"LISTO"**
2. Haz clic en **"DESPACHAR"**
3. Se abre WhatsApp con mensaje automático
4. La unidad se marca como **despachada** automáticamente

### 4. Configuración
- **Exportar/Importar respaldo**: Gestión de datos
- **Estadísticas**: Conteo de unidades
- **Compartir**: Comparte el sistema con tu equipo
- **Limpieza**: Elimina unidades despachadas

## 🔥 Sincronización en Tiempo Real

### ¿Cómo funciona?
1. **Registras una unidad** en la computadora A
2. **Aparece automáticamente** (2-3 segundos) en la computadora B
3. **Todos los cambios** se sincronizan automáticamente
4. **Funciona offline**: Los datos se guardan localmente y se sincronizan al reconectar

### Estado de conexión:
- 🟢 **En Tiempo Real**: Conectado a Firebase
- 🔴 **Sin Conexión**: Sin internet
- 🟡 **Modo Local**: Firebase no disponible

## 🌐 Acceso

### URL de la aplicación:
