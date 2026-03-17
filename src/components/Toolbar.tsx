interface Props {
  dir: string | null;
  onPickFolder: () => void;
  showFavs: boolean;
  onToggleFavs: () => void;
  onOpenSettings: () => void;
}

export default function Toolbar({ dir, onPickFolder, showFavs, onToggleFavs, onOpenSettings }: Props) {
  return (
    <div className="toolbar">
      <div className="toolbar__left">
        <button className="btn btn--primary" onClick={onPickFolder}>
          📁 {dir ? "Change folder" : "Select folder"}
        </button>
        {dir && (
          <span className="toolbar__dir" title={dir}>
            {dir.split("/").pop()}
          </span>
        )}
      </div>
      <div className="toolbar__right">
        <button
          className={`btn ${showFavs ? "btn--active" : ""}`}
          onClick={onToggleFavs}
          title="Show favorites only"
        >
          ★ Favorites
        </button>
        <button className="btn" onClick={onOpenSettings} title="Settings">
          ⚙ Settings
        </button>
      </div>
    </div>
  );
}
