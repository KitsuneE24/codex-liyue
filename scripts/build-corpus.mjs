// npm run corpus [-- --force]

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'

const API = 'https://genshin.jmp.blue'
const ROOT = new URL('../', import.meta.url)
const OUT_JSON = new URL('public/data/liyue.json', ROOT)
const IMG_DIR = new URL('public/img/', ROOT)
const CHAR_DIR = new URL('public/img/characters/', ROOT)

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

async function download(path, dest) {
  if (existsSync(dest) && !process.argv.includes('--force')) return
  const r = await fetch(`${API}${path}`)
  if (!r.ok) throw new Error(`${path} → HTTP ${r.status}`)
  await writeFile(dest, Buffer.from(await r.arrayBuffer()))
}

const HANZI_DATA = 'https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0'
const strokeCache = new Map()
async function strokesOf(char) {
  if (!strokeCache.has(char)) {
    const r = await fetch(`${HANZI_DATA}/${encodeURIComponent(char)}.json`)
    if (!r.ok) throw new Error(`traits de ${char} → HTTP ${r.status}`)
    strokeCache.set(char, (await r.json()).strokes.length)
  }
  return strokeCache.get(char)
}

const MMAH = 'https://cdn.jsdelivr.net/gh/skishore/makemeahanzi@master/dictionary.txt'
const dictionary = new Map(
  (await (await fetch(MMAH)).text())
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line))
    .map((e) => [e.character, e]),
)

// Clés simplifiées hors du bloc Kangxi (Unihan)
const KANGXI_SIMPLIFIED = {
  '丷': 12, '刂': 18, '王': 96, '纟': 120, '⺼': 130,
  '艹': 140, '钅': 167, '门': 169, '鸟': 196,
}
const KANGXI = new Map(
  Array.from({ length: 214 }, (_, i) => [String.fromCodePoint(0x2f00 + i).normalize('NFKC'), i + 1]),
)
const kangxiOf = (radical) => {
  const n = KANGXI.get(radical) ?? KANGXI_SIMPLIFIED[radical]
  if (!n) throw new Error(`Clé sans numéro Kangxi : ${radical}`)
  return n
}

async function cultureOf(entry) {
  const readings = entry.pinyin.split(' ')
  const hanzi = [...entry.hanzi]
  if (readings.length !== hanzi.length) {
    throw new Error(`${entry.hanzi} : ${hanzi.length} caractères pour ${readings.length} syllabes`)
  }
  const chars = []
  for (const [i, char] of hanzi.entries()) {
    const d = dictionary.get(char)
    if (!d) throw new Error(`${char} absent de Make Me a Hanzi`)
    chars.push({
      char,
      reading: readings[i],
      definition: d.definition,
      strokes: await strokesOf(char),
      radical: d.radical,
      kangxi: kangxiOf(d.radical),
      decomposition: d.decomposition,
    })
  }
  return {
    ...entry,
    chars,
    totalStrokes: chars.reduce((s, c) => s + c.strokes, 0),
  }
}

const culture = JSON.parse(await readFile(new URL('scripts/culture.json', ROOT), 'utf8'))
const layout = JSON.parse(await readFile(new URL('scripts/layout.json', ROOT), 'utf8'))

const half = layout.size / 2
const nodeOf = new Map(
  layout.nodes.map((n) => [
    n.character,
    { id: n.id, u: +((n.x - half) / half).toFixed(4), v: +((half - n.y) / half).toFixed(4) },
  ]),
)
const nodeIds = new Set(layout.nodes.map((n) => n.id))
const badEdges = layout.edges.filter(([a, b]) => !nodeIds.has(a) || !nodeIds.has(b))
if (badEdges.length) throw new Error(`Arêtes vers un nœud inconnu : ${JSON.stringify(badEdges)}`)

// /characters/all n'a pas d'identifiant
const ids = await getJson('/characters')
const all = await getJson('/characters/all')
const liyue = all
  .map((c, i) => ({ ...c, id: ids[i] }))
  .filter((c) => c.nation === 'Liyue')

const slug = (s) => s.toLowerCase().replace(/[^a-z]+/g, '-')
const mismatch = liyue.filter((c) => slug(c.name) !== c.id)
if (mismatch.length) {
  throw new Error(`Identifiants désalignés : ${mismatch.map((c) => `${c.id}/${c.name}`).join(', ')}`)
}

const missing = liyue.filter((c) => !culture[c.id]).map((c) => c.id)
if (missing.length) {
  throw new Error(`Absents de culture.json : ${missing.join(', ')}`)
}
const unplaced = liyue.filter((c) => !nodeOf.has(c.id)).map((c) => c.id)
if (unplaced.length) {
  throw new Error(`Sans ancrage dans layout.json : ${unplaced.join(', ')}`)
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
    culture: await cultureOf(culture[c.id]),
    node: nodeOf.get(c.id),
    portrait: `/img/characters/${c.id}.webp`,
  })
  process.stdout.write('.')
}

const doc = {
  meta: {
    source: `${API} (github.com/genshindev/api)`,
    strokes: `${HANZI_DATA} (Make Me a Hanzi)`,
    characters: `${MMAH} (Make Me a Hanzi : sens, clé, décomposition)`,
    builtAt: new Date().toISOString(),
    count: characters.length,
  },
  elements: ELEMENTS,
  constellation: { edges: layout.edges },
  characters,
}

await writeFile(OUT_JSON, JSON.stringify(doc, null, 2) + '\n')
console.log(`\n${characters.length} personnages écrits dans public/data/liyue.json`)
