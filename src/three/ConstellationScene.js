import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { vueProche } from '../data/views.js'

const EMBLEM = 7.4 // demi-côté du blason
const Z_EMBLEM = -7.0 // profondeur du blason
const Z_NEAR = 7.0 // profondeur max des étoiles
const Z_FAR = -6.0 // profondeur min des étoiles
const CAM_D = 17.0 // distance caméra
const AXIS_Y = -6.2 // hauteur des axes gradués
const FOCUS_D = 10 // distance caméra en sélection
const SHEET_PX = 448 // largeur de la fiche (index.css)
const OMEGA = 5 // raideur des ressorts
const TITLE_PX = 72 // hauteur du titre de vue
const D_SIDE = 400 // distance caméra de profil
const DEG = Math.PI / 180
const ORIGIN = new THREE.Vector3()

function starTexture() {
  const s = 256
  const cv = document.createElement('canvas')
  cv.width = cv.height = s
  const ctx = cv.getContext('2d')
  const c = s / 2

  const spike = (angle, len, width) => {
    ctx.save()
    ctx.translate(c, c)
    ctx.rotate(angle)
    ctx.scale(len, width)
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, c)
    g.addColorStop(0, 'rgba(255,255,255,.95)')
    g.addColorStop(0.12, 'rgba(255,255,255,.45)')
    g.addColorStop(0.45, 'rgba(255,255,255,.09)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(-c, -c, s, s)
    ctx.restore()
  }

  spike(0, 1, 0.055)
  spike(Math.PI / 2, 1, 0.042)
  spike(Math.PI / 4, 0.34, 0.03)
  spike(-Math.PI / 4, 0.34, 0.03)

  const g = ctx.createRadialGradient(c, c, 0, c, c, c * 0.16)
  g.addColorStop(0, '#fff')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, s, s)

  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function glowTexture() {
  const s = 256
  const cv = document.createElement('canvas')
  cv.width = cv.height = s
  const ctx = cv.getContext('2d')
  const c = s / 2
  const g = ctx.createRadialGradient(c, c, 0, c, c, c)
  g.addColorStop(0, 'rgba(255,255,255,.9)')
  g.addColorStop(0.15, 'rgba(255,255,255,.45)')
  g.addColorStop(0.5, 'rgba(255,255,255,.08)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, s, s)
  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

// Fond animé
const BACKDROP_VERTEX = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.9999, 1.0);
}
`

const BACKDROP_FRAGMENT = `
uniform float uTime;
uniform float uAspect;
uniform vec3 uTint;
varying vec2 vUv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(17.0, 9.0);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 p = vec2(vUv.x * uAspect, vUv.y);
  float t = uTime * 0.015;
  vec2 q = vec2(fbm(p * 1.4 + vec2(t, 0.0)), fbm(p * 1.4 + vec2(5.2, 1.3) - vec2(0.0, t)));
  float haze = smoothstep(0.35, 0.85, fbm(p * 1.8 + 2.0 * q + vec2(t * 0.6, t * 0.3)));
  float wisps = smoothstep(0.55, 0.9, fbm(p * 3.5 + 3.0 * q - vec2(t * 1.4, 0.0)));

  vec2 d = vUv - 0.5;
  d.x *= uAspect;
  float r = length(d);
  float light = (0.55 + 0.45 * (1.0 - smoothstep(0.5, 1.2, r))) * mix(0.45, 1.0, smoothstep(0.1, 0.5, r));

  vec3 col = vec3(0.035, 0.028, 0.025);
  col += uTint * 0.42 * haze * light;
  col += mix(uTint, vec3(1.0), 0.35) * 0.22 * wisps * light;

  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    float y = fract(fi * 0.371 + uTime * (0.006 + 0.004 * fract(fi * 0.7)));
    vec2 c = vec2(fract(sin(fi * 12.9) * 43.7) * uAspect + 0.05 * sin(uTime * 0.2 + fi), y);
    float rad = 0.025 + 0.035 * fract(fi * 0.53);
    float orb = 1.0 - smoothstep(rad * 0.5, rad, length(p - c));
    col += uTint * orb * 0.16 * sin(y * 3.14159);
  }

  gl_FragColor = vec4(col, 1.0);
}
`

// Feuille de ginkgo
function leafTexture() {
  const s = 256
  const c = s / 2
  const by = 220
  const R = 136
  const A = 1.05
  const cv = document.createElement('canvas')
  cv.width = cv.height = s
  const ctx = cv.getContext('2d')
  const at = (a, r) => [c + Math.sin(a) * r, by - Math.cos(a) * r]

  const fan = new Path2D()
  fan.moveTo(c, by)
  fan.quadraticCurveTo(...at(-A * 0.75, R * 0.45), ...at(-A, R))
  fan.arc(c, by, R, -Math.PI / 2 - A, -Math.PI / 2 - 0.05)
  fan.lineTo(...at(0, R * 0.93))
  fan.lineTo(...at(0.05, R))
  fan.arc(c, by, R, -Math.PI / 2 + 0.05, -Math.PI / 2 + A)
  fan.quadraticCurveTo(...at(A * 0.75, R * 0.45), c, by)
  fan.closePath()

  ctx.save()
  ctx.clip(fan)
  const fill = ctx.createRadialGradient(c, by, 0, c, by, R)
  fill.addColorStop(0, '#ec8a26')
  fill.addColorStop(0.4, '#f3a733')
  fill.addColorStop(0.75, '#f8c947')
  fill.addColorStop(1, '#fbd65a')
  ctx.fillStyle = fill
  ctx.fillRect(0, 0, s, s)

  const side = ctx.createLinearGradient(0, 0, s, 0)
  side.addColorStop(0, 'rgba(236,138,38,0)')
  side.addColorStop(1, 'rgba(236,138,38,.35)')
  ctx.fillStyle = side
  ctx.fillRect(0, 0, s, s)

  ctx.strokeStyle = 'rgba(255,240,190,.16)'
  ctx.lineWidth = 3
  for (let a = -A + 0.15; a < A; a += 0.26) {
    ctx.beginPath()
    ctx.moveTo(...at(a, R * 0.3))
    ctx.lineTo(...at(a, R * 0.92))
    ctx.stroke()
  }

  for (let i = 0; i < 1400; i++) {
    ctx.fillStyle = Math.random() < 0.6 ? 'rgba(150,70,15,.18)' : 'rgba(255,245,210,.2)'
    ctx.fillRect(Math.random() * s, Math.random() * s, 1.6, 1.6)
  }
  ctx.restore()

  ctx.strokeStyle = 'rgba(255,238,190,.7)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(c, by)
  ctx.quadraticCurveTo(...at(-A * 0.75, R * 0.45), ...at(-A, R))
  ctx.stroke()

  ctx.strokeStyle = '#6b2f0e'
  ctx.lineCap = 'round'
  ctx.lineWidth = 2.2
  for (const a of [-0.97, -0.82, -0.66, -0.5, -0.33, 0.31, 0.48, 0.64, 0.8, 0.96]) {
    ctx.beginPath()
    ctx.moveTo(...at(a, R * 0.99))
    ctx.lineTo(...at(a, R * (0.9 + 0.03 * Math.sin(a * 7))))
    ctx.stroke()
  }

  ctx.fillStyle = '#4a200a'
  for (const [a0, a1] of [[-0.07, -0.16], [0.08, 0.15]]) {
    const [x0, y0] = at(a0, R * 0.4)
    const [x1, y1] = at(a1, R * 0.86)
    const nx = (y1 - y0) * 0.09
    const ny = (x0 - x1) * 0.09
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.quadraticCurveTo((x0 + x1) / 2 + nx, (y0 + y1) / 2 + ny, x1, y1)
    ctx.quadraticCurveTo((x0 + x1) / 2 - nx, (y0 + y1) / 2 - ny, x0, y0)
    ctx.fill()
  }

  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

function labelTexture(text) {
  const font = '600 34px Inter, sans-serif'
  const cv = document.createElement('canvas')
  const ctx = cv.getContext('2d')
  ctx.font = font
  cv.width = Math.ceil(ctx.measureText(text).width) + 24
  cv.height = 64
  ctx.font = font // réinitialisée par le redimensionnement
  ctx.fillStyle = '#e8c07d'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, cv.width / 2, 32)
  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  return { tex, aspect: cv.width / cv.height }
}

// Ressort amorti critique
function spring(s, goal, dt) {
  s.v += (OMEGA * OMEGA * (goal - s.x) - 2 * OMEGA * s.v) * dt
  s.x += s.v * dt
}

function springVec(s, goal, dt) {
  const a = goal.clone().sub(s.x).multiplyScalar(OMEGA * OMEGA).addScaledVector(s.v, -2 * OMEGA)
  s.v.addScaledVector(a, dt)
  s.x.addScaledVector(s.v, dt)
}

const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

export default class ConstellationScene {
  constructor(container, doc, { onViewChange, onSelect, onRotate } = {}) {
    this.container = container
    this.doc = doc
    this.onViewChange = onViewChange
    this.onRotate = onRotate
    this.onSelect = onSelect

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setClearColor(0x07060a, 1)
    container.appendChild(this.renderer.domElement)

    this.scene = new THREE.Scene()
    this.bgScene = new THREE.Scene()
    this.bgCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1)
    this.renderer.autoClear = false

    this.camera = new THREE.PerspectiveCamera(46, 1, 0.1, 1000)
    this.camera.position.set(0, 0, CAM_D)
    this.camera.lookAt(0, 0, 0)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.minAzimuthAngle = -90 * DEG
    this.controls.maxAzimuthAngle = 90 * DEG
    this.controls.enablePan = false
    this.controls.enableZoom = false
    this.baseRadius = CAM_D
    this.tgt = { x: new THREE.Vector3(), v: new THREE.Vector3() }
    this.rad = { x: CAM_D, v: 0 }
    this.sel = { x: 0, v: 0 }
    this.controls.minPolarAngle = Math.PI / 2
    this.controls.maxPolarAngle = Math.PI / 2

    this.tween = null
    this._onStart = () => { this.tween = null }
    this.controls.addEventListener('start', this._onStart)

    this._buildScales()
    this._buildBackdrop()
    this._buildLeaves()
    this._buildEmblem()
    this._buildStars()
    this._buildEdges()
    this._buildGlow()
    this.axeChrono = this._buildAxis(this.chronoTicks)
    this.axeTraits = this._buildAxis(this.traitsTicks)

    this.chronoSide = false
    this.starBoost = 1
    this.place(this.zTraits)
    this.vue = null
    this.sideExt = {
      chrono: this._sideExtent(this.zDate, 1),
      traits: this._sideExtent(this.zTraits, -1),
    }
    const vs = doc.characters.map((c) => c.node.v)
    this.frontCy = ((Math.max(...vs) + Math.min(...vs)) / 2) * EMBLEM / (CAM_D - Z_EMBLEM)

    this.raycaster = new THREE.Raycaster()
    this.pointer = new THREE.Vector2(-2, -2)
    this.hovered = null
    this.selected = null
    this.settle = null
    this._buildLabel()
    this._bindPointer()

    this._onResize = this._onResize.bind(this)
    this._resizeObserver = new ResizeObserver(this._onResize)
    this._resizeObserver.observe(container)
    this._onResize()

    this._last = null
    this._animate = this._animate.bind(this)
    this.renderer.setAnimationLoop(this._animate)  }

  _buildScales() {
    const chars = this.doc.characters
    const dates = chars.map((c) => Date.parse(c.game.release))
    const T1 = Math.max(...dates)
    const T0 = Date.UTC(new Date(Math.min(...dates)).getUTCFullYear(), 0, 1)
    const strokes = chars.map((c) => c.culture.totalStrokes)
    const S0 = Math.floor(Math.min(...strokes) / 5) * 5
    const S1 = Math.ceil(Math.max(...strokes) / 5) * 5

    const mapZ = (v, min, max) =>
      Z_FAR + ((v - min) / (max - min)) * (Z_NEAR - Z_FAR)

    this.zDate = (c) => mapZ(Date.parse(c.game.release), T0, T1)
    // axe inversé
    this.zTraits = (c) => mapZ(S0 + S1 - c.culture.totalStrokes, S0, S1)

    this.chronoTicks = [2020, 2021, 2022, 2023, 2024].map((y) => ({
      z: mapZ(Date.parse(`${y}-01-01`), T0, T1),
      text: String(y),
    }))
    this.traitsTicks = []
    for (let n = S0; n <= S1; n += 5) {
      this.traitsTicks.push({ z: mapZ(S0 + S1 - n, S0, S1), text: String(n) })
    }
  }

  // Axe gradué
  _buildAxis(ticks) {
    const group = new THREE.Group()
    const materials = []
    const disposables = []

    const zs = ticks.map((t) => t.z)
    const pts = [0, AXIS_Y, Math.min(...zs), 0, AXIS_Y, Math.max(...zs)]
    ticks.forEach(({ z }) => pts.push(0, AXIS_Y, z, 0, AXIS_Y - 0.25, z))
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xe8c07d, transparent: true, opacity: 0, depthWrite: false,
    })
    lineMat.userData.base = 0.6
    group.add(new THREE.LineSegments(geo, lineMat))
    materials.push(lineMat)
    disposables.push(geo, lineMat)

    const label = (text, x, y, z, height) => {
      const { tex, aspect } = labelTexture(text)
      const mat = new THREE.SpriteMaterial({
        map: tex, transparent: true, opacity: 0, depthWrite: false,
      })
      mat.userData.base = 1
      const s = new THREE.Sprite(mat)
      s.position.set(x, y, z)
      s.scale.set(height * aspect, height, 1)
      group.add(s)
      materials.push(mat)
      disposables.push(tex, mat)
    }
    ticks.forEach(({ z, text }) => label(text, 0, AXIS_Y - 0.7, z, 0.55))

    this.scene.add(group)
    return { group, materials, disposables }
  }

  goTo(deg) {
    const off = this.camera.position.clone().sub(this.controls.target)
    const from = new THREE.Spherical().setFromVector3(off)
    from.radius = this.baseRadius
    this.settle = null
    this.tween = {
      from,
      to: new THREE.Spherical(CAM_D, Math.PI / 2, deg * DEG),
      fromTarget: this.controls.target.clone(),
      t0: null,
      dur: 1000,
    }
  }

  _stepTween(time) {
    const tw = this.tween
    if (tw.t0 === null) tw.t0 = time
    const t = Math.min(1, (time - tw.t0) / tw.dur)
    const e = easeInOutCubic(t)
    const lerp = (a, b) => a + (b - a) * e
    const s = new THREE.Spherical(
      lerp(tw.from.radius, tw.to.radius),
      lerp(tw.from.phi, tw.to.phi),
      lerp(tw.from.theta, tw.to.theta),
    )
    this.baseRadius = s.radius
    this.controls.target.lerpVectors(tw.fromTarget, ORIGIN, e)
    this.camera.position.setFromSpherical(s).add(this.controls.target)
    this.camera.lookAt(this.controls.target)
    if (t === 1) this.tween = null
  }

  _buildEmblem() {
    const geo = new THREE.PlaneGeometry(EMBLEM * 2, EMBLEM * 2)
    const mat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
      color: 0xe8c07d,
    })
    this.emblem = new THREE.Mesh(geo, mat)
    this.emblem.position.z = Z_EMBLEM
    this.scene.add(this.emblem)

    this.emblemLevel = 0
    this.emblemTarget = 0
    new THREE.TextureLoader().load('/img/liyue-emblem.webp', (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace
      mat.map = tex
      mat.needsUpdate = true
      this.emblemTarget = 0.34
    })
  }

  _buildStars() {
    this.starTex = starTexture()
    this.group = new THREE.Group()
    this.scene.add(this.group)
    this.items = []
    this.pickables = []
    this.pickGeo = new THREE.SphereGeometry(0.55, 12, 12)
    this.pickMat = new THREE.MeshBasicMaterial({ visible: false })

    this.doc.characters.forEach((c) => {
      const color = new THREE.Color(this.doc.elements[c.game.vision].color)
      const mat = new THREE.SpriteMaterial({
        map: this.starTex,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        color: new THREE.Color(0xffffff).lerp(color, 0.45),
      })
      const baseColor = mat.color.clone()
      const sprite = new THREE.Sprite(mat)
      this.group.add(sprite)

      // cible de clic invisible
      const pick = new THREE.Mesh(this.pickGeo, this.pickMat)
      pick.userData.id = c.id
      this.group.add(pick)
      this.pickables.push(pick)

      this.items.push({
        data: c,
        sprite,
        pick,
        base: c.game.rarity === 5 ? 2.6 : 1.85, // rareté
        size: 1,
        growS: { x: 0, v: 0 },
        shineS: { x: 0, v: 0 },
        on: 1,
        baseColor,
        twinkle: { w: 0.8 + Math.random() * 1.6, phase: Math.random() * Math.PI * 2 },
      })
    })
    this.byId = new Map(this.items.map((it) => [it.data.id, it]))
    this.active = new Set(this.byId.keys())
  }

  _buildLabel() {
    this.label = document.createElement('div')
    this.label.className = 'star-label'
    this.labelImg = document.createElement('img')
    this.labelImg.className = 'star-label__img'
    this.labelImg.alt = ''
    this.labelHanzi = document.createElement('span')
    this.labelHanzi.className = 'star-label__hanzi'
    this.labelName = document.createElement('span')
    this.labelName.className = 'star-label__name'
    const text = document.createElement('div')
    text.className = 'star-label__text'
    text.append(this.labelHanzi, this.labelName)
    this.label.append(this.labelImg, text)
    this.container.appendChild(this.label)
    this.doc.characters.forEach((c) => { new Image().src = c.portrait })
  }

  _setPointer(e) {
    const r = this.renderer.domElement.getBoundingClientRect()
    this.pointer.set(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      -((e.clientY - r.top) / r.height) * 2 + 1,
    )
  }

  _pick() {
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const hits = this.raycaster.intersectObjects(this.pickables, false)
    const hit = hits.find((h) => this.active.has(h.object.userData.id))
    return hit ? hit.object.userData.id : null
  }

  setFilter(predicate) {
    this.active = new Set(
      this.items.filter((it) => predicate(it.data)).map((it) => it.data.id),
    )
    if (this.hovered && !this.active.has(this.hovered.data.id)) this._setHovered(null)
  }

  _setHovered(id) {
    const it = id ? this.byId.get(id) : null
    if (it === this.hovered) return
    this.hovered = it
    this.renderer.domElement.style.cursor = it ? 'pointer' : ''
    this.label.classList.toggle('is-visible', !!it)
    if (it) {
      this.labelHanzi.textContent = it.data.culture.hanzi
      this.labelName.textContent = it.data.game.name
      this.labelImg.src = it.data.portrait
    }
  }

  _bindPointer() {
    const el = this.renderer.domElement
    let downAt = null

    this._onDown = (e) => {
      downAt = { x: e.clientX, y: e.clientY }
    }
    this._onUp = (e) => {
      if (!downAt) return
      const bouge = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y)
      downAt = null
      if (bouge > 8) return
      this._setPointer(e)
      this.onSelect?.(this._pick())
    }
    this._onMove = (e) => {
      if (e.buttons) return this._setHovered(null)
      this._setPointer(e)
      this._setHovered(this._pick())
    }
    this._onLeave = () => this._setHovered(null)

    el.addEventListener('pointerdown', this._onDown)
    el.addEventListener('pointerup', this._onUp)
    el.addEventListener('pointermove', this._onMove)
    el.addEventListener('pointerleave', this._onLeave)
  }

  _tintOf(vision) {
    return new THREE.Color(this.doc.elements[vision]?.color ?? '#f2b723').convertLinearToSRGB()
  }

  _buildBackdrop() {
    this.tintGoal = this._tintOf('Geo')
    this.backdropMat = new THREE.ShaderMaterial({
      vertexShader: BACKDROP_VERTEX,
      fragmentShader: BACKDROP_FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uAspect: { value: 1 },
        uTint: { value: this.tintGoal.clone() },
      },
      depthTest: false,
      depthWrite: false,
    })
    this.backdrop = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.backdropMat)
    this.backdrop.frustumCulled = false
    this.bgScene.add(this.backdrop)
  }

  // Feuilles
  _buildLeaves() {
    this.leafTex = leafTexture()
    this.leaves = []
    for (let i = 0; i < 16; i++) {
      const mat = new THREE.SpriteMaterial({
        map: this.leafTex, transparent: true, opacity: 0, depthTest: false, depthWrite: false,
      })
      const sprite = new THREE.Sprite(mat)
      const near = Math.random() ** 2
      this.bgScene.add(sprite)
      this.leaves.push({
        sprite,
        h: 0.13 + near * 0.37,
        x: null,
        p: Math.random(),
        rate: (1 + near) / (26 + Math.random() * 16),
        phase: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 1.2,
        flip: 0.5 + Math.random() * 1.0,
      })
    }
  }

  _contentRect() {
    const a = this.camera.aspect
    const v = new THREE.Vector3()
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
    const add = (x, y, z) => {
      v.set(x, y, z).project(this.camera)
      x0 = Math.min(x0, v.x * a)
      x1 = Math.max(x1, v.x * a)
      y0 = Math.min(y0, v.y)
      y1 = Math.max(y1, v.y)
    }
    this.items.forEach(({ sprite: { position: p } }) => add(p.x, p.y, p.z))
    if (this.face > 0.2) {
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) add(sx * EMBLEM, sy * EMBLEM, Z_EMBLEM)
    }
    if (this.face < 0.8) {
      add(0, AXIS_Y - 1.0, Z_FAR - 0.6)
      add(0, AXIS_Y - 1.0, Z_NEAR + 0.6)
    }
    return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, hw: (x1 - x0) / 2 + 0.06, hh: (y1 - y0) / 2 + 0.06 }
  }

  _spawnX(rect) {
    const a = this.camera.aspect
    const left = rect.cx - rect.hw + a
    const right = a - (rect.cx + rect.hw)
    if (Math.max(0, left) + Math.max(0, right) < 0.3) return (Math.random() * 2 - 1) * a
    const r = Math.random() * (Math.max(0, left) + Math.max(0, right))
    return r < left ? -a + r : rect.cx + rect.hw + (r - Math.max(0, left))
  }

  _stepLeaves(dt, s) {
    const rect = this._contentRect()
    const level = (this.emblemLevel / 0.34) * (1 - 0.6 * this.focusLevel)
    const k = Math.min(1, 0.4 + 0.6 * this.camera.aspect)
    this.leaves.forEach((l) => {
      l.p += l.rate * dt
      if (l.p > 1 || l.x === null) {
        if (l.p > 1) l.p -= 1
        l.x = this._spawnX(rect) - 0.15
      }
      const x = l.x + 0.15 * l.p + 0.04 * Math.sin(s * 0.7 + l.phase)
      const y = (1 - l.p * 2) * (1 + l.h)
      const h = l.h * k
      const d = Math.max(Math.abs(x - rect.cx) - rect.hw, Math.abs(y - rect.cy) - rect.hh) - h / 2
      const clear = smoothstep(0, 0.1, d)
      l.sprite.position.set(x, y, 0)
      l.sprite.scale.set(h * (0.25 + 0.75 * Math.abs(Math.cos(s * l.flip + l.phase))), h, 1)
      const m = l.sprite.material
      m.rotation = l.phase + l.spin * s + 0.5 * Math.sin(s * 1.1 + l.phase)
      m.opacity = 0.9 * level * clear * smoothstep(0, 0.08, l.p) * (1 - smoothstep(0.88, 1, l.p))
    })
  }

  setSelected(id) {
    const it = id ? this.byId.get(id) ?? null : null
    if (it === this.selected) return
    this.selected = it
    this.tintGoal = this._tintOf(it ? it.data.game.vision : 'Geo')
    this.settle = true
    this.tgt.x.copy(this.controls.target)
    this.rad.x = this.baseRadius
  }

  _orbit(target) {
    const off = this.camera.position.clone().sub(this.controls.target)
    this.controls.target.copy(target)
    this.camera.position.copy(target).add(off)
  }

  _stepFocus(dt) {
    if (!this.settle && !this.selected) return
    springVec(this.tgt, this.selected ? this.selected.sprite.position : ORIGIN, dt)
    spring(this.rad, this.selected ? FOCUS_D : CAM_D, dt)
    this._orbit(this.tgt.x)
    this.baseRadius = this.rad.x
    if (!this.selected && this.tgt.x.length() < 1e-3 && Math.abs(this.rad.x - CAM_D) < 1e-3) {
      this.tgt.x.set(0, 0, 0)
      this.tgt.v.set(0, 0, 0)
      this.rad.x = CAM_D
      this.rad.v = 0
      this.baseRadius = CAM_D
    this.tgt = { x: new THREE.Vector3(), v: new THREE.Vector3() }
    this.rad = { x: CAM_D, v: 0 }
    this.sel = { x: 0, v: 0 }
      this._orbit(ORIGIN)
      this.settle = null
    }
  }
  _buildEdges() {
    const n = this.doc.constellation.edges.length
    this.lineGeo = new THREE.BufferGeometry()
    this.lineGeo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(new Float32Array(n * 6), 3),
    )
    this.lineMat = new THREE.LineBasicMaterial({
      color: 0xf4d79a,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    this.group.add(new THREE.LineSegments(this.lineGeo, this.lineMat))
  }

  // Repère du blason (u, v) → monde
  _worldPos(u, v, z) {
    const k = (CAM_D - z) / (CAM_D - Z_EMBLEM)
    return new THREE.Vector3(u * EMBLEM * k, v * EMBLEM * k, z)
  }

  _buildGlow() {
    this.glowTex = glowTexture()
    this.glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: this.glowTex,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    }))
    this.glow.visible = false
    this.group.add(this.glow)
    this.glowItem = null
    this.focusLevel = 0
  }

  place(zOf) {
    const byAnchor = new Map()
    this.items.forEach((it) => {
      const z = zOf(it.data)
      const p = this._worldPos(it.data.node.u, it.data.node.v, z)
      it.sprite.position.copy(p)
      it.pick.position.copy(p)
      const k = (CAM_D - z) / (CAM_D - Z_EMBLEM)
      it.size = it.base * k * this.starBoost
      it.sprite.scale.setScalar(it.size * (1 + 0.6 * it.growS.x))
      it.pick.scale.setScalar(k * this.starBoost)
      byAnchor.set(it.data.node.id, p)
    })

    const pos = this.lineGeo.attributes.position
    this.doc.constellation.edges.forEach(([a, b], i) => {
      const pa = byAnchor.get(a)
      const pb = byAnchor.get(b)
      if (!pa || !pb) return
      pos.setXYZ(i * 2, pa.x, pa.y, pa.z)
      pos.setXYZ(i * 2 + 1, pb.x, pb.y, pb.z)
    })
    pos.needsUpdate = true

    return byAnchor
  }

  // s = 1 : côté chronologie, s = -1 : côté traits
  _sideExtent(zOf, s) {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
    const add = (lat, y, depth, m = 0) => {
      x0 = Math.min(x0, (lat - m) / depth)
      x1 = Math.max(x1, (lat + m) / depth)
      y0 = Math.min(y0, (y - m) / depth)
      y1 = Math.max(y1, (y + m) / depth)
    }
    this.items.forEach((it) => {
      const z = zOf(it.data)
      const p = this._worldPos(it.data.node.u, it.data.node.v, z)
      add(s * p.z, p.y, D_SIDE + s * p.x, 0.35 * it.base)
    })
    add(s * (Z_FAR - 0.6), AXIS_Y - 1.0, D_SIDE)
    add(s * (Z_NEAR + 0.6), AXIS_Y - 1.0, D_SIDE)
    return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, hx: (x1 - x0) / 2, hy: (y1 - y0) / 2 }
  }

  _onResize() {
    const w = this.container.clientWidth
    const h = this.container.clientHeight
    if (!w || !h) return
    this.camera.aspect = w / h
    this.size = { w, h }

    const boost = window.innerWidth <= 760 ? 1.7 : 1.4
    if (boost !== this.starBoost) {
      this.starBoost = boost
      this.place(this.chronoSide ? this.zDate : this.zTraits)
    }

    const a = this.camera.aspect
    const need = (v, h) => 1.06 * Math.max(v, h / a)
    const dEmblem = CAM_D - Z_EMBLEM
    this.hFront = need(0.86 * EMBLEM / dEmblem, 0.76 * EMBLEM / dEmblem) * CAM_D
    this.titleR = TITLE_PX / h
    const needSide = (e) => need(e.hy / (1 - this.titleR), e.hx) * D_SIDE
    this.hSide = { chrono: needSide(this.sideExt.chrono), traits: needSide(this.sideExt.traits) }
    this.renderer.setSize(w, h)
    this.bgCamera.left = -this.camera.aspect
    this.bgCamera.right = this.camera.aspect
    this.bgCamera.updateProjectionMatrix()
    this._setFov(this.face ?? 1, this.chronoSide)
  }

  _setFov(face, chronoSide) {
    const side = chronoSide ? 'chrono' : 'traits'
    const ext = this.sideExt[side]
    const dist = D_SIDE + (CAM_D - D_SIDE) * face
    this.distFactor = dist / CAM_D
    const tan = (this.hSide[side] + (this.hFront - this.hSide[side]) * face) / dist
    this.camera.fov = 2 * Math.atan(tan) / DEG
    const shift = ((1 - face) * D_SIDE) / dist
    const { w, h } = this.size
    const sheet = window.innerWidth > 760 ? (SHEET_PX / 2) * this.focusLevel : 0
    const ox = ((ext.cx * shift) / (tan * this.camera.aspect)) * (w / 2) + sheet
    const front = (face * (1 - this.focusLevel) * CAM_D) / dist
    const oy = ((-ext.cy * shift - this.frontCy * front) / tan - this.titleR * (1 - face)) * (h / 2)
    this.camera.setViewOffset(w, h, ox, oy, w, h)
  }

  _animate(time) {
    const dt = this._last === null ? 0 : Math.min((time - this._last) / 1000, 0.1)
    this._last = time

    const k = 1 - Math.pow(0.001, dt)
    this.emblemLevel += (this.emblemTarget - this.emblemLevel) * k
    const at = time / 1000

    if (this.tween) this._stepTween(time)
    else this._stepFocus(dt)
    this.controls.update()

    spring(this.sel, this.selected ? 1 : 0, dt)
    this.focusLevel = Math.min(1, Math.max(0, this.sel.x))
    if (this.selected) this.glowItem = this.selected

    this.items.forEach((it) => {
      const m = it.sprite.material
      spring(it.shineS, it === this.selected ? 1 : 0, dt)
      const shine = Math.min(1, Math.max(0, it.shineS.x))
      it.on += ((this.active.has(it.data.id) ? 1 : 0.12) - it.on) * k
      const tw = 1 - 0.25 * (1 - shine) * (0.5 + 0.5 * Math.sin(at * it.twinkle.w + it.twinkle.phase))
      m.opacity = it.on * Math.max(shine, 1 - 0.7 * this.focusLevel) * tw
      m.color.copy(it.baseColor).multiplyScalar(1 + 1.2 * shine)
      spring(it.growS, it === this.selected ? 1 : it === this.hovered ? 0.35 : 0, dt)
      it.sprite.scale.setScalar(it.size * (1 + 0.6 * it.growS.x))
    })

    const gi = this.glowItem
    this.glow.visible = !!gi && gi.shineS.x > 0.01
    if (this.glow.visible) {
      const m = this.glow.material
      m.color.set(this.doc.elements[gi.data.game.vision].color)
      m.opacity = 0.85 * Math.min(1, gi.shineS.x)
      this.glow.position.copy(gi.sprite.position)
      this.glow.scale.setScalar(gi.size * (1.5 + 0.08 * Math.sin(time / 500)))
    }

    const az = this.controls.getAzimuthalAngle()
    if (this.onRotate && Math.abs(az) > 20 * DEG) {
      this.onRotate()
      this.onRotate = null
    }

    const chronoSide = az < 0
    const sideChanged = chronoSide !== this.chronoSide
    if (sideChanged) {
      this.chronoSide = chronoSide
      this.place(chronoSide ? this.zDate : this.zTraits)
    }

    const t = Math.min(1, Math.abs(az) / (Math.PI / 2))
    const face = Math.pow(Math.cos(t * Math.PI / 2), 1.4)
    this.face = face
    this._setFov(face, chronoSide)
    const off = this.camera.position.clone().sub(this.controls.target)
    off.setLength(this.baseRadius * this.distFactor)
    this.camera.position.copy(this.controls.target).add(off)
    this.emblem.material.opacity = this.emblemLevel * face
    const u = this.backdropMat.uniforms
    u.uTime.value = at
    u.uAspect.value = this.camera.aspect
    u.uTint.value.lerp(this.tintGoal, 1 - Math.pow(0.05, dt))
    this._stepLeaves(dt, at)
    this.lineMat.opacity = 0.85 * face * (1 - 0.6 * this.focusLevel)
    this.axeChrono.materials.forEach((m) => {
      m.opacity = chronoSide ? m.userData.base * (1 - face) : 0
    })
    this.axeTraits.materials.forEach((m) => {
      m.opacity = chronoSide ? 0 : m.userData.base * (1 - face)
    })

    const vue = vueProche(az / DEG)
    if (vue !== this.vue) {
      this.vue = vue
      this.onViewChange?.(vue)
    }

    if (this.hovered) {
      const v = this.hovered.sprite.position.clone().project(this.camera)
      const w = this.container.clientWidth
      const h = this.container.clientHeight
      const x = ((v.x + 1) / 2) * w
      const y = ((-v.y + 1) / 2) * h
      this.label.style.transform = `translate(${x + 22}px, ${y - 14}px)`
    }

    this.renderer.clear()
    this.renderer.render(this.bgScene, this.bgCamera)
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    this.renderer.setAnimationLoop(null)
    this._resizeObserver.disconnect()
    this.controls.removeEventListener('start', this._onStart)
    this.controls.dispose()

    const el = this.renderer.domElement
    el.removeEventListener('pointerdown', this._onDown)
    el.removeEventListener('pointerup', this._onUp)
    el.removeEventListener('pointermove', this._onMove)
    el.removeEventListener('pointerleave', this._onLeave)
    this.label.remove()
    this.pickGeo.dispose()
    this.pickMat.dispose()

    this.axeChrono.disposables.forEach((d) => d.dispose())
    this.axeTraits.disposables.forEach((d) => d.dispose())

    this.backdrop.geometry.dispose()
    this.backdropMat.dispose()
    this.leaves.forEach((l) => l.sprite.material.dispose())
    this.leafTex.dispose()
    this.emblem.geometry.dispose()
    this.emblem.material.map?.dispose()
    this.emblem.material.dispose()
    this.items.forEach((it) => it.sprite.material.dispose())
    this.starTex.dispose()
    this.glowTex.dispose()
    this.glow.material.dispose()
    this.lineGeo.dispose()
    this.lineMat.dispose()

    this.renderer.dispose()
    this.renderer.domElement.remove()
  }
}
