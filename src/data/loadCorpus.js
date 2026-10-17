const API = 'https://genshin.jmp.blue'
const STROKES = 'https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0'
const TIMEOUT = 5000
const GAME = ['name', 'title', 'vision', 'weapon', 'rarity', 'release', 'affiliation', 'constellation', 'description']

async function getJson(url, signal) {
  const r = await fetch(url, { signal })
  if (!r.ok) throw new Error(`${url} → HTTP ${r.status}`)
  return r.json()
}

const valeur = (res) => (res.status === 'fulfilled' ? res.value : null)

export async function loadCorpus() {
  const doc = await getJson('/data/liyue.json')

  const signal = AbortSignal.timeout(TIMEOUT)
  const hanzi = [...new Set(doc.characters.flatMap((c) => c.culture.chars.map((ch) => ch.char)))]
  const [games, traits] = await Promise.all([
    Promise.allSettled(doc.characters.map((c) => getJson(`${API}/characters/${c.id}`, signal))),
    Promise.allSettled(hanzi.map((ch) => getJson(`${STROKES}/${encodeURIComponent(ch)}.json`, signal))),
  ])

  const strokesOf = new Map(
    hanzi.map((ch, i) => [ch, valeur(traits[i])?.strokes?.length]),
  )

  const characters = doc.characters.map((c, i) => {
    const api = valeur(games[i])
    const game = api && doc.elements[api.vision]
      ? Object.fromEntries(GAME.map((k) => [k, api[k] ?? c.game[k]]))
      : c.game
    const chars = c.culture.chars.map((ch) => ({ ...ch, strokes: strokesOf.get(ch.char) || ch.strokes }))
    return {
      ...c,
      game,
      culture: { ...c.culture, chars, totalStrokes: chars.reduce((s, ch) => s + ch.strokes, 0) },
    }
  })

  const all = [...games, ...traits]
  const ok = all.filter((r) => r.status === 'fulfilled').length
  const live = ok === all.length ? 'direct' : ok ? 'partiel' : 'local'

  return { ...doc, characters, live }
}
