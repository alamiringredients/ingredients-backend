import { readFileSync, writeFileSync } from 'fs';

// Patch 1: start-server.js fatal catch - replace console.error with stdout
{
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
}

// Patch 2: instrumentation-globals.external.js - log to stdout before re-throw
{
  const f = 'node_modules/next/dist/server/lib/router-utils/instrumentation-globals.external.js';
  let c = readFileSync(f, 'utf8');

  const old = `        } catch (err) {
            err.message = \`An error occurred while loading instrumentation hook: \${err.message}\`;
            throw err;
        }`;

  const patched = `        } catch (err) {
            err.message = \`An error occurred while loading instrumentation hook: \${err.message}\`;
            process.stdout.write('=== INSTRUMENTATION HOOK ERROR ===\\n');
            process.stdout.write(String(err && err.stack ? err.stack : String(err)) + '\\n');
            process.stdout.write('=== END INSTRUMENTATION HOOK ERROR ===\\n');
            throw err;
        }`;

  if (c.includes(old)) {
    writeFileSync(f, c.replace(old, patched));
    console.log('instrumentation-globals.external.js: patched OK');
  } else {
    console.log('instrumentation-globals.external.js: pattern not found (already patched or different version)');
  }
}
