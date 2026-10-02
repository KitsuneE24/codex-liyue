export default function CharacterIndex({ characters, elements, selectedId, onSelect }) {
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
              aria-current={c.id === selectedId ? 'true' : undefined}
              onClick={() => onSelect(c.id)}
            >
              <img className="index__img" src={c.portrait} alt="" width="36" height="36" />
              <span className="index__hanzi" lang="zh-CN">{c.culture.hanzi}</span>
              <span className="index__name">{c.game.name}</span>
              <span
                className="index__dot"
                style={{ background: elements[c.game.vision].color }}
                title={c.game.vision}
              />
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
