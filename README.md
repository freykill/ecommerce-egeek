# Ecommerce eGeek — Storefront público

Sitio público de la tienda (no requiere login): el comprador ve el catálogo,
arma su pedido y lo cierra por **WhatsApp** con la tienda. Consume la API pública
del backend multi-tenant.

- **Stack:** Angular 21 (standalone, signals, control flow nuevo, lazy routes) +
  Tailwind CSS 4.
- **Estética:** "marketplace cercano" — redondeado, cálido, botones grandes y
  directos. Los **colores llegan dinámicos** del backend (`/public/branding`).

---

## 1. Configuración (¡importante!)

Todo se cambia en **un solo archivo**: [`src/app/core/config/environment.ts`](src/app/core/config/environment.ts)

```ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000/api', // prefijo global del backend (termina en /api)
  tenantSlug: 'default',                    // identifica la tienda (header X-Tenant-Slug); en dev la demo es 'default'
};
```

- `apiBaseUrl`: URL base del backend.
- `tenantSlug`: se envía en **cada** request como header `X-Tenant-Slug` (multi-tenant
  OBLIGATORIO). Sin esto ningún endpoint del storefront responde.

> **CORS:** al apuntar a otro host (ej. `localhost:3000` desde `localhost:4200`),
> el backend debe permitir el origen y el header `X-Tenant-Slug`. Si prefieres
> evitar CORS, sirve el front bajo el subdominio de la tienda o usa un proxy de
> dev y deja `apiBaseUrl = '/api'`.

## 2. Correr

```bash
npm install      # solo la primera vez
npm start        # ng serve -> http://localhost:4200
npm run build    # build de producción en dist/
npm test         # tests unitarios (vitest), una sola corrida con --watch=false
```

---

## 3. Arquitectura

```
src/app/
  core/
    config/environment.ts        Config editable (URL + tenant slug)
    models/                      Interfaces TS calcadas de la API (barrel en index.ts)
    http/
      tenant.interceptor.ts      Añade X-Tenant-Slug a cada request
      api.service.ts             Desenvuelve { success, data, meta } y normaliza errores (ApiError)
    services/
      store-context.service.ts   Branding + settings (carga al iniciar, signals globales)
      theme.service.ts           Aplica colores de marca a CSS vars (contrast auto)
      catalog.service.ts         categorías, marcas, productos, detalle
      cart.service.ts            Carrito (signals + localStorage)
      order.service.ts           checkout, seguimiento, whatsapp-sent
  shared/
    pipes/money.pipe.ts          {{ valor | money }} con el símbolo de la tienda
    ui/                          icon, spinner, empty-state, product-card
  layout/                        header (buscador, carrito, categorías) + footer
  features/
    catalog/                     Grilla paginada + filtros (search/category/brand)
    product-detail/              Galería, variantes, stepper, agregar al carrito
    cart/                        Carrito editable + resumen
    checkout/                    Formulario + validación + creación del pedido
    order-tracking/              Estado del pedido + timeline
    not-found/                   404
  app.ts / app.routes.ts / app.config.ts
```

### Contratos clave (para extender)

- **Envoltura:** todas las respuestas vienen como `{ success, message, data, meta }`.
  `ApiService` devuelve directamente `data` (y `meta` en listados). Los errores se
  normalizan a `ApiError { message, statusCode, errors }` (mensaje ya en español).
- **Tema dinámico:** `ThemeService` escribe `--brand-primary` / `--brand-secondary`
  (y su color de contraste) en `:root`. Tailwind expone `bg-brand`, `text-brand`,
  `bg-brand-soft`, etc. (ver `@theme inline` en `src/styles.css`).
- **Carrito:** `CartService` es la única fuente de verdad (signals + localStorage).
  Guarda una "foto" del precio para mostrar; **el total real lo calcula el servidor**
  en el checkout. El payload se arma con `cart.toCheckoutItems()` (solo `idVariant` +
  `quantity`).
- **Sistema de diseño:** clases reutilizables en `src/styles.css`
  (`.btn`, `.btn-brand`, `.btn-wa`, `.btn-outline`, `.card`, `.pill`, `.chip`,
  `.input`, `.label`, `.surface-page`).

## 4. Rutas

| Ruta | Página |
|------|--------|
| `/` | Catálogo (acepta `?search=`, `?category=`, `?brand=`, `?page=`) |
| `/producto/:slug` | Detalle del producto |
| `/carrito` | Carrito |
| `/checkout` | Finalizar pedido |
| `/pedido/:token` | Seguimiento del pedido (guarda el `publicToken`) |

## 5. Flujo de compra

1. El comprador arma el carrito con variantes (`idVariant` + `quantity`).
2. En **checkout** envía sus datos → `POST /store/orders` (el servidor calcula el
   total y reserva stock 48 h; estado inicial `PN`).
3. Se abre el **`whatsappUrl`** para cerrar con la tienda y se marca
   `whatsapp-sent`.
4. Se redirige a `/pedido/:publicToken` para el seguimiento.

Respeta `maintenanceMode`: si está activo, el checkout se deshabilita (y el backend
igual responde 503).
