import { useCallback, useState } from 'react'
import Constellation from './components/Constellation.jsx'
import Sheet from './components/Sheet.jsx'
import Filters from './components/Filters.jsx'
import CharacterIndex from './components/CharacterIndex.jsx'
import useCorpus from './hooks/useCorpus.js'
import useMediaQuery from './hooks/useMediaQuery.js'
import { FILTRES_VIDES, normaliser } from './data/filters.js'

export default function App() {
  const { doc, error } = useCorpus()
  const [selectedId, setSelectedId] = useState(null)
  const [filters, setFilters] = useState(FILTRES_VIDES)
  const [panelOpen, setPanelOpen] = useState(false)
  const mobile = useMediaQuery('(max-width: 760px)')
  const close = useCallback(() => setSelectedId(null), [])

  // Un seul prédicat, passé à la scène 3D et à l'index.
  const predicate = useCallback((c) => {
    if (filters.vision && c.game.vision !== filters.vision) return false
    if (filters.weapon && c.game.weapon !== filters.weapon) return false
    if (filters.rarity && c.game.rarity !== filters.rarity) return false
    if (filters.q) {
      const q = normaliser(filters.q.trim())
      const hay = normaliser(`${c.game.name} ${c.game.title} ${c.culture.hanzi} ${c.culture.pinyin}`)
      if (!hay.includes(q)) return false
    }
    return true
  }, [filters])

  if (error) return <p className="status">Corpus introuvable : {error.message}</p>
  if (!doc) return <p className="status">Chargement…</p>

  const selected = doc.characters.find((c) => c.id === selectedId)
  const visibles = doc.characters.filter(predicate)

  const panelHidden = mobile && !panelOpen

  return (
    <>
      {mobile && (
        <button
          type="button"
          className="panel-toggle"
          aria-expanded={panelOpen}
          aria-controls="panel"
          onClick={() => setPanelOpen((o) => !o)}
        >
          <span aria-hidden="true">{panelOpen ? '×' : '☰'}</span>
          <span className="sr-only">{panelOpen ? 'Fermer les filtres' : 'Filtres et index'}</span>
        </button>
      )}
      {mobile && panelOpen && (
        <div className="panel-backdrop" onClick={() => setPanelOpen(false)} />
      )}

      <aside
        id="panel"
        className={`panel${panelOpen ? ' is-open' : ''}`}
        inert={panelHidden}
      >
        <h1 className="panel__title">
          <span lang="zh-CN">璃月图鉴</span> Codex Liyue
        </h1>
        <Filters doc={doc} filters={filters} onChange={setFilters} count={visibles.length} />
        <CharacterIndex
          characters={visibles}
          elements={doc.elements}
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId(id)
            setPanelOpen(false)
          }}
        />
      </aside>

      <Constellation
        doc={doc}
        selectedId={selectedId}
        onSelect={setSelectedId}
        predicate={predicate}
      />

      {selected && (
        <Sheet
          key={selected.id}
          character={selected}
          element={doc.elements[selected.game.vision]}
          onClose={close}
        />
      )}
    </>
  )
}
