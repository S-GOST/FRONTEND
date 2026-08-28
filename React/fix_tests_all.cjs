const fs = require("fs");
const path = require("path");

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(filePath));
    } else {
      if (filePath.endsWith('.test.tsx') || filePath.endsWith('.test.ts')) {
        results.push(filePath);
      }
    }
  });
  return results;
}

const testFiles = walkDir("tests");
for (const file of testFiles) {
  let code = fs.readFileSync(file, "utf-8");
  let modified = false;

  // Replace import { Mock } from 'vitest';
  if (code.includes("import { Mock } from 'vitest';")) {
    code = code.replace(/import\s*\{\s*Mock\s*\}\s*from\s*'vitest';\s*\r?\n/, "");
    modified = true;
  }

  // Replace Mock( with vi.mock(
  if (code.includes("Mock(")) {
    code = code.replace(/^Mock\(/gm, "vi.mock(");
    modified = true;
  }

  // Fix ProductoPayload missing fields
  if (file.includes('producto.service.test')) {
    code = code.replace(/precio_venta: 150000,\r?\n\s*Estado: 'Activo'/g, "precio_venta: 150000,\n      Estado: 'Activo',\n      precio_costo: 100000,\n      stock: 10,\n      stock_minimo: 5");
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(file, code);
    console.log(`Fixed Mock in ${file}`);
  }
}
