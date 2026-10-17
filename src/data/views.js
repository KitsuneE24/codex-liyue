// deg : azimut de la caméra
export const VUES = [
  { cle: 'chrono', deg: -90, label: 'la chronologie', titre: 'Année de sortie' },
  { cle: 'blason', deg: 0, label: 'le blason' },
  { cle: 'traits', deg: 90, label: 'le nombre de traits', titre: 'Nombre de traits' },
]

export function vueProche(deg) {
  return VUES.reduce((a, b) =>
    Math.abs(b.deg - deg) < Math.abs(a.deg - deg) ? b : a)
}
