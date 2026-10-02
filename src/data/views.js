// Les trois vues du carrousel, dans l'ordre spatial (de gauche à droite).
// deg = azimut de la caméra, en degrés.
export const VUES = [
  { cle: 'chrono', deg: -90, label: 'la chronologie', titre: 'Année de sortie' },
  { cle: 'blason', deg: 0, label: 'le blason' },
  { cle: 'traits', deg: 90, label: 'le nombre de traits', titre: 'Nombre de traits' },
]

// la vue courante = la plus proche de l'angle actuel
export function vueProche(deg) {
  return VUES.reduce((a, b) =>
    Math.abs(b.deg - deg) < Math.abs(a.deg - deg) ? b : a)
}
