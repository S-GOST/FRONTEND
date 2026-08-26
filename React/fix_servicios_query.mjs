import fs from 'fs';

let content = fs.readFileSync('c:/Users/duvan/BACKEND/servidor/controllers/informeController.js', 'utf8');

// Fix the broken query - replace the incomplete one with the correct one
const badQuery = `let queryMasUsadosServicios = \`
            SELECT s.ID_SERVICIOS, s.nombre, SUM(dos.cantidad) as total_usado
            FROM detalles_orden_servicio dos
            WHERE os.estado = 'Finalizada'
        \``;

const goodQuery = `let queryMasUsadosServicios = \`
            SELECT s.ID_SERVICIOS, s.nombre, SUM(dos.cantidad) as total_usado
            FROM detalles_orden_servicio dos
            JOIN orden_servicio os ON dos.id_orden = os.id_orden
            JOIN servicios s ON dos.ID_SERVICIOS = s.ID_SERVICIOS
            WHERE os.estado = 'Finalizada'
        \``;

if (content.includes(badQuery)) {
    content = content.replace(badQuery, goodQuery);
    fs.writeFileSync('c:/Users/duvan/BACKEND/servidor/controllers/informeController.js', content, 'utf8');
    console.log('FIXED_QUERY');
} else {
    console.log('NOT_FOUND - dumping nearby content');
    const idx = content.indexOf('queryMasUsadosServicios');
    console.log(content.substring(idx, idx + 400));
}
