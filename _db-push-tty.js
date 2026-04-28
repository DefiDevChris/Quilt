const { spawnSync } = require('child_process');
const path = require('path');

const result = spawnSync('node', [
  '-e', `
    process.stdin.isTTY = true;
    process.stdout.isTTY = true;
    process.stdin.setRawMode = function() {};
    const rl = require('readline');
    const origCreateInterface = rl.createInterface;
    rl.createInterface = function(opts) {
      const iface = origCreateInterface.call(this, opts);
      iface.close = iface.close || function() {};
      return iface;
    };
    process.argv = ['node', 'drizzle-kit', 'push'];
    require('/home/chrishoran/Desktop/Quilt/node_modules/drizzle-kit/bin.cjs');
  `
], {
  cwd: '/home/chrishoran/Desktop/Quilt',
  env: Object.assign({}, process.env, { DATABASE_URL: 'postgresql://quiltcorgi:localdev@localhost:5432/quiltcorgi' }),
  stdio: 'inherit',
  timeout: 30000
});
process.exit(result.status);
