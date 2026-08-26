const fs = require('fs');

let rFile = fs.readFileSync('c:/Users/duvan/BACKEND/servidor/routes/informeRoutes.js', 'utf8');

if (!rFile.includes('obtenerReporteInventario')) {
  console.log('Needs fixing');
}

// Just regex replace
rFile = rFile.replace(/obtenerProductividadTecnicos\r?\n\}/g, 'obtenerProductividadTecnicos,\n    obtenerReporteInventario\n}');
fs.writeFileSync('c:/Users/duvan/BACKEND/servidor/routes/informeRoutes.js', rFile, 'utf8');

console.log('PATCH_ROUTES_OK');
