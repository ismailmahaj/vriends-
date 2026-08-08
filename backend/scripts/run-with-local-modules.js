/**
 * Contourne un node_modules root-owned en local en priorisant ./local_modules/node_modules.
 * En prod (Railway), node_modules standard est utilisé.
 */
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const backendRoot = path.join(__dirname, '..');
const localNm = path.join(backendRoot, 'local_modules', 'node_modules');
const standardNm = path.join(backendRoot, 'node_modules');

const paths = [];
if (fs.existsSync(localNm)) paths.push(localNm);
if (fs.existsSync(standardNm)) paths.push(standardNm);
if (process.env.NODE_PATH) paths.push(process.env.NODE_PATH);

process.env.NODE_PATH = paths.join(path.delimiter);
require('module').Module._initPaths();

const args = process.argv.slice(2);
if (!args.length) {
  console.error('Usage: node scripts/run-with-local-modules.js <cmd> [...args]');
  process.exit(1);
}

const [cmd, ...cmdArgs] = args;
const resolvedCmd = fs.existsSync(path.join(localNm, '.bin', cmd))
  ? path.join(localNm, '.bin', cmd)
  : fs.existsSync(path.join(standardNm, '.bin', cmd))
    ? path.join(standardNm, '.bin', cmd)
    : cmd;

const child = spawn(resolvedCmd, cmdArgs, {
  stdio: 'inherit',
  cwd: backendRoot,
  env: process.env,
  shell: process.platform === 'win32',
});

child.on('exit', (code) => process.exit(code ?? 0));
