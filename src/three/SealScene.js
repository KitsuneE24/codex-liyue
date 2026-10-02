import * as THREE from 'three'

function faceTexture(char) {
  const s = 256
  const cv = document.createElement('canvas')
  cv.width = cv.height = s
  const ctx = cv.getContext('2d')
  ctx.fillStyle = '#9b2a24'
  ctx.fillRect(0, 0, s, s)
  ctx.strokeStyle = '#f3dfc0'
  ctx.lineWidth = 14
  ctx.strokeRect(22, 22, s - 44, s - 44)
  ctx.fillStyle = '#f3dfc0'
  ctx.font = '700 150px "Noto Serif SC", "Songti SC", "SimSun", serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(char, s / 2, s / 2 + 8)
  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export default class SealScene {
  constructor(container) {
    this.container = container
    const size = container.clientWidth || 76

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(size, size)
    container.appendChild(this.renderer.domElement)

    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20)
    this.camera.position.set(0, 0, 4.2)

    // MeshStandardMaterial réagit à la lumière : sans elle, le sceau est noir.
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.9))
    const key = new THREE.DirectionalLight(0xffffff, 1.6)
    key.position.set(1.5, 2, 3)
    this.scene.add(key)
    const rim = new THREE.DirectionalLight(0xffd9a0, 1.2)
    rim.position.set(-3, 0.5, -1)
    this.scene.add(rim)

    // BoxGeometry accepte un tableau de six matériaux :
    // +X, -X, +Y, -Y, +Z (face avant), -Z (face arrière)
    this.texA = faceTexture('游')
    this.texB = faceTexture('文')
    const faceA = new THREE.MeshStandardMaterial({ map: this.texA, roughness: 0.55 })
    const faceB = new THREE.MeshStandardMaterial({ map: this.texB, roughness: 0.55 })
    const flanc = new THREE.MeshStandardMaterial({
      color: 0x7d1f1b, roughness: 0.62, metalness: 0.08,
    })
    this.materials = [flanc, faceA, faceB]
    this.geo = new THREE.BoxGeometry(1.5, 1.5, 0.42)
    this.mesh = new THREE.Mesh(this.geo, [flanc, flanc, flanc, flanc, faceA, faceB])
    this.mesh.rotation.x = -0.18
    this.scene.add(this.mesh)

    this.flipped = false
    this.angle = 0
    this.targetAngle = 0
    this._last = null
    this._animate = this._animate.bind(this)
    this.renderer.setAnimationLoop(this._animate)
  }

  flip() {
    this.flipped = !this.flipped
    this.targetAngle += Math.PI // on ajoute un demi-tour
  }

  setFlipped(flipped) {
    if (flipped !== this.flipped) this.flip()
  }

  _animate(time) {
    const dt = this._last === null ? 0 : Math.min((time - this._last) / 1000, 0.1)
    this._last = time
    const k = 1 - Math.pow(0.001, dt)
    this.angle += (this.targetAngle - this.angle) * k
    this.mesh.rotation.y = this.angle
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    this.renderer.setAnimationLoop(null)
    this.geo.dispose()
    this.materials.forEach((m) => m.dispose())
    this.texA.dispose()
    this.texB.dispose()
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }
}
