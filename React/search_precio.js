const fs = require('fs');
const path = require('path');

function search(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory() && file !== 'node_modules') {
      search(full);
    } else if (file.endsWith('.js') || file.endsWith('.ts')) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.toLowerCase().includes('precio')) {
        console.log(full);
      }
    }
  }
}
search('c:/Users/duvan/BACKEND/servidor');
