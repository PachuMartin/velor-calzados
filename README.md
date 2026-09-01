# Tienda Online de Calzado y Moda Femenina (Estilo TikTok / Instagram)

Este proyecto es una plataforma de comercio electrónico responsiva y móvil-first optimizada para la venta de calzado y prendas de vestir femeninas. Presenta una interfaz fluida e interactiva inspirada en TikTok (feed de videos verticales con productos comprables vinculados) e Instagram (cuadrícula de productos de alta costura). Incluye además un completo panel de administración para subir productos, subir videos (.mp4) y modificar la configuración de la tienda.

---

## Características Principales

*   **Feed Reels Estilo TikTok**: Desplazamiento vertical (scroll snap) con reproducción automática del video en pantalla (silenciado por defecto para cumplir con políticas del navegador). Tarjeta flotante interactiva que vincula directamente el video con un producto para comprarlo rápido.
*   **Catálogo Estilo Instagram**: Cuadrícula de fotos responsiva filtrable por categoría (Calzado, Prendas).
*   **Detalle de Producto**: Selector de tallas (ej: 35-40 o S-XL), colores, cantidad en stock y carrito de compras.
*   **Carrito de Compras Integrado con WhatsApp**: Envío directo de pedidos con formato estético para coordinar pago y envío de forma personalizada con el comprador.
*   **Panel de Administración Seguro**:
    *   Gestión de Stock: CRUD completo de productos (nombre, precio, stock, tallas, colores, imágenes).
    *   Subida de Reels: Sube archivos de video (.mp4) o usa enlaces externos, vinculando el contenido a cualquier producto de la base.
    *   Ajustes: Modificación del título del comercio, enlaces de redes sociales y número de WhatsApp de contacto.

---

## Credenciales de Administración (Predeterminadas)

*   **Usuario**: `admin`
*   **Contraseña**: `123456`

---

## Cómo Ejecutar el Proyecto Localmente

El proyecto está diseñado para funcionar de forma integrada entre el servidor backend y el cliente frontend.

### Requisitos Previos

Tener instalado **Node.js** (v18 o superior).

### Paso 1: Iniciar el Servidor Backend

El backend se encarga de guardar las configuraciones, gestionar las cargas de archivos multimedia y servir los datos persistentes desde `db.json`.

1. Abre una terminal de comandos (PowerShell o CMD).
2. Navega al directorio del backend:
   ```bash
   cd backend
   ```
3. Inicia el servidor:
   ```bash
   npm start
   ```
   *El servidor correrá en: `http://localhost:5000`*

### Paso 2: Iniciar el Cliente Frontend

El frontend corre sobre Vite y React en el puerto 3000.

1. Abre una segunda terminal de comandos.
2. Navega al directorio del frontend:
   ```bash
   cd frontend
   ```
3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   *La tienda estará disponible en tu navegador en: `http://localhost:3000`*

---

## Estructura de Directorios

```text
tienda-calzado-mujer/
├── backend/
│   ├── uploads/          # Directorio donde se guardan los videos/fotos subidos
│   ├── db.json           # Base de datos local en archivo JSON
│   ├── server.js         # Servidor web Express con los endpoints API
│   └── package.json
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx       # Componente principal / Estados globales
        ├── main.jsx      # Entrada de ejecución React
        ├── index.css     # Estilos de Tailwind CSS y scroll snapping
        ├── mockData.js   # Datos de prueba (para ejecutar la app si el backend está apagado)
        └── components/
            ├── VideoFeed.jsx     # Reels estilo TikTok
            ├── ProductGrid.jsx   # Grid estilo Instagram
            ├── ProductDetail.jsx # Vista detallada y opciones de producto
            ├── Cart.jsx          # Panel del carrito y checkout a WhatsApp
            ├── Login.jsx         # Formulario de inicio de sesión administrativo
            └── AdminPanel.jsx    # Dashboard de control para el administrador
```

---

## Modo Demo (Sin Backend)

Si abres el frontend sin iniciar el servidor backend, la tienda entrará automáticamente en **Modo Demo (DEMO)**. Podrás navegar por los productos de prueba, interactuar con los videos del feed, agregar calzados al carrito y simular el inicio de sesión del administrador (`admin` / `123456`) para interactuar con las opciones de control en memoria.
