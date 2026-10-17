export default function CharacterIndex({ characters, selectedId, onSelect, compact }) {
  if (!characters.length) {
    return <p className="index__empty">Aucun personnage ne correspond.</p>
  }

  return (
    <nav className="index" aria-label="Index des personnages">
      <ul>
        {characters.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              className="index__item"
              title={compact ? c.game.name : undefined}
              aria-current={c.id === selectedId ? 'true' : undefined}
              onClick={() => onSelect(c.id)}
            >
              <img className="index__img" src={c.portrait} alt="" width="36" height="36" />
              <span className="index__hanzi" lang="zh-CN">{c.culture.hanzi}</span>
              <span className="index__name">{c.game.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
