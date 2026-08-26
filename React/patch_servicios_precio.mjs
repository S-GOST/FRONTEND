import fs from 'fs';
let content = fs.readFileSync('c:/Users/duvan/BACKEND/servidor/controllers/informeController.js', 'utf8');

const bad = `SELECT s.ID_SERVICIOS, s.nombre, SUM(dos.cantidad) as total_usado
            FROM detalles_orden_servicio dos`;

const good = `SELECT s.ID_SERVICIOS, s.nombre, s.Precio, SUM(dos.cantidad) as total_usado, SUM(dos.cantidad * CAST(s.Precio AS DECIMAL(10,2))) as total_generado
            FROM detalles_orden_servicio dos`;

content = content.replace(bad, good);
fs.writeFileSync('c:/Users/duvan/BACKEND/servidor/controllers/informeController.js', content, 'utf8');
console.log(content.includes('total_generado') ? 'PATCH_OK' : 'FAIL');
