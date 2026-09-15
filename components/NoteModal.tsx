import React from "react";

interface NoteModalProps {
  value: string;
  onChange: (v: string) => void;
  onUpdate: () => void;
  onClose: () => void;
  isSaving?: boolean;
  saveError?: string | null;
}

const NoteModal: React.FC<NoteModalProps> = ({
  value,
  onChange,
  onUpdate,
  onClose,
  isSaving = false,
  saveError = null,
}) => {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "calc(100vw - 32px)",
          maxWidth: "680px",
          background: "rgba(255,255,255,.96)",
          padding: "28px",
          borderRadius: "24px",
          boxShadow: "0 15px 50px rgba(0,0,0,.25)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Sunflower note"
      >
        <div style={{ fontSize: "32px", marginBottom: "10px" }}>🌻</div>
        <textarea
          aria-label="Your note"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Leave your thoughts..."
          disabled={isSaving}
          style={{
            width: "100%",
            minHeight: "100px",
            fontSize: "18px",
            marginBottom: "8px",
            borderRadius: "8px",
            padding: "10px",
            resize: "vertical",
            border: "1px solid #ccc",
            opacity: isSaving ? 0.6 : 1,
          }}
        />
        {saveError && (
          <div
            style={{
              color: "#c0392b",
              fontSize: "14px",
              marginBottom: "8px",
              background: "#fdecea",
              padding: "8px 12px",
              borderRadius: "6px",
              width: "100%",
              textAlign: "left",
            }}
          >
            {saveError}
          </div>
        )}
        <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
          <button
            onClick={handleUpdate}
            disabled={isSaving || !value.trim()}
            style={{
              fontSize: "18px",
              padding: "8px 24px",
              borderRadius: "8px",
              background: "#f4a020",
              color: "#fff",
              border: "none",
              cursor: isSaving || !value.trim() ? "not-allowed" : "pointer",
              opacity: isSaving || !value.trim() ? 0.6 : 1,
            }}
          >
            {isSaving ? "Saving…" : "Save"}
          </button>
          <button
            onClick={onClose}
            disabled={isSaving}
            style={{
              fontSize: "18px",
              padding: "8px 24px",
              borderRadius: "8px",
              background: "#eee",
              border: "none",
              cursor: isSaving ? "not-allowed" : "pointer",
              opacity: isSaving ? 0.6 : 1,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  function handleUpdate() {
    if (!isSaving && value.trim()) {
      onUpdate();
    }
  }
};

export default NoteModal;
