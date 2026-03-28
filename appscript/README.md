# VaniApp — Google Apps Script Backend

Backend completo para la app agropecuaria VaniApp, deployado como Web App en Google Apps Script.

---

## Requisitos previos

- Cuenta de Google con acceso al Google Sheet ID: `1E0FVrEGzV4jvSFl-mQjmRV7W4t4Uq5xQCmjCSMC9lh8`
- El sheet debe existir (puede estar vacío — `setupSheets` crea todas las hojas automáticamente)

---

## Paso 1 — Abrir Apps Script

1. Abrí el Google Sheet en el navegador.
2. En el menú superior, hacé clic en **Extensiones** → **Apps Script**.
3. Se abre el editor de Apps Script en una nueva pestaña.

---

## Paso 2 — Pegar el código

1. En el editor, borrá todo el contenido del archivo `Código.gs` (o `Code.gs`).
2. Copiá TODO el contenido de `Code.gs` de este repositorio.
3. Pegalo en el editor.
4. Guardá con **Ctrl+S** (o el ícono del diskette). Elegí un nombre de proyecto, por ejemplo: `VaniApp`.

---

## Paso 3 — Primera configuración (setupSheets)

Antes de deployar, ejecutá la función de setup para crear todas las hojas:

1. En el menú desplegable de funciones (arriba a la izquierda, al lado del botón ▶), seleccioná **`setupSheets`**.
2. Hacé clic en **▶ Ejecutar**.
3. La primera vez te pedirá permisos — hacé clic en **Revisar permisos** → elegí tu cuenta Google → **Permitir**.
4. Verificá en el Google Sheet que se crearon las hojas: STOCK, Alimentación, Sanidad, Reproducción, Destete, Faena, Movimientos, Costos, Usuarios.
5. La hoja Usuarios estará oculta y tendrá el usuario por defecto:
   - **Username**: `admin`
   - **Password**: `admin123`

---

## Paso 4 — Deployar como Web App

1. Hacé clic en el botón azul **Implementar** (arriba a la derecha) → **Nueva implementación**.
2. Hacé clic en el engranaje ⚙️ al lado de "Selecciona el tipo" → elegí **Aplicación web**.
3. Configurá los campos:
   - **Descripción**: `VaniApp API v1` (opcional)
   - **Ejecutar como**: `Yo` (tu cuenta de Google)
   - **Quién tiene acceso**: `Cualquier persona` ← **IMPORTANTE** para que Next.js pueda llamarlo sin autenticación de Google
4. Hacé clic en **Implementar**.
5. Copiá la **URL de la aplicación web** que aparece — tiene este formato:
   ```
   https://script.google.com/macros/s/XXXXXXXXXXXXXXXXXXXXXXXX/exec
   ```

---

## Paso 5 — Configurar el frontend Next.js

En tu proyecto Next.js, creá o editá el archivo `.env.local`:

```env
NEXT_PUBLIC_API_URL=https://script.google.com/macros/s/XXXXXXXXXXXXXXXXXXXXXXXX/exec
```

Reemplazá la URL con la que copiaste en el paso anterior.

---

## Paso 6 — Hacer un request de prueba

Podés testear la API con `curl` o desde el navegador:

```bash
# Login
curl -X POST "https://script.google.com/macros/s/XXXX/exec" \
  -H "Content-Type: application/json" \
  -d '{"action":"login","data":{"username":"admin","password":"admin123"}}'
```

Respuesta esperada:
```json
{
  "success": true,
  "data": {
    "token": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "username": "admin",
    "rol": "admin"
  }
}
```

---

## Paso 7 — Re-deployar después de cambios

Cada vez que modifiques el código, debés crear una **nueva versión del deploy**:

1. Hacé clic en **Implementar** → **Administrar implementaciones**.
2. Al lado de tu deployment activo, hacé clic en el ícono de editar (lápiz ✏️).
3. En "Versión", seleccioná **Nueva versión**.
4. Hacé clic en **Implementar**.

> **Importante**: si no creás una nueva versión, los cambios NO se reflejarán en la API. Apps Script sirve la última versión deployada, no el código en el editor.

---

## Referencia de la API

### Formato de requests

Todos los requests son `POST` con body JSON:

```json
{
  "action": "nombre_de_la_accion",
  "data": { ... },
  "token": "token_obtenido_en_login"
}
```

### Formato de responses

Éxito:
```json
{ "success": true, "data": { ... } }
```

Error:
```json
{ "success": false, "error": "Descripción del error" }
```

### Acciones disponibles

#### Auth (no requieren token)
| Acción | Descripción |
|--------|-------------|
| `login` | Autentica usuario, retorna token (TTL 24 hs) |
| `logout` | Invalida token |
| `setup` | Crea todas las hojas con headers |

#### STOCK
| Acción | data requerida |
|--------|----------------|
| `getStock` | `{ estado?: "Activo" \| "all" }` |
| `getAnimal` | `{ id: "BOV-2024-001" }` — retorna ficha + historial completo |
| `addAnimal` | campos de la hoja (ID se auto-genera si no viene) |
| `updateAnimal` | `{ "ID Animal": "...", ...campos }` |
| `deleteAnimal` | `{ "ID Animal": "..." }` — soft delete (Estado = Inactivo) |

#### Por cada hoja (Alimentación, Sanidad, etc.)
| Patrón | Acción |
|--------|--------|
| `getAll{Hoja}` | Sin data — retorna todas las filas |
| `add{Hoja}` | Campos de la hoja como objeto |
| `update{Hoja}` | Campos + `_rowIndex` (1-based, mínimo 2) |
| `delete{Hoja}` | `{ _rowIndex: N }` |

Ejemplos de nombres: `getAllAlimentacion`, `addSanidad`, `updateFaena`, `deleteMovimientos`.

#### Dashboard
| Acción | Retorna |
|--------|---------|
| `getStats` | Totales por especie, próximas vacunas (30 días), partos esperados (60 días), costos por especie |

### IDs de animales

Formato automático: `ESP-YYYY-NNN`

Ejemplos:
- `BOV-2024-001` — Bovino
- `OVI-2024-012` — Ovino
- `POR-2024-003` — Porcino
- `EQU-2024-001` — Equino

### Fechas

Todas las fechas se guardan y esperan en formato `DD/MM/YYYY`.

---

## Notas sobre CORS

Google Apps Script deployado como Web App con acceso "Cualquier persona" permite requests desde cualquier origen. No es necesario configurar nada extra en el servidor.

Si Next.js llama desde el servidor (SSR/API routes), no hay restricciones de CORS. Si llama desde el browser (client components), asegurate de que el dominio de tu app esté permitido o usá un API route de Next.js como proxy para evitar exponer la URL del script al cliente.
