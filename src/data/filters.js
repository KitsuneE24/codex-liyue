export const FILTRES_VIDES = { vision: '', weapon: '', rarity: 0, q: '' }

// Sans accents ni espaces : « zhongli » trouve « Zhōng Lí ».
export const normaliser = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ\s]/g, '').toLowerCase()
