import fs from 'fs';
const path = 'c:/Users/duvan/FRONTEND/react/src/routes/AppRoutes.tsx';
let content = fs.readFileSync(path, 'utf8');

// fix the block
const badBlock = `          <Route path="historial" element={<Tablehistorial />} />
          <Route path="productividad" element={<Productividad />} />
          <Route path="ordenes" element={<TecnicoOrdenes />} />
          <Route path="inventario" element={<ReporteInventario />} />
          <Route path="*" element={<Navigate to="/tecnico/dashboard" replace />} />
        </Route>`;
const goodBlock = `          <Route path="historial" element={<Tablehistorial />} />
          <Route path="productividad" element={<Productividad />} />
          <Route path="inventario" element={<ReporteInventario />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>`;

if (content.includes(badBlock)) {
  content = content.replace(badBlock, goodBlock);
  console.log('Fixed admin block');
}

// fix tecnico routes
const regex = /(<Route path="\/tecnico\/informes" element={<Tableinforme \/>} \/>)/;
if (regex.test(content) && !content.includes('/tecnico/inventario')) {
  content = content.replace(regex, `$1\n            <Route path="/tecnico/inventario" element={<ReporteInventario />} />`);
  console.log('Added tecnico/inventario route');
}

fs.writeFileSync(path, content, 'utf8');
console.log('DONE');
