export const FILTRES_VIDES = { vision: '', weapon: '', rarity: 0, q: '' }

export const normaliser = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ\s]/g, '').toLowerCase()
