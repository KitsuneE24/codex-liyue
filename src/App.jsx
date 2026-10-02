import { useCallback, useState } from 'react'
import Constellation from './components/Constellation.jsx'
import Sheet from './components/Sheet.jsx'
import useCorpus from './hooks/useCorpus.js'

export default function App() {
  const { doc, error } = useCorpus()
  const [selectedId, setSelectedId] = useState(null)
  const close = useCallback(() => setSelectedId(null), [])

  if (error) return <p className="status">Corpus introuvable : {error.message}</p>
  if (!doc) return <p className="status">Chargement…</p>

  const selected = doc.characters.find((c) => c.id === selectedId)

  return (
    <>
      <Constellation doc={doc} selectedId={selectedId} onSelect={setSelectedId} />
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
