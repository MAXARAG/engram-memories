import type { ChangeEvent } from "react";
import type { AnimalRow } from "@/types";
import { findAnimalByIdentifier } from "@/lib/animalReferences";

interface AnimalIdentifierFieldProps {
  id: string;
  name: string;
  label: string;
  value: string;
  animals: AnimalRow[];
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
}

export function AnimalIdentifierField({
  id,
  name,
  label,
  value,
  animals,
  onChange,
  placeholder,
  required = false,
}: AnimalIdentifierFieldProps) {
  const matchedAnimal = findAnimalByIdentifier(animals, value);
  const listId = `${id}-options`;

  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
        {required && <span style={{ color: "var(--color-error)" }}> *</span>}
      </label>
      <input
        id={id}
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        className="input"
        list={listId}
        placeholder={placeholder}
        required={required}
      />
      <datalist id={listId}>
        {animals.map((animal) => (
          <option key={animal.id} value={animal.identificador}>
            {`${animal.especie} · ${animal.categoria}`}
          </option>
        ))}
      </datalist>
      {matchedAnimal && (
        <p style={{ marginTop: "0.375rem", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
          {matchedAnimal.especie} · {matchedAnimal.categoria}
        </p>
      )}
    </div>
  );
}