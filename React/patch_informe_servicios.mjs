const fs = require('fs');

let rFile = fs.readFileSync('c:/Users/duvan/BACKEND/servidor/controllers/informeController.js', 'utf8');

const queryServiciosStr = `
        // 2b. Obtener servicios mas utilizados
        let queryMasUsadosServicios = \`
            SELECT s.ID_SERVICIOS, s.nombre, SUM(dos.cantidad) as total_usado
            FROM detalles_orden_servicio dos
            JOIN orden_servicio os ON dos.id_orden = os.id_orden
            JOIN servicios s ON dos.ID_SERVICIOS = s.ID_SERVICIOS
            WHERE os.estado = 'Finalizada'
        \`;
        let paramsMasUsadosServicios = [];
        if (fecha_inicio && fecha_fin) {
            queryMasUsadosServicios += ' AND DATE(os.fecha_salida) BETWEEN ? AND ?';
            paramsMasUsadosServicios.push(fecha_inicio, fecha_fin);
        }
        if (categoria) {
            queryMasUsadosServicios += ' AND s.id_categoria = ?';
            paramsMasUsadosServicios.push(categoria);
        }
        queryMasUsadosServicios += ' GROUP BY s.ID_SERVICIOS ORDER BY total_usado DESC LIMIT 10';
        const [masUsadosServicios] = await pool.query(queryMasUsadosServicios, paramsMasUsadosServicios);
`;

if (!rFile.includes('queryMasUsadosServicios')) {
    rFile = rFile.replace('if (productos.length === 0) {', `${queryServiciosStr}\n        if (productos.length === 0) {`);
}

rFile = rFile.replace('masUsados,', 'masUsados,\n                masUsadosServicios,');

fs.writeFileSync('c:/Users/duvan/BACKEND/servidor/controllers/informeController.js', rFile, 'utf8');

console.log('PATCH_BACKEND_OK');
