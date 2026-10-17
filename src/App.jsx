import { useCallback, useEffect, useRef, useState } from 'react'
import Constellation from './components/Constellation.jsx'
import Sheet from './components/Sheet.jsx'
import Filters from './components/Filters.jsx'
import CharacterIndex from './components/CharacterIndex.jsx'
import Loader from './components/Loader.jsx'
import useCorpus from './hooks/useCorpus.js'
import useMediaQuery from './hooks/useMediaQuery.js'
import { FILTRES_VIDES, normaliser } from './data/filters.js'

const SOURCES = {
  direct: 'Données en direct : genshin.jmp.blue · hanzi-writer-data',
  partiel: 'Données en partie en direct, complétées par la copie locale',
  local: 'API indisponible : copie locale des données',
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M15.5 15.5 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export default function App() {
  const { doc, error, progress } = useCorpus()
  const [loaderGone, setLoaderGone] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [filters, setFilters] = useState(FILTRES_VIDES)
  const [panelOpen, setPanelOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(true)
  const mobile = useMediaQuery('(max-width: 760px)')
  const searchRef = useRef(null)
  const close = useCallback(() => setSelectedId(null), [])
  const select = useCallback((id) => {
    setSelectedId(id)
    setPanelOpen(false)
    if (id) setCollapsed(true)
  }, [])

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

  useEffect(() => {
    if (mobile || collapsed) return
    const replier = (e) => {
      if (e.type === 'keydown' ? e.key === 'Escape' : !e.target.closest('#panel')) {
        setCollapsed(true)
      }
    }
    document.addEventListener('pointerdown', replier)
    document.addEventListener('keydown', replier)
    return () => {
      document.removeEventListener('pointerdown', replier)
      document.removeEventListener('keydown', replier)
    }
  }, [mobile, collapsed])

  if (error) return <p className="status">Corpus introuvable : {error.message}</p>
  if (!doc) return <><Loader key="loader" progress={progress} /></>

  const selected = doc.characters.find((c) => c.id === selectedId)
  const visibles = doc.characters.filter(predicate)

  const rail = !mobile && collapsed
  const filtered = visibles.length < doc.characters.length

  return (
    <>
      {mobile && (
        <button
          type="button"
          className="panel-toggle"
          aria-expanded={panelOpen}
          aria-controls="panel"
          onClick={() => {
            setPanelOpen((o) => !o)
            if (!panelOpen) requestAnimationFrame(() => searchRef.current?.focus({ preventScroll: true }))
          }}
        >
          {panelOpen ? <span aria-hidden="true">×</span> : <SearchIcon />}
          <span className="sr-only">{panelOpen ? 'Fermer la recherche' : 'Rechercher et filtrer'}</span>
        </button>
      )}
      {mobile && panelOpen && (
        <div className="panel-backdrop" onClick={() => setPanelOpen(false)} />
      )}

      <aside
        id="panel"
        className={`panel${panelOpen ? ' is-open' : ''}${rail ? ' is-rail' : ''}`}
        inert={mobile && !panelOpen}
      >
        <h1 className="panel__title">
          <span lang="zh-CN">璃月图鉴</span> Codex Liyue
        </h1>
        {rail && (
          <button
            type="button"
            className="panel__search"
            title="Rechercher et filtrer"
            onClick={() => {
              setCollapsed(false)
              requestAnimationFrame(() => searchRef.current?.focus({ preventScroll: true }))
            }}
          >
            <SearchIcon />
            {filtered && <span className="panel__badge" />}
            <span className="sr-only">Rechercher et filtrer</span>
          </button>
        )}
        <Filters
          doc={doc}
          filters={filters}
          onChange={setFilters}
          count={visibles.length}
          searchRef={searchRef}
        />
        <CharacterIndex
          characters={visibles}
          selectedId={selectedId}
          compact={rail}
          onSelect={select}
        />
      </aside>

      <Constellation
        doc={doc}
        selectedId={selectedId}
        onSelect={select}
        predicate={predicate}
      />

      <p className={`source source--${doc.live}`}>{SOURCES[doc.live]}</p>

      {selected && (
        <Sheet
          key={selected.id}
          character={selected}
          element={doc.elements[selected.game.vision]}
          onClose={close}
        />
      )}

      {!loaderGone && (
        <Loader key="loader" progress={progress} leaving onDone={() => setLoaderGone(true)} />
      )}
    </>
  )
}
