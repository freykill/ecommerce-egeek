<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/logo-white.svg">
  <img src="docs/logo.svg" alt="egeek" width="150">
</picture>

### Compra desde el catálogo y cierra el pedido por WhatsApp

Storefront multi-tienda: catálogo, carrito y checkout **sin login**. El cliente
arma su pedido y lo confirma por WhatsApp; el nombre, el logo, los colores y la
moneda llegan del backend, así que un mismo frontend sirve a cualquier tienda.

[![Ver la tienda en vivo](https://img.shields.io/badge/Ver_la_tienda_en_vivo-16a34a?style=flat-square&logo=vercel&logoColor=white)](https://ecommerce-egeek.vercel.app/)

![Angular](https://img.shields.io/badge/Angular-161616?style=flat-square&logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-161616?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-161616?style=flat-square&logo=tailwindcss&logoColor=white)
![RxJS](https://img.shields.io/badge/RxJS-161616?style=flat-square&logo=reactivex&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-161616?style=flat-square&logo=vitest&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-161616?style=flat-square&logo=vercel&logoColor=white)

</div>

<!--
  Sugerencia: agrega una captura del catálogo aquí para que el README luzca mejor.
  Guárdala en docs/ y descomenta:

  <p align="center">
    <img src="docs/catalogo.png" alt="Catálogo de egeek" width="820">
  </p>
-->

## Sobre el proyecto

**egeek** es el frontend público de una plataforma de e-commerce pensada para
tiendas que venden por WhatsApp. Muestra el catálogo, deja armar el pedido y lo
cierra abriendo WhatsApp con el resumen listo; el pedido se crea en el backend y
el cliente puede hacerle seguimiento con un enlace, sin crear cuenta.

Toda la lógica de negocio (precios, stock, totales) vive en el backend: el front
nunca envía un precio, solo `idVariant` + cantidad, y el servidor confirma el
total. El panel de administración de la tienda vive en un repositorio aparte;
este repo es **solo la tienda pública**.

## Características

- **Catálogo** con búsqueda, filtros por categoría y marca, y productos destacados.
- **Detalle de producto** con variantes (p. ej. talla/color), galería e imágenes
  por variante.
- **Carrito** persistente en `localStorage`, construido con *signals*; el subtotal
  es referencial y el total real lo confirma el checkout en el servidor.
- **Checkout sin login**: se crea el pedido y se abre WhatsApp con el mensaje
  armado (incluye el enlace de seguimiento).
- **Seguimiento del pedido** por enlace público con token, sin cuenta.
- **Multi-tenant / white-label**: un mismo frontend sirve varias tiendas mediante
  el header `X-Tenant-Slug`.
- **Marca dinámica**: el color primario y demás branding llegan del backend y se
  inyectan en tokens CSS (`color-mix`), sin recompilar.
- **Modo mantenimiento** y opciones de **delivery / retiro en tienda** según la
  configuración de cada tienda.

## Stack

| Capa | Tecnologías |
| --- | --- |
| Framework | Angular 21 — standalone components, señales y control-flow (`@if` / `@for`), rutas lazy |
| Estilos | Tailwind CSS v4 · sistema de tokens propio (*editorial minimal*) · Instrument Sans + IBM Plex Mono |
| Reactividad | Angular Signals + RxJS (`HttpClient`) |
| Testing | Vitest |
| Backend | API pública multi-tenant *(repositorio aparte)* |
| Entrega | Vercel |

## Instalación

Requiere **Node.js 20+** y **npm 11+**.

```bash
git clone <url-del-repo>
cd ecommerce-egeek
npm install
npm start
```

La app queda disponible en `http://localhost:4200`.

## Configuración

El storefront apunta a un backend y a una tienda con solo dos valores en
[`src/app/core/config/environment.ts`](src/app/core/config/environment.ts):

```ts
export const environment = {
  production: false,
  apiBaseUrl: 'https://tu-backend/api', // prefijo del backend (termina en /api)
  tenantSlug: 'mi-tienda',              // identifica la tienda (header X-Tenant-Slug)
};
```

Cada request al backend viaja con el header `X-Tenant-Slug`; sin él, ningún
endpoint del storefront responde. Si apuntas a otro host (p. ej. `localhost:3000`
desde `:4200`), el backend debe permitir el origen y el header por CORS.

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm start` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Build de producción en `dist/ecommerce-egeek/browser` |
| `npm test` | Tests unitarios con Vitest |
| `npm run watch` | Build incremental en modo watch |

## Rutas

| Ruta | Página |
| --- | --- |
| `/` | Catálogo (acepta `?search=`, `?category=`, `?brand=`, `?page=`) |
| `/producto/:slug` | Detalle del producto |
| `/carrito` | Carrito |
| `/checkout` | Finalizar pedido |
| `/pedido/:token` | Seguimiento del pedido |

## Estructura

```
src/app/
├─ core/
│  ├─ config/    environment (apiBaseUrl + tenantSlug)
│  ├─ http/      ApiService + tenant.interceptor (X-Tenant-Slug)
│  ├─ models/    tipos de la API (catálogo, pedidos, branding, settings)
│  └─ services/  cart · catalog · order · store-context · theme
├─ features/     catalog · product-detail · cart · checkout · order-tracking
├─ layout/       header · footer
└─ shared/       ui (product-card, spinner, empty-state, icon) · pipes (money)
```

## Despliegue

La app compila a un sitio estático (SPA). El build de producción queda en
`dist/ecommerce-egeek/browser`:

```bash
npm run build
```

Está desplegada en **Vercel** ([ecommerce-egeek.vercel.app](https://ecommerce-egeek.vercel.app/)).
En cualquier hosting estático, recuerda redirigir todas las rutas a `index.html`
para que funcione el enrutado del lado del cliente.

---

<div align="center">
  Desarrollado por <b>Ivan Diaz</b>
</div>
