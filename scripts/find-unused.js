const fs = require('fs');
const { execSync } = require('child_process');

const libFiles = execSync('find src/lib -name "*.ts" -o -name "*.tsx"').toString().trim().split('\n').filter(Boolean);

const exports = [];
for (const file of libFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(/^export\s+(?:async\s+)?(?:function|const|let|var|class)\s+(\w+)/);
    if (m) {
      exports.push({ file, name: m[1], line: i + 1 });
    }
  }
}

const unused = [];
for (const exp of exports) {
  try {
    const grepCmd = `grep -rn "\\b${exp.name}\\b" src/ --include='*.ts' --include='*.tsx'`;
    const result = execSync(grepCmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    const lines = result.trim().split('\n').filter(l => l && !l.includes(exp.file));
    const importLines = lines.filter(l => !l.match(new RegExp(`export\\s+.*\\b${exp.name}\\b`)));
    if (importLines.length === 0) {
      unused.push(exp);
    }
  } catch (e) {
    unused.push(exp);
  }
}

console.log('=== POTENTIALLY UNUSED EXPORTS ===');
for (const u of unused) {
  console.log(`${u.name} from ${u.file}:${u.line}`);
}
console.log(`Total: ${unused.length} / ${exports.length}`);
