import { readFileSync, writeFileSync } from 'fs';

const f = 'node_modules/next/dist/server/lib/start-server.js';
let c = readFileSync(f, 'utf8');

const old = `} catch (err) {
                // fatal error if we can't setup
                handlersError();
                console.error(err);
                process.exit(1);
            }`;

const patched = `} catch (err) {
                // fatal error if we can't setup
                handlersError();
                process.stdout.write('=== FATAL STARTUP ERROR ===\\n');
                process.stdout.write(String(err && err.stack ? err.stack : String(err)) + '\\n');
                process.stdout.write('=== END FATAL STARTUP ERROR ===\\n');
                process.exit(1);
            }`;

if (c.includes(old)) {
  writeFileSync(f, c.replace(old, patched));
  console.log('start-server.js: patched OK');
} else {
  console.log('start-server.js: pattern not found (already patched or different version)');
}
