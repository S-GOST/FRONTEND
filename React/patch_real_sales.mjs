import fs from 'fs';
let content = fs.readFileSync('c:/Users/duvan/BACKEND/servidor/controllers/informeController.js', 'utf8');

const badBlock = `        // 3. Procesar alertas y totales
        let total_venta = 0;
        let total_costo = 0;
        const alertas_stock = [];

        const inventarioProcesado = productos.map(p => {
            const valVenta = Number(p.stock) * Number(p.precio_venta);
            const valCosto = Number(p.stock) * Number(p.precio_costo);
            
            total_venta += valVenta;
            total_costo += valCosto;`;

const newBlock = `        // 3. Obtener Ventas y Costos Reales
        let queryVentasProd = \`
            SELECT SUM(dos.cantidad * p.precio_venta) as total_venta_prod,
                   SUM(dos.cantidad * p.precio_costo) as total_costo_prod
            FROM detalles_orden_servicio dos
            JOIN orden_servicio os ON dos.id_orden = os.id_orden
            JOIN productos p ON dos.ID_PRODUCTOS = p.ID_PRODUCTOS
            WHERE os.estado = 'Finalizada'
        \`;
        let queryVentasServ = \`
            SELECT SUM(dos.cantidad * CAST(s.Precio AS DECIMAL(10,2))) as total_venta_serv
            FROM detalles_orden_servicio dos
            JOIN orden_servicio os ON dos.id_orden = os.id_orden
            JOIN servicios s ON dos.ID_SERVICIOS = s.ID_SERVICIOS
            WHERE os.estado = 'Finalizada'
        \`;
        
        let paramVentas = [];
        if (fecha_inicio && fecha_fin) {
            queryVentasProd += ' AND DATE(os.fecha_salida) BETWEEN ? AND ?';
            queryVentasServ += ' AND DATE(os.fecha_salida) BETWEEN ? AND ?';
            paramVentas.push(fecha_inicio, fecha_fin);
        }
        if (categoria) {
            // Esto solo filtrará por categoría de producto o servicio dependiendo de la query
            // Para simplificar, si hay filtro de categoría, se aplica a ambas, si una no tiene datos, retorna null
            queryVentasProd += ' AND p.ID_CATEGORIA = ?';
            queryVentasServ += ' AND s.id_categoria = ?';
            paramVentas.push(categoria);
        }
        
        const [ventasProd] = await pool.query(queryVentasProd, paramVentas);
        const [ventasServ] = await pool.query(queryVentasServ, paramVentas);

        let total_venta = (Number(ventasProd[0]?.total_venta_prod) || 0) + (Number(ventasServ[0]?.total_venta_serv) || 0);
        let total_costo = Number(ventasProd[0]?.total_costo_prod) || 0;

        // 4. Procesar alertas
        const alertas_stock = [];

        const inventarioProcesado = productos.map(p => {
            const valVenta = Number(p.stock) * Number(p.precio_venta);
            const valCosto = Number(p.stock) * Number(p.precio_costo);`;

content = content.replace(badBlock, newBlock);
fs.writeFileSync('c:/Users/duvan/BACKEND/servidor/controllers/informeController.js', content, 'utf8');
console.log(content.includes('queryVentasProd') ? 'PATCH_SUCCESS' : 'PATCH_FAIL');
