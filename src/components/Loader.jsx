import { useLayoutEffect, useRef, useState } from 'react'
import { emblemFrame } from '../three/ConstellationScene.js'

function useSize(ref) {
  const [size, setSize] = useState(null)
  useLayoutEffect(() => {
    const el = ref.current
    const mesurer = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    const ro = new ResizeObserver(mesurer)
    ro.observe(el)
    mesurer()
    return () => ro.disconnect()
  }, [ref])
  return size
}

export default function Loader({ progress, leaving, onDone }) {
  const boxRef = useRef(null)
  const size = useSize(boxRef)
  const { base, done, total, lit } = progress ?? { done: 0, total: 1, lit: new Set() }
  const part = done / total

  let ciel = null
  if (base && size?.w) {
    const { half, cx, cy } = emblemFrame(size.w, size.h, base.characters)
    const at = (n) => [cx + n.u * half, cy - n.v * half]
    const parNoeud = new Map(base.characters.map((c) => [c.node.id, c]))

    ciel = (
      <svg className="loader__sky" width={size.w} height={size.h} aria-hidden="true">
        <image
          className="loader__emblem"
          href="/img/liyue-emblem.webp"
          x={cx - half}
          y={cy - half}
          width={half * 2}
          height={half * 2}
        />
        {base.constellation.edges.map(([a, b]) => {
          const ca = parNoeud.get(a)
          const cb = parNoeud.get(b)
          if (!ca || !cb || !lit.has(ca.id) || !lit.has(cb.id)) return null
          const [x1, y1] = at(ca.node)
          const [x2, y2] = at(cb.node)
          return <line key={`${a}-${b}`} className="loader__edge" x1={x1} y1={y1} x2={x2} y2={y2} pathLength="1" />
        })}
        {base.characters.map((c) => {
          const [x, y] = at(c.node)
          const on = lit.has(c.id)
          return (
            <g key={c.id} className={`loader__star${on ? ' is-lit' : ''}`} transform={`translate(${x} ${y})`}>
              <circle r="14" className="loader__halo" style={{ fill: base.elements[c.game.vision].color }} />
              <circle r={c.game.rarity === 5 ? 3.6 : 2.8} className="loader__core" />
            </g>
          )
        })}
      </svg>
    )
  }

  return (
    <div
      className={`loader${leaving ? ' is-leaving' : ''}`}
      onAnimationEnd={(e) => { if (leaving && e.target === e.currentTarget) onDone() }}
    >
      <div className="loader__stage" ref={boxRef}>
        {ciel}
        <div className="loader__progress">
          <p className="loader__title">
            <span lang="zh-CN">璃月图鉴</span> Consultation des archives de Liyue
          </p>
          <div
            className="loader__bar"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={done}
          >
            <span style={{ transform: `scaleX(${part})` }} />
          </div>
          <p className="loader__count">{done} / {total}</p>
        </div>
      </div>
    </div>
  )
}
