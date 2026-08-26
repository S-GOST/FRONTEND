import fs from 'fs';

// 1. Patch ComprobanteController.js
let controller = fs.readFileSync('c:/Users/duvan/BACKEND/servidor/controllers/comprobanteController.js', 'utf8');

const newFunction = `
export const buscarComprobantesFiltro = async (req, res) => {
    try {
        const idRol = req.user?.id_rol || req.admin?.id_rol;
        const idUsuario = req.user?.id_usuario || req.admin?.id_usuario;
        
        if (!idUsuario) {
            return res.status(401).json({ success: false, message: 'No autenticado' });
        }

        const { numero, cliente, fecha_inicio, fecha_fin } = req.query;

        let query = \`
            SELECT c.id_comprobante, c.id_orden, c.numero_comprobante,
                   c.fecha, c.subtotal, c.total_pagar, c.metodo_pago, c.estado,
                   u.nombre as cliente_nombre, u.documento as cliente_documento,
                   m.placa as moto_placa
            FROM comprobante c
            INNER JOIN orden_servicio os ON c.id_orden = os.id_orden
            INNER JOIN motos m ON os.id_moto = m.id_moto
            INNER JOIN usuarios u ON os.id_cliente = u.id_usuario
            WHERE 1=1
        \`;
        
        const params = [];

        // Filtro de rol
        if (idRol === 2) {
            // Tcnico solo ve los comprobantes de sus rdenes
            query += ' AND os.id_tecnico = ?';
            params.push(idUsuario);
        } else if (idRol === 3) {
            // Cliente solo ve sus motos
            query += ' AND os.id_cliente = ?';
            params.push(idUsuario);
        }

        // Filtros adicionales
        if (numero) {
            query += ' AND c.numero_comprobante LIKE ?';
            params.push(\`%\${numero}%\`);
        }
        if (cliente && idRol !== 3) { // Cliente no necesita buscar por cliente
            query += ' AND (u.nombre LIKE ? OR u.documento LIKE ?)';
            params.push(\`%\${cliente}%\`, \`%\${cliente}%\`);
        }
        if (fecha_inicio && fecha_fin) {
            query += ' AND DATE(c.fecha) BETWEEN ? AND ?';
            params.push(fecha_inicio, fecha_fin);
        }

        query += ' ORDER BY c.fecha DESC';

        const [rows] = await pool.query(query, params);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Error en buscarComprobantesFiltro:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
`;

if (!controller.includes('buscarComprobantesFiltro')) {
    controller += '\n' + newFunction;
    fs.writeFileSync('c:/Users/duvan/BACKEND/servidor/controllers/comprobanteController.js', controller, 'utf8');
    console.log('CONTROLLER_PATCHED');
} else {
    console.log('CONTROLLER_ALREADY_PATCHED');
}

// 2. Patch comprobanteRoutes.js
let routes = fs.readFileSync('c:/Users/duvan/BACKEND/servidor/routes/comprobanteRoutes.js', 'utf8');

if (!routes.includes('buscarComprobantesFiltro')) {
    routes = routes.replace('pagarComprobante\n}', 'pagarComprobante,\n    buscarComprobantesFiltro\n}');
    routes = routes.replace('pagarComprobante\r\n}', 'pagarComprobante,\n    buscarComprobantesFiltro\n}');
    
    const newRoute = `// HU-004.1 / RF-0038: Buscar comprobantes unificado
router.get('/buscar-todos', verificarToken, autorizar(1, 2, 3), buscarComprobantesFiltro);\n\n`;

    routes = routes.replace('// ==============================================', newRoute + '// ==============================================');
    fs.writeFileSync('c:/Users/duvan/BACKEND/servidor/routes/comprobanteRoutes.js', routes, 'utf8');
    console.log('ROUTES_PATCHED');
} else {
    console.log('ROUTES_ALREADY_PATCHED');
}
