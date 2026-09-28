// Construit public/data/liyue.json à partir de l'API genshin.dev
// (instance maintenue : genshin.jmp.blue) et du fichier culture.json.
// Télécharge aussi les portraits et l'emblème dans public/img/.
//
// Lancement : npm run corpus

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'

const API = 'https://genshin.jmp.blue'
const ROOT = new URL('../', import.meta.url)
const OUT_JSON = new URL('public/data/liyue.json', ROOT)
const IMG_DIR = new URL('public/img/', ROOT)
const CHAR_DIR = new URL('public/img/characters/', ROOT)

// Couleurs des sept éléments, utilisées pour teinter les étoiles.
const ELEMENTS = {
  Anemo: { color: '#74c2a8', hanzi: '风' },
  Cryo: { color: '#9fd6e3', hanzi: '冰' },
  Dendro: { color: '#a5c83b', hanzi: '草' },
  Electro: { color: '#b08fc2', hanzi: '雷' },
  Geo: { color: '#f2b723', hanzi: '岩' },
  Hydro: { color: '#4cc2f1', hanzi: '水' },
  Pyro: { color: '#ef7938', hanzi: '火' },
}

async function getJson(path) {
  const r = await fetch(`${API}${path}`)
  if (!r.ok) throw new Error(`${path} → HTTP ${r.status}`)
  return r.json()
}

// Ne retélécharge pas une image déjà présente (passer --force pour tout refaire).
async function download(path, dest) {
  if (existsSync(dest) && !process.argv.includes('--force')) return
  const r = await fetch(`${API}${path}`)
  if (!r.ok) throw new Error(`${path} → HTTP ${r.status}`)
  await writeFile(dest, Buffer.from(await r.arrayBuffer()))
}

const culture = JSON.parse(await readFile(new URL('scripts/culture.json', ROOT), 'utf8'))

// /characters/all ne renvoie pas l'identifiant : on le reprend de /characters.
const ids = await getJson('/characters')
const all = await getJson('/characters/all')
const liyue = all
  .map((c, i) => ({ ...c, id: ids[i] }))
  .filter((c) => c.nation === 'Liyue')

// Garde-fou : si l'API change l'ordre d'une des deux listes, on le saura.
const slug = (s) => s.toLowerCase().replace(/[^a-z]+/g, '-')
const mismatch = liyue.filter((c) => slug(c.name) !== c.id)
if (mismatch.length) {
  throw new Error(`Identifiants désalignés : ${mismatch.map((c) => `${c.id}/${c.name}`).join(', ')}`)
}

const missing = liyue.filter((c) => !culture[c.id]).map((c) => c.id)
if (missing.length) {
  throw new Error(`Absents de culture.json : ${missing.join(', ')}`)
}

await mkdir(CHAR_DIR, { recursive: true })
await download('/nations/liyue/icon', new URL('liyue-emblem.webp', IMG_DIR))

const characters = []
for (const c of liyue) {
  await download(`/characters/${c.id}/icon-big`, new URL(`${c.id}.webp`, CHAR_DIR))
  characters.push({
    id: c.id,
    game: {
      name: c.name,
      title: c.title,
      vision: c.vision,
      weapon: c.weapon,
      rarity: c.rarity,
      release: c.release,
      affiliation: c.affiliation,
      constellation: c.constellation,
      description: c.description,
    },
    culture: culture[c.id],
    portrait: `/img/characters/${c.id}.webp`,
  })
  process.stdout.write('.')
}

const doc = {
  meta: {
    source: `${API} (github.com/genshindev/api)`,
    builtAt: new Date().toISOString(),
    count: characters.length,
  },
  elements: ELEMENTS,
  characters,
}

await writeFile(OUT_JSON, JSON.stringify(doc, null, 2) + '\n')
console.log(`\n${characters.length} personnages écrits dans public/data/liyue.json`)
