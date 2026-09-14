import {mkdir,readFile,writeFile} from 'node:fs/promises'
import {join} from 'node:path'
import mysql from 'mysql2/promise'

const root=process.cwd()
const outputDirectory=join(root,'messages','content')

try {
  const source=await readFile(join(root,'.env'),'utf8')
  for(const line of source.split(/\r?\n/)) {
    const match=line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/)
    if(!match||process.env[match[1]]!==undefined) continue
    const raw=match[2].trim()
    process.env[match[1]]=raw.startsWith('"')&&raw.endsWith('"')?JSON.parse(raw):raw.startsWith("'")&&raw.endsWith("'")?raw.slice(1,-1):raw
  }
} catch(error) {
  if(error?.code!=='ENOENT') throw error
}

const connection=await mysql.createConnection({
  host:process.env.DB_HOST??'127.0.0.1',
  port:Number(process.env.DB_PORT??3306),
  user:process.env.DB_USERNAME??'root',
  password:process.env.DB_PASSWORD??'',
  database:process.env.DB_DATABASE,
})

try {
  const [rows]=await connection.query('SELECT source, locale, value FROM content_translations JOIN content_translation_values ON content_translation_values.translation_id = content_translations.id ORDER BY source, translation_key')
  if(!rows.length) throw new Error('No database translations found. Run migrations and the content_translations seeder before building.')
  await mkdir(outputDirectory,{recursive:true})
  for(const locale of ['en','ar','fr']) {
    const dictionary={}
    for(const row of rows) {
      if(row.locale!==locale)continue
      const source=String(row.source)
      const value=String(row.value??'').trim()
      if(source&&value) {
        if(dictionary[source]===source) delete dictionary[source]
        if(value===source&&dictionary[source]) continue
        if(dictionary[source]&&dictionary[source]!==value) throw new Error(`Conflicting ${locale.toUpperCase()} translations found for: ${source}`)
        dictionary[source]=value
      }
    }
    await writeFile(join(outputDirectory,`${locale}.json`),`${JSON.stringify(dictionary,null,2)}\n`)
  }
  console.log(`Generated locale JSON files from ${rows.length} database translation fields.`)
} finally {
  await connection.end()
}
