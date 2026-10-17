import { useEffect, useState } from 'react'
import Seal from './Seal.jsx'
import HandIcon from './HandIcon.jsx'
import { ARMES } from '../data/labels.js'

const IDS = /[⿰-⿻？?]/gu

function composants(decomposition) {
  if (!decomposition) return null
  const parts = [...decomposition.replace(IDS, '')]
  return parts.length > 1 ? parts.join(' + ') : null
}

const kangxiChar = (n) => String.fromCodePoint(0x2f00 + n - 1).normalize('NFKC')

const dateFr = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

function GameSide({ c, element }) {
  const g = c.game
  return (
    <>
      <header className="sheet__head">
        <img className="sheet__portrait" src={c.portrait} alt="" width="96" height="96" />
        <div>
          <h2 className="sheet__name">{g.name}</h2>
          <p className="sheet__title">{g.title}</p>
          <p className="sheet__hanzi" lang="zh-CN">
            {c.culture.hanzi} <span>{c.culture.pinyin}</span>
          </p>
        </div>
      </header>

      <dl className="sheet__facts">
        <dt>Vision</dt>
        <dd>
          <span className="sheet__dot" style={{ background: element.color }} />
          {g.vision} <span lang="zh-CN">{element.hanzi}</span>
        </dd>
        <dt>Arme</dt>
        <dd>{ARMES[g.weapon] ?? g.weapon}</dd>
        <dt>Rareté</dt>
        <dd aria-label={`${g.rarity} étoiles`}>{'★'.repeat(g.rarity)}</dd>
        <dt>Sortie</dt>
        <dd>{dateFr(g.release)}</dd>
        <dt>Affiliation</dt>
        <dd>{g.affiliation}</dd>
        <dt>Constellation</dt>
        <dd>{g.constellation}</dd>
      </dl>

      <p className="sheet__desc" lang="en">{g.description}</p>
    </>
  )
}

function CultureSide({ c }) {
  const cu = c.culture
  return (
    <>
      <header className="sheet__culture-head">
        <p className="sheet__big" lang="zh-CN">{cu.hanzi}</p>
        <p className="sheet__pinyin">{cu.pinyin} · {cu.totalStrokes} traits</p>
      </header>

      <ol className="sheet__chars">
        {cu.chars.map((ch, i) => {
          const comp = composants(ch.decomposition)
          return (
            <li key={i} className="sheet__char">
              <span className="sheet__glyph" lang="zh-CN">{ch.char}</span>
              <dl className="sheet__facts">
                <dt>Lecture</dt>
                <dd>{ch.reading}</dd>
                <dt>Sens</dt>
                <dd lang="en">{ch.definition}</dd>
                <dt>Traits</dt>
                <dd>{ch.strokes}</dd>
                <dt>Clé</dt>
                <dd>
                  <span lang="zh-CN">{ch.radical}</span>
                  {kangxiChar(ch.kangxi) !== ch.radical && (
                    <span lang="zh-CN"> ({kangxiChar(ch.kangxi)})</span>
                  )}
                  {' '}· Kangxi n° {ch.kangxi}
                </dd>
                {comp && (
                  <>
                    <dt>Composants</dt>
                    <dd lang="zh-CN">{comp}</dd>
                  </>
                )}
              </dl>
            </li>
          )
        })}
      </ol>

      <p className="sheet__source">Données : Make Me a Hanzi, hanzi-writer-data, Unihan.</p>
    </>
  )
}

function CloseButton({ onClose }) {
  return (
    <button type="button" className="sheet__close" onClick={onClose}>
      <span aria-hidden="true">×</span>
      <span className="sr-only">Fermer la fiche</span>
    </button>
  )
}

let sealSeen = false

export default function Sheet({ character, element, onClose }) {
  const [flipped, setFlipped] = useState(false)
  const [hint, setHint] = useState(() => !sealSeen)

  const toggle = () => {
    setFlipped((f) => !f)
    sealSeen = true
    setHint(false)
  }

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <aside
      className={`sheet${flipped ? ' is-flipped' : ''}`}
      aria-label={`Fiche de ${character.game.name}`}
    >
      <div className="sheet__lift">
        <div className="sheet__flip">
          <section className="sheet__side sheet__side--front" inert={flipped}>
            <div className="sheet__scroll">
              <GameSide c={character} element={element} />
            </div>
            <CloseButton onClose={onClose} />
          </section>
          <section className="sheet__side sheet__side--back" inert={!flipped}>
            <div className="sheet__scroll">
              <CultureSide c={character} />
            </div>
            <CloseButton onClose={onClose} />
          </section>
        </div>
      </div>

      <Seal flipped={flipped} onToggle={toggle} />
      {hint && (
        <div className="seal-hint" aria-hidden="true">
          <span className="seal-hint__ripple" />
          <HandIcon className="seal-hint__hand" />
        </div>
      )}
    </aside>
  )
}
