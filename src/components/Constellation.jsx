import { useEffect, useRef, useState } from 'react'
import ConstellationScene from '../three/ConstellationScene.js'
import Carousel from './Carousel.jsx'
import { VUES } from '../data/views.js'

export default function Constellation({ doc, selectedId, onSelect, predicate }) {
  const hostRef = useRef(null)
  const sceneRef = useRef(null)
  const [courante, setCourante] = useState(VUES[1])

  useEffect(() => {
    // La scène ne prévient React que quand la vue la plus proche change,
    // pas à chaque image.
    const scene = new ConstellationScene(hostRef.current, doc, {
      onViewChange: setCourante,
      onSelect,
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
      {!selectedId && (
        <Carousel
          courante={courante}
          onGo={(v) => sceneRef.current?.goTo(v.deg)}
        />
      )}
    </div>
  )
}
