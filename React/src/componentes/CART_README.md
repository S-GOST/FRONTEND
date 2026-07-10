# Componente Cart (Carrito de Compras)

## Descripción
Componente React completo para gestionar un carrito de compras con funcionalidad de:
- Agregar/eliminar productos
- Actualizar cantidades
- Aplicar cupones de descuento
- Resumen de precios con impuestos y envío
- Notificaciones interactivas
- Modals de confirmación
- Persistencia de datos en localStorage

## Instalación

El componente está ubicado en: `src/componentes/Cart.tsx` con estilos en `src/componentes/Cart.css`

### Importar en tu aplicación:

```tsx
import Cart from '../componentes/Cart';

// En tu router
<Route path="/carrito" element={<Cart />} />
```

## Uso

### Uso básico:

```tsx
<Cart />
```

### Con callback de checkout:

```tsx
<Cart 
  onCheckout={(cartData) => {
    console.log('Datos del carrito:', cartData);
    // Enviar a servidor de checkout
  }} 
/>
```

## Características

### 1. **Gestión de Items**
- Agregar productos al carrito
- Incrementar/decrementar cantidad
- Eliminar productos con confirmación

```tsx
// Los productos se agregan con estructura:
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  icon?: string;
  description?: string;
}
```

### 2. **Cupones de Descuento**
- Códigos válidos: `KTM2024` y `KTM2025`
- Descuento: $30.00 fijos
- Se aplica/remueve dinámicamente

```tsx
// Aplicar cupón
applyDiscount();
```

### 3. **Cálculos Automáticos**
- Subtotal
- Envío: $9.99 fijo
- Impuestos: 21%
- Descuento
- **Total final**

### 4. **Persistencia de datos**
Los datos se guardan automáticamente en `localStorage`:
- `ktmCart`: Carrito actual
- `ktmDiscount`: Estado del descuento aplicado
- `checkoutCart`: Datos para checkout

### 5. **Notificaciones**
Sistema de notificaciones tipo toast que se auto-eliminan:
- Success (verde)
- Warning (rojo)
- Info (azul)

### 6. **Modals de Confirmación**
- Eliminar producto
- Proceder a checkout
- (Opcional) Vaciar carrito completo

## Props

```tsx
interface CartProps {
  onCheckout?: (cartData: any) => void;
}
```

### `onCheckout` (opcional)
Función callback que se ejecuta cuando el usuario confirma el checkout.

**Datos devueltos:**
```ts
{
  cart: { [key: string]: CartItem },
  discountApplied: boolean,
  totals: {
    subtotal: number,
    tax: number,
    discount: number,
    total: number,
    totalItems: number
  }
}
```

## Métodos Internos

### `addToCart(product)`
Agrega un producto al carrito o incrementa su cantidad si ya existe.

### `updateQuantity(id, change)`
Actualiza la cantidad de un producto (+1 o -1).

### `removeFromCart(id)`
Elimina un producto del carrito con animación.

### `applyDiscount()`
Aplica o valida un cupón de descuento.

### `clearCart()`
Limpia el carrito completamente.

### `calculateTotals()`
Recalcula todos los totales incluyendo impuestos y descuentos.

## Estilos Personalizados

### Variables CSS (disponibles para override):
```css
:root {
  --ktm-orange: #FF6600;
  --ktm-orange-glow: #FF8C00;
  --ktm-dark: #0A0A0A;
  --ktm-gray-light: #CCCCCC;
  /* ... más variables */
}
```

### Personalizar colores:
```css
/* En tu CSS global */
:root {
  --ktm-orange: #tu-color;
  --ktm-dark: #tu-color-oscuro;
}
```

## Ejemplo Completo

```tsx
// App.tsx o donde uses el carrito
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Cart from './componentes/Cart';

function App() {
  const handleCheckout = (cartData) => {
    console.log('Procesando checkout...');
    console.log('Total a pagar:', cartData.totals.total);
    
    // Aquí envías los datos al servidor
    // fetch('/api/checkout', { method: 'POST', body: JSON.stringify(cartData) })
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/carrito" 
          element={<Cart onCheckout={handleCheckout} />} 
        />
      </Routes>
    </BrowserRouter>
  );
}
```

## LocalStorage

El componente usa las siguientes claves en localStorage:

```json
{
  "ktmCart": {
    "product-id-1": {
      "id": "product-id-1",
      "name": "Producto 1",
      "price": 50,
      "quantity": 2,
      "category": "Accesorios",
      "icon": "lightbulb",
      "description": "Descripción del producto"
    }
  },
  "ktmDiscount": false,
  "checkoutCart": { /* copia del carrito para checkout */ },
  "checkoutDiscount": false
}
```

## Estructura de Carpetas

```
src/
├── componentes/
│   ├── Cart.tsx           (Componente principal)
│   ├── Cart.css           (Estilos)
│   └── ... otros componentes
├── routes/
│   └── AppRouter.tsx      (Con ruta /carrito)
└── ...
```

## Responsividad

El componente es totalmente responsive:
- **Desktop**: Layout en 2 columnas (items + resumen)
- **Tablet**: Layout en 1 columna
- **Mobile**: Optimizado para pantallas pequeñas
  - Botones expandidos
  - Modals adaptados
  - Notificaciones optimizadas

## Notas Importantes

1. **Requiere Bootstrap Icons**: Asegúrate de tener bootstrap-icons instalado y disponible en tu HTML
2. **Requiere React Router**: El componente usa `Link` de React Router
3. **LocalStorage**: Los datos persisten en el navegador
4. **Animaciones**: Incluye animaciones CSS suaves
5. **Accesibilidad**: Usa iconos de Bootstrap Icons para mejor accesibilidad

## Códigos de Descuento Predefinidos

- `KTM2024` - Descuento de $30.00
- `KTM2025` - Descuento de $30.00

Para agregar más códigos, edita el método `applyDiscount()`:

```tsx
function applyDiscount() {
  const code = promoCode.toUpperCase();
  if (code === 'KTM2024' || code === 'KTM2025' || code === 'TU_CODIGO') {
    saveCart(cart, true);
    showNotification('¡Descuento aplicado! -$30.00', 'success');
  } else {
    saveCart(cart, false);
    showNotification('Código no válido', 'warning');
  }
}
```

## Troubleshooting

### El carrito no persiste
- Verifica que localStorage esté habilitado en el navegador
- Revisa la consola para errores de JSON.parse/stringify

### Los estilos no se aplican
- Asegúrate de importar `Cart.css`
- Verifica que Bootstrap Icons esté cargado

### Los modals no aparecen
- Verifica que el contenedor del modal-overlay sea visible
- Revisa el z-index en la consola

## Mejoras Futuras

- [ ] Conexión con API backend
- [ ] Sincronización entre pestañas
- [ ] Historial de cambios
- [ ] Carrito compartible por URL
- [ ] Integración con pasarela de pagos
- [ ] Notificaciones por email

---

**Versión**: 1.0.0  
**Última actualización**: 2025-07-10
