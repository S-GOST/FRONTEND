import fs from 'fs';

let content = fs.readFileSync('c:/Users/duvan/BACKEND/servidor/controllers/informeController.js', 'utf8');

content = content.replace(`        if (productos.length === 0) {
              return res.status(404).json({ success: false, message: 'No hay productos registrados' });
          }`, `        // if (productos.length === 0) { ... } // Removed to allow service-only queries`);

fs.writeFileSync('c:/Users/duvan/BACKEND/servidor/controllers/informeController.js', content, 'utf8');
console.log('PATCH_OK');
