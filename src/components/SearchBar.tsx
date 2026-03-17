interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function SearchBar({ value, onChange }: Props) {
  return (
    <div className="searchbar">
      <input
        className="searchbar__input"
        type="text"
        placeholder="Filter by filename…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button className="searchbar__clear" onClick={() => onChange("")}>
          ✕
        </button>
      )}
    </div>
  );
}
