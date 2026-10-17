import { ARMES } from '../data/labels.js'
import { FILTRES_VIDES } from '../data/filters.js'

export default function Filters({ doc, filters, onChange, count, searchRef }) {
  const set = (patch) => onChange({ ...filters, ...patch })
  const visions = [...new Set(doc.characters.map((c) => c.game.vision))].sort()
  const armes = [...new Set(doc.characters.map((c) => c.game.weapon))].sort()
  const actif = Boolean(filters.vision || filters.weapon || filters.rarity || filters.q)

  return (
    <form className="filters" role="search" onSubmit={(e) => e.preventDefault()}>
      <label className="filters__field filters__field--wide">
        <span>Rechercher</span>
        <input
          ref={searchRef}
          type="search"
          value={filters.q}
          placeholder="nom, 汉字 ou pinyin"
          onChange={(e) => set({ q: e.target.value })}
        />
      </label>

      <label className="filters__field">
        <span>Vision</span>
        <select value={filters.vision} onChange={(e) => set({ vision: e.target.value })}>
          <option value="">Toutes</option>
          {visions.map((v) => (
            <option key={v} value={v}>{v} {doc.elements[v].hanzi}</option>
          ))}
        </select>
      </label>

      <label className="filters__field">
        <span>Arme</span>
        <select value={filters.weapon} onChange={(e) => set({ weapon: e.target.value })}>
          <option value="">Toutes</option>
          {armes.map((w) => (
            <option key={w} value={w}>{ARMES[w] ?? w}</option>
          ))}
        </select>
      </label>

      <label className="filters__field">
        <span>Rareté</span>
        <select
          value={filters.rarity}
          onChange={(e) => set({ rarity: Number(e.target.value) })}
        >
          <option value={0}>Toutes</option>
          <option value={5}>★★★★★</option>
          <option value={4}>★★★★</option>
        </select>
      </label>

      <p className="filters__count" aria-live="polite">
        {count} / {doc.characters.length} personnages
        {actif && (
          <button type="button" className="filters__reset" onClick={() => onChange(FILTRES_VIDES)}>
            Réinitialiser
          </button>
        )}
      </p>
    </form>
  )
}
