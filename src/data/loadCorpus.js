// Charge le corpus local construit par `npm run corpus`.
export async function loadCorpus() {
  const r = await fetch('/data/liyue.json')
  if (!r.ok) throw new Error(`liyue.json → HTTP ${r.status}`)
  return r.json()
}
