import fs from 'fs';

// Patch productosModel.js
let pModel = fs.readFileSync('c:/Users/duvan/BACKEND/servidor/models/productosModel.js', 'utf8');
pModel = pModel.replace(/Precio/g, 'precio_venta');
fs.writeFileSync('c:/Users/duvan/BACKEND/servidor/models/productosModel.js', pModel, 'utf8');

// Patch informeController.js
let infCtrl = fs.readFileSync('c:/Users/duvan/BACKEND/servidor/controllers/informeController.js', 'utf8');
infCtrl = infCtrl.replace(/p\.Precio/g, 'p.precio_venta');
fs.writeFileSync('c:/Users/duvan/BACKEND/servidor/controllers/informeController.js', infCtrl, 'utf8');

// Patch crearDetalleOrden / ordenServicioController
let ordCtrl = fs.readFileSync('c:/Users/duvan/BACKEND/servidor/controllers/ordenServicioController.js', 'utf8');
ordCtrl = ordCtrl.replace(/producto\.Precio/g, 'producto.precio_venta');
fs.writeFileSync('c:/Users/duvan/BACKEND/servidor/controllers/ordenServicioController.js', ordCtrl, 'utf8');

// Patch frontend producto service
let pSvc = fs.readFileSync('c:/Users/duvan/FRONTEND/react/src/services/producto.service.ts', 'utf8');
pSvc = pSvc.replace(/Precio\?:/g, 'precio_venta?:').replace(/Precio:/g, 'precio_venta:');
fs.writeFileSync('c:/Users/duvan/FRONTEND/react/src/services/producto.service.ts', pSvc, 'utf8');

console.log('PATCH_OK');
