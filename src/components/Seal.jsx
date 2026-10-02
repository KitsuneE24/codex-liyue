import { useEffect, useRef } from 'react'
import SealScene from '../three/SealScene.js'

export default function Seal({ flipped, onToggle }) {
  const hostRef = useRef(null)
  const sceneRef = useRef(null)

  useEffect(() => {
    const scene = new SealScene(hostRef.current)
    sceneRef.current = scene
    return () => {
      scene.dispose()
      sceneRef.current = null
    }
  }, [])

  useEffect(() => {
    sceneRef.current?.setFlipped(flipped)
  }, [flipped])

  const label = flipped ? 'Revenir à la fiche de jeu' : 'Révéler les racines culturelles'

  return (
    <div className="seal">
      <div className="seal__canvas" ref={hostRef} aria-hidden="true" />
      <button
        type="button"
        className="seal__hit"
        onClick={onToggle}
        aria-pressed={flipped}
        title={label}
      >
        <span className="sr-only">{label}</span>
      </button>
    </div>
  )
}
