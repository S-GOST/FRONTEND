import fs from 'fs';

// Patch frontend TableProductos
let pComp = fs.readFileSync('c:/Users/duvan/FRONTEND/react/src/componentes/TableProductos/productos.tsx', 'utf8');
pComp = pComp.replace(/Precio/g, 'precio_venta');
fs.writeFileSync('c:/Users/duvan/FRONTEND/react/src/componentes/TableProductos/productos.tsx', pComp, 'utf8');

// Patch ReporteInventario.tsx just in case there's any usage of Precio
let invComp = fs.readFileSync('c:/Users/duvan/FRONTEND/react/src/componentes/TableAdmin/ReporteInventario.tsx', 'utf8');
invComp = invComp.replace(/Precio/g, 'precio_venta');
fs.writeFileSync('c:/Users/duvan/FRONTEND/react/src/componentes/TableAdmin/ReporteInventario.tsx', invComp, 'utf8');

console.log('PATCH_FRONTEND_OK');
