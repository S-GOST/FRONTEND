import fs from 'fs';

let rFile = fs.readFileSync('c:/Users/duvan/BACKEND/servidor/routes/informeRoutes.js', 'utf8');
rFile = rFile.replace(/obtenerProductividadTecnicos\r?\n\}/g, 'obtenerProductividadTecnicos,\n    obtenerReporteInventario\n}');
fs.writeFileSync('c:/Users/duvan/BACKEND/servidor/routes/informeRoutes.js', rFile, 'utf8');

console.log('PATCH_ROUTES_OK');
