import { Routes } from '@angular/router';

/**
 * Rutas del storefront (todas públicas). Los componentes se cargan lazy desde
 * rutas conocidas; cada feature vive en su propia carpeta.
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/catalog/catalog.page').then((m) => m.CatalogPage),
    title: 'Catálogo',
  },
  {
    path: 'producto/:slug',
    loadComponent: () =>
      import('./features/product-detail/product-detail.page').then(
        (m) => m.ProductDetailPage,
      ),
  },
  {
    path: 'carrito',
    loadComponent: () =>
      import('./features/cart/cart.page').then((m) => m.CartPage),
    title: 'Tu carrito',
  },
  {
    path: 'checkout',
    loadComponent: () =>
      import('./features/checkout/checkout.page').then((m) => m.CheckoutPage),
    title: 'Finalizar pedido',
  },
  {
    path: 'pedido/:token',
    loadComponent: () =>
      import('./features/order-tracking/order-tracking.page').then(
        (m) => m.OrderTrackingPage,
      ),
    title: 'Seguimiento del pedido',
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.page').then((m) => m.NotFoundPage),
    title: 'Página no encontrada',
  },
];
