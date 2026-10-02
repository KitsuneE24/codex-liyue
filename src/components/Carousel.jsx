import { VUES } from '../data/views.js'

export default function Carousel({ courante, onGo }) {
  const i = VUES.findIndex((v) => v.cle === courante.cle)
  const boutons = VUES.filter((_, j) => Math.abs(j - i) === 1)

  return (
    <nav className="carousel" aria-label="Changer de vue">
      {boutons.map((v) => {
        const versDroite = v.deg > courante.deg
        return (
          <button
            key={v.cle}
            type="button"
            className={`carousel__btn carousel__btn--${versDroite ? 'droite' : 'gauche'}`}
            onClick={() => onGo(v)}
          >
            {!versDroite && <span aria-hidden="true">←</span>}
            {v.label}
            {versDroite && <span aria-hidden="true">→</span>}
          </button>
        )
      })}
    </nav>
  )
}
