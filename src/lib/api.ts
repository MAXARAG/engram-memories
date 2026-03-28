import type {
  ApiResponse,
  Animal,
  Alimentacion,
  Sanidad,
  Reproduccion,
  Destete,
  Faena,
  Movimiento,
  Costo,
  Stats,
  User,
} from "@/types";

// ─── Token Management ────────────────────────────────────────────────────────

const TOKEN_KEY = "vaniapp_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

// ─── Base API Call ────────────────────────────────────────────────────────────

async function callAPI<T = unknown>(
  action: string,
  data?: object
): Promise<ApiResponse<T>> {
  const url = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL;

  if (!url) {
    throw new Error("NEXT_PUBLIC_APPS_SCRIPT_URL no está configurada.");
  }

  const token = getToken();

  const payload = {
    action,
    token,
    data: data ?? {},
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Error HTTP: ${response.status}`);
  }

  const result: ApiResponse<T> = await response.json();

  return result;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function login(
  username: string,
  password: string
): Promise<ApiResponse<User>> {
  const result = await callAPI<User>("login", { username, password });
  if (result.success && result.data?.token) {
    setToken(result.data.token);
  }
  return result;
}

export async function logout(): Promise<void> {
  try {
    await callAPI("logout");
  } finally {
    removeToken();
  }
}

// ─── Stock / Animales ─────────────────────────────────────────────────────────

export async function getStock(): Promise<ApiResponse<Animal[]>> {
  return callAPI<Animal[]>("getStock");
}

export async function getAnimal(id: string): Promise<ApiResponse<Animal>> {
  return callAPI<Animal>("getAnimal", { idAnimal: id });
}

export async function addAnimal(
  data: Omit<Animal, "idAnimal">
): Promise<ApiResponse<Animal>> {
  return callAPI<Animal>("addAnimal", data);
}

export async function updateAnimal(
  data: Animal
): Promise<ApiResponse<Animal>> {
  return callAPI<Animal>("updateAnimal", data);
}

export async function deleteAnimal(id: string): Promise<ApiResponse<void>> {
  return callAPI<void>("deleteAnimal", { idAnimal: id });
}

// ─── Alimentacion ─────────────────────────────────────────────────────────────

export async function getAllAlimentacion(): Promise<ApiResponse<Alimentacion[]>> {
  return callAPI<Alimentacion[]>("getAllAlimentacion");
}

export async function addAlimentacion(
  data: Omit<Alimentacion, "id">
): Promise<ApiResponse<Alimentacion>> {
  return callAPI<Alimentacion>("addAlimentacion", data);
}

// ─── Sanidad ──────────────────────────────────────────────────────────────────

export async function getAllSanidad(): Promise<ApiResponse<Sanidad[]>> {
  return callAPI<Sanidad[]>("getAllSanidad");
}

export async function addSanidad(
  data: Omit<Sanidad, "id">
): Promise<ApiResponse<Sanidad>> {
  return callAPI<Sanidad>("addSanidad", data);
}

// ─── Reproduccion ─────────────────────────────────────────────────────────────

export async function getAllReproduccion(): Promise<ApiResponse<Reproduccion[]>> {
  return callAPI<Reproduccion[]>("getAllReproduccion");
}

export async function addReproduccion(
  data: Omit<Reproduccion, "id">
): Promise<ApiResponse<Reproduccion>> {
  return callAPI<Reproduccion>("addReproduccion", data);
}

// ─── Destete ──────────────────────────────────────────────────────────────────

export async function getAllDestete(): Promise<ApiResponse<Destete[]>> {
  return callAPI<Destete[]>("getAllDestete");
}

export async function addDestete(
  data: Omit<Destete, "id">
): Promise<ApiResponse<Destete>> {
  return callAPI<Destete>("addDestete", data);
}

// ─── Faena ────────────────────────────────────────────────────────────────────

export async function getAllFaena(): Promise<ApiResponse<Faena[]>> {
  return callAPI<Faena[]>("getAllFaena");
}

export async function addFaena(
  data: Omit<Faena, "id">
): Promise<ApiResponse<Faena>> {
  return callAPI<Faena>("addFaena", data);
}

// ─── Movimientos ──────────────────────────────────────────────────────────────

export async function getAllMovimientos(): Promise<ApiResponse<Movimiento[]>> {
  return callAPI<Movimiento[]>("getAllMovimientos");
}

export async function addMovimiento(
  data: Omit<Movimiento, "id">
): Promise<ApiResponse<Movimiento>> {
  return callAPI<Movimiento>("addMovimientos", data);
}

// ─── Costos ───────────────────────────────────────────────────────────────────

export async function getAllCostos(): Promise<ApiResponse<Costo[]>> {
  return callAPI<Costo[]>("getAllCostos");
}

export async function addCosto(
  data: Omit<Costo, "id">
): Promise<ApiResponse<Costo>> {
  return callAPI<Costo>("addCostos", data);
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getStats(): Promise<ApiResponse<Stats>> {
  return callAPI<Stats>("getStats");
}
