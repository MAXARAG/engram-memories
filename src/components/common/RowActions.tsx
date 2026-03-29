import { Pencil, Trash2 } from "lucide-react";

interface RowActionsProps {
  onEdit: () => void;
  onDelete: () => void;
  deleting?: boolean;
}

export function RowActions({ onEdit, onDelete, deleting = false }: RowActionsProps) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.375rem" }}>
      <button
        type="button"
        className="btn btn-ghost"
        onClick={onEdit}
        style={{ padding: "0.375rem 0.5rem", color: "var(--color-primary)" }}
        aria-label="Editar registro"
      >
        <Pencil size={15} />
      </button>
      <button
        type="button"
        className="btn btn-ghost"
        onClick={onDelete}
        disabled={deleting}
        style={{
          padding: "0.375rem 0.5rem",
          color: "var(--color-error)",
          opacity: deleting ? 0.6 : 1,
        }}
        aria-label="Eliminar registro"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}