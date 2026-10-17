import { useEffect, useRef, useState } from 'react'
import ConstellationScene from '../three/ConstellationScene.js'
import HandIcon from './HandIcon.jsx'
import { VUES } from '../data/views.js'

export default function Constellation({ doc, selectedId, onSelect, predicate }) {
  const hostRef = useRef(null)
  const sceneRef = useRef(null)
  const [courante, setCourante] = useState(VUES[1])
  const [aTourne, setATourne] = useState(false)

  useEffect(() => {
    // La scène ne prévient React que quand la vue la plus proche change,
    // pas à chaque image.
    const scene = new ConstellationScene(hostRef.current, doc, {
      onViewChange: setCourante,
      onSelect,
      onRotate: () => setATourne(true),
    })
    sceneRef.current = scene
    return () => {
      scene.dispose()
      sceneRef.current = null
    }
  }, [doc, onSelect])

  useEffect(() => {
    sceneRef.current?.setSelected(selectedId)
  }, [selectedId, doc, onSelect])

  useEffect(() => {
    sceneRef.current?.setFilter(predicate)
  }, [predicate, doc, onSelect])

  return (
    <div className="stage">
      <div className="constellation" ref={hostRef} />
      {courante.titre && (
        <h2 key={courante.cle} className="vue-titre">{courante.titre}</h2>
      )}
      <div
        className={`rotate-hint${aTourne || selectedId ? ' is-done' : ''}`}
        aria-hidden={aTourne || !!selectedId}
      >
        <div className="rotate-hint__gesture">
          <svg className="rotate-hint__arrow rotate-hint__arrow--left" viewBox="0 0 36 16">
            <path d="M34 8H3M10 1 3 8l7 7" />
          </svg>
          <div className="rotate-hint__lane">
            <HandIcon className="rotate-hint__hand" />
          </div>
          <svg className="rotate-hint__arrow rotate-hint__arrow--right" viewBox="0 0 36 16">
            <path d="M2 8h31M26 1l7 7-7 7" />
          </svg>
        </div>
        <p>Glissez vers la gauche ou la droite pour tourner autour du blason</p>
      </div>
    </div>
  )
}
