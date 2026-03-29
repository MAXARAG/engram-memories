import type { AnimalRow } from "@/types";

export function normalizeAnimalIdentifier(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

export function findAnimalByIdentifier(animals: AnimalRow[], identifier: string) {
  const normalized = normalizeAnimalIdentifier(identifier);
  return animals.find((animal) => normalizeAnimalIdentifier(animal.identificador) === normalized) ?? null;
}

export function buildAnimalMap(animals: AnimalRow[]) {
  return new Map(animals.map((animal) => [animal.id, animal]));
}

export function getAnimalDisplayId(
  animalMap: Map<string, AnimalRow>,
  internalId: string | null | undefined
) {
  if (!internalId) return "—";
  return animalMap.get(internalId)?.identificador ?? internalId;
}