import { useState } from "react";

interface Props {
  command: string;
  onSave: (cmd: string) => void;
  onClose: () => void;
}

export default function Settings({ command, onSave, onClose }: Props) {
  const [draft, setDraft] = useState(command);

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <h2>Settings</h2>
        <label className="settings-label">
          Wallpaper command
          <span className="settings-hint">Use <code>{"{path}"}</code> as the image path placeholder</span>
        </label>
        <input
          className="settings-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          spellCheck={false}
        />
        <div className="settings-presets">
          <span>Presets:</span>
          {[
            { label: "swww", cmd: "swww img {path} --transition-type wipe --transition-duration 2" },
            { label: "feh", cmd: "feh --bg-scale {path}" },
            { label: "hyprpaper", cmd: "hyprctl hyprpaper wallpaper ,{path}" },
            { label: "swaybg", cmd: "swaybg -i {path} -m fill" },
          ].map((p) => (
            <button key={p.label} className="btn btn--small" onClick={() => setDraft(p.cmd)}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="settings-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn--primary" onClick={() => { onSave(draft); onClose(); }}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
