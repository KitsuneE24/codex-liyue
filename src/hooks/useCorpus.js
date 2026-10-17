import { useEffect, useState } from 'react'
import { loadCorpus } from '../data/loadCorpus.js'

export default function useCorpus() {
  const [doc, setDoc] = useState(null)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(null)

  useEffect(() => {
    let alive = true
    loadCorpus((p) => alive && setProgress(p))
      .then((d) => alive && setDoc(d))
      .catch((e) => alive && setError(e))
    return () => { alive = false }
  }, [])

  return { doc, error, progress }
}
