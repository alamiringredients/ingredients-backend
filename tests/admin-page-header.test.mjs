import assert from 'node:assert/strict'
import {existsSync, readdirSync, readFileSync, statSync} from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const root = path.resolve(import.meta.dirname, '..')
const sharedHeader = 'components/admin/admin-page-header.tsx'
const reachability = new Map()

function collectAdminPages(directory, pages = []) {
  for (const entry of readdirSync(directory, {withFileTypes: true})) {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) collectAdminPages(entryPath, pages)
    else if (entry.name === 'page.tsx') pages.push(path.relative(root, entryPath))
  }
  return pages
}

function resolveImport(from, specifier) {
  let base
  if (specifier.startsWith('@/')) base = path.join(root, specifier.slice(2))
  else if (specifier.startsWith('.')) base = path.resolve(path.dirname(path.join(root, from)), specifier)
  else return null

  const candidates = [base, `${base}.tsx`, `${base}.ts`, path.join(base, 'index.tsx'), path.join(base, 'index.ts')]
  const match = candidates.find(candidate => existsSync(candidate) && statSync(candidate).isFile())
  return match ? path.relative(root, match) : null
}

function reachesSharedHeader(file, seen = new Set()) {
  if (file === sharedHeader) return true
  if (seen.has(file)) return false
  if (reachability.has(file)) return reachability.get(file)
  seen.add(file)

  const source = readFileSync(path.join(root, file), 'utf8')
  const imports = [...source.matchAll(/(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g)]
    .map(match => resolveImport(file, match[1]))
    .filter(Boolean)

  const reaches = imports.some(importedFile => reachesSharedHeader(importedFile, new Set(seen)))
  reachability.set(file, reaches)
  return reaches
}

test('every admin page renders through the shared page header', () => {
  const pages = collectAdminPages(path.join(root, 'app/admin'))
  const missing = pages.filter(page => !reachesSharedHeader(page))
  assert.deepEqual(missing, [])
})
