import fs from 'fs';

let pComp = fs.readFileSync('c:/Users/duvan/FRONTEND/react/src/componentes/TableProductos/productos.tsx', 'utf8');

pComp = pComp.replace(/<th>precio_venta<\/th>/g, '<th>Precio de Venta</th>');
pComp = pComp.replace(/<label>precio_venta<\/label>/g, '<label>Precio de Venta</label>');
pComp = pComp.replace(/formatprecio_venta/g, 'formatPrecio');

fs.writeFileSync('c:/Users/duvan/FRONTEND/react/src/componentes/TableProductos/productos.tsx', pComp, 'utf8');

console.log('PATCH_FRONTEND_LABELS_OK');
