import { useEffect, useState } from 'react'
export default function App() {
  const [doc, setDoc] = useState(null)
  useEffect(() => {
    fetch('/data/liyue.json')
    .then((r) => r.json())
    .then(setDoc)
  }, [])
  if (!doc) return <p>Chargement…</p>
  return <p>{doc.characters.length} personnages chargés</p>
}