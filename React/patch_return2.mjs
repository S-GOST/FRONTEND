import fs from 'fs';
let content = fs.readFileSync('c:/Users/duvan/BACKEND/servidor/controllers/informeController.js', 'utf8');

// Using regex to handle whitespace variations
content = content.replace(/if\s*\(productos\.length\s*===\s*0\)\s*\{\s*return\s*res\.status\(404\)\.json\([^}]+\);\s*\}/, `if (productos.length === 0 && masUsadosServicios.length === 0) {
            return res.status(404).json({ success: false, message: 'No hay productos ni servicios registrados' });
        }`);

fs.writeFileSync('c:/Users/duvan/BACKEND/servidor/controllers/informeController.js', content, 'utf8');
console.log('PATCHED');
