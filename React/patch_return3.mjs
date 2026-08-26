import fs from 'fs';
let content = fs.readFileSync('c:/Users/duvan/BACKEND/servidor/controllers/informeController.js', 'utf8');

const bad = `        if (productos.length === 0) {
            return res.status(404).json({ success: false, message: 'No hay productos registrados' });
        }`;

const good = `        if (productos.length === 0 && masUsadosServicios.length === 0) {
            return res.status(404).json({ success: false, message: 'No hay datos registrados' });
        }`;

content = content.replace(bad, good);

fs.writeFileSync('c:/Users/duvan/BACKEND/servidor/controllers/informeController.js', content, 'utf8');
console.log(content.includes(good) ? 'PATCH_SUCCESS' : 'PATCH_FAIL');
