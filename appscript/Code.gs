// VaniApp - Google Apps Script Backend
// Sheet ID: 1E0FVrEGzV4jvSFl-mQjmRV7W4t4Uq5xQCmjCSMC9lh8
// Agropecuaria management app — doPost/doGet Web App

const SHEET_ID = '1E0FVrEGzV4jvSFl-mQjmRV7W4t4Uq5xQCmjCSMC9lh8';

// ─── Sheet name constants ─────────────────────────────────────────────────────
const SHEETS = {
  STOCK:         'STOCK',
  ALIMENTACION:  'Alimentación',
  SANIDAD:       'Sanidad',
  REPRODUCCION:  'Reproducción',
  DESTETE:       'Destete',
  FAENA:         'Faena',
  MOVIMIENTOS:   'Movimientos',
  COSTOS:        'Costos',
  USUARIOS:      'Usuarios',
};

// ─── Token TTL (24 hs in milliseconds) ───────────────────────────────────────
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

// =============================================================================
// ENTRY POINTS
// =============================================================================

function doGet(e) {
  return buildCorsResponse({ success: true, message: 'VaniApp API is running' });
}

function doPost(e) {
  // Handle pre-flight (OPTIONS) — Apps Script doesn't get OPTIONS natively,
  // but we still return CORS headers on every response.
  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action;
    var data   = body.data   || {};
    var token  = body.token  || '';

    // Public actions — no auth required
    if (action === 'login')  return buildCorsResponse(handleLogin(data));
    if (action === 'logout') return buildCorsResponse(handleLogout(token));
    if (action === 'setup')  return buildCorsResponse(setupSheets());

    // All other actions require a valid token
    var authResult = validateToken(token);
    if (!authResult.valid) {
      return buildCorsResponse({ success: false, error: 'Token inválido o expirado' });
    }

    return buildCorsResponse(route(action, data, authResult.user));

  } catch (err) {
    return buildCorsResponse({ success: false, error: 'Error interno: ' + err.message });
  }
}

// =============================================================================
// ROUTER
// =============================================================================

function route(action, data, user) {
  switch (action) {
    // STOCK
    case 'getStock':       return getStock(data);
    case 'getAnimal':      return getAnimal(data);
    case 'addAnimal':      return addAnimal(data);
    case 'updateAnimal':   return updateAnimal(data);
    case 'deleteAnimal':   return deleteAnimal(data);

    // ALIMENTACIÓN
    case 'getAllAlimentacion': return getAllRows(SHEETS.ALIMENTACION);
    case 'addAlimentacion':   return addAlimentacion(data);
    case 'updateAlimentacion':return updateRow(SHEETS.ALIMENTACION, data);
    case 'deleteAlimentacion':return deleteRow(SHEETS.ALIMENTACION, data);

    // SANIDAD
    case 'getAllSanidad': return getAllRows(SHEETS.SANIDAD);
    case 'addSanidad':   return addRow(SHEETS.SANIDAD, data);
    case 'updateSanidad':return updateRow(SHEETS.SANIDAD, data);
    case 'deleteSanidad':return deleteRow(SHEETS.SANIDAD, data);

    // REPRODUCCIÓN
    case 'getAllReproduccion': return getAllRows(SHEETS.REPRODUCCION);
    case 'addReproduccion':   return addRow(SHEETS.REPRODUCCION, data);
    case 'updateReproduccion':return updateRow(SHEETS.REPRODUCCION, data);
    case 'deleteReproduccion':return deleteRow(SHEETS.REPRODUCCION, data);

    // DESTETE
    case 'getAllDestete': return getAllRows(SHEETS.DESTETE);
    case 'addDestete':   return addRow(SHEETS.DESTETE, data);
    case 'updateDestete':return updateRow(SHEETS.DESTETE, data);
    case 'deleteDestete':return deleteRow(SHEETS.DESTETE, data);

    // FAENA
    case 'getAllFaena': return getAllRows(SHEETS.FAENA);
    case 'addFaena':   return addFaena(data);
    case 'updateFaena':return updateRow(SHEETS.FAENA, data);
    case 'deleteFaena':return deleteRow(SHEETS.FAENA, data);

    // MOVIMIENTOS
    case 'getAllMovimientos': return getAllRows(SHEETS.MOVIMIENTOS);
    case 'addMovimientos':   return addRow(SHEETS.MOVIMIENTOS, data);
    case 'updateMovimientos':return updateRow(SHEETS.MOVIMIENTOS, data);
    case 'deleteMovimientos':return deleteRow(SHEETS.MOVIMIENTOS, data);

    // COSTOS
    case 'getAllCostos': return getAllRows(SHEETS.COSTOS);
    case 'addCostos':   return addRow(SHEETS.COSTOS, data);
    case 'updateCostos':return updateRow(SHEETS.COSTOS, data);
    case 'deleteCostos':return deleteRow(SHEETS.COSTOS, data);

    // DASHBOARD
    case 'getStats': return getStats();

    default:
      return { success: false, error: 'Acción desconocida: ' + action };
  }
}

// =============================================================================
// SETUP SHEETS
// =============================================================================

function setupSheets() {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);

    ensureSheet(ss, SHEETS.STOCK, [
      'ID Animal', 'Especie', 'Categoria', 'Raza', 'Sexo',
      'Fecha Nac', 'Estado', 'Sistema', 'Ubicación', 'Origen'
    ]);

    ensureSheet(ss, SHEETS.ALIMENTACION, [
      'Fecha', 'Especie', 'Categoria', 'Ración', 'Kg Animal',
      'Cantidad', 'Total KG', 'Costo/Kg', 'Costo Total'
    ]);

    ensureSheet(ss, SHEETS.SANIDAD, [
      'Fecha', 'Id Animal', 'Especie', 'Tratamiento', 'Producto',
      'Dosis', 'Tipo', 'Días Retiro', 'Responsable'
    ]);

    ensureSheet(ss, SHEETS.REPRODUCCION, [
      'Id Madre', 'Especie', 'Fecha Servicio', 'Macho',
      'Tipo Servicio', 'Diagnóstico', 'Fecha Parto', 'N° Crías'
    ]);

    ensureSheet(ss, SHEETS.DESTETE, [
      'Fecha', 'ID', 'Madre', 'Especie', 'N° Crías',
      'Peso', 'Promedio', 'Destino'
    ]);

    ensureSheet(ss, SHEETS.FAENA, [
      'Fecha', 'ID Animal', 'Especie', 'Peso Vivo',
      'Peso Canal', 'Rendimiento%', 'Observaciones'
    ]);

    ensureSheet(ss, SHEETS.MOVIMIENTOS, [
      'Fecha', 'ID Animal', 'Tipo', 'Motivo', 'Destino', 'Observaciones'
    ]);

    ensureSheet(ss, SHEETS.COSTOS, [
      'Fecha', 'Categoria', 'Concepto', 'Especie', 'Monto', 'Tipo'
    ]);

    // Hidden users sheet
    var userSheet = ensureSheet(ss, SHEETS.USUARIOS, [
      'Username', 'Password', 'Rol', 'Estado'
    ]);
    userSheet.hideSheet();

    // Create default admin if no users exist
    ensureDefaultAdmin(userSheet);

    return { success: true, data: { message: 'Hojas configuradas correctamente' } };

  } catch (err) {
    return { success: false, error: 'Error en setupSheets: ' + err.message };
  }
}

function ensureSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  // Write headers only if the sheet is empty
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#4a7c59')
      .setFontColor('#ffffff');
  }
  return sheet;
}

function ensureDefaultAdmin(userSheet) {
  var data = userSheet.getDataRange().getValues();
  // Row 0 is headers; check if any user row exists
  if (data.length <= 1) {
    var hashedPwd = hashPassword('admin123');
    userSheet.appendRow(['admin', hashedPwd, 'admin', 'activo']);
  }
}

// =============================================================================
// AUTH
// =============================================================================

function hashPassword(plain) {
  var bytes   = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, plain);
  var result  = '';
  for (var i = 0; i < bytes.length; i++) {
    var byte = (bytes[i] + 256) % 256;
    result  += ('0' + byte.toString(16)).slice(-2);
  }
  return result;
}

function generateUUID() {
  return Utilities.getUuid();
}

function handleLogin(data) {
  if (!data.username || !data.password) {
    return { success: false, error: 'Username y password son requeridos' };
  }

  var ss    = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEETS.USUARIOS);
  if (!sheet) return { success: false, error: 'Hoja de usuarios no encontrada. Ejecutá setup primero.' };

  var rows  = sheet.getDataRange().getValues();
  var hashed = hashPassword(data.password);

  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    if (row[0] === data.username && row[1] === hashed && row[3] === 'activo') {
      // Generate token and persist
      var token   = generateUUID();
      var expiry  = Date.now() + TOKEN_TTL_MS;
      var props   = PropertiesService.getScriptProperties();
      props.setProperty('token_' + token, JSON.stringify({
        username: row[0],
        rol:      row[2],
        expiry:   expiry
      }));
      return {
        success: true,
        data: {
          token:    token,
          username: row[0],
          rol:      row[2]
        }
      };
    }
  }

  return { success: false, error: 'Credenciales inválidas o usuario inactivo' };
}

function handleLogout(token) {
  if (!token) return { success: false, error: 'Token requerido' };
  var props = PropertiesService.getScriptProperties();
  props.deleteProperty('token_' + token);
  return { success: true, data: { message: 'Sesión cerrada' } };
}

function validateToken(token) {
  if (!token) return { valid: false };
  var props = PropertiesService.getScriptProperties();
  var raw   = props.getProperty('token_' + token);
  if (!raw)  return { valid: false };

  try {
    var obj = JSON.parse(raw);
    if (Date.now() > obj.expiry) {
      props.deleteProperty('token_' + token); // Clean up expired
      return { valid: false };
    }
    return { valid: true, user: { username: obj.username, rol: obj.rol } };
  } catch (e) {
    return { valid: false };
  }
}

// =============================================================================
// STOCK
// =============================================================================

function getStock(data) {
  try {
    var ss    = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(SHEETS.STOCK);
    var rows  = sheetToObjects(sheet);

    // Filter by state — default returns only active animals
    var estado = (data && data.estado) ? data.estado : 'Activo';
    if (estado !== 'all') {
      rows = rows.filter(function(r) { return r['Estado'] === estado; });
    }

    return { success: true, data: rows };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function getAnimal(data) {
  if (!data.id) return { success: false, error: 'ID requerido' };

  try {
    var ss    = SpreadsheetApp.openById(SHEET_ID);
    var stock = ss.getSheetByName(SHEETS.STOCK);
    var rows  = sheetToObjects(stock);
    var animal = rows.find(function(r) { return r['ID Animal'] === data.id; });
    if (!animal) return { success: false, error: 'Animal no encontrado' };

    // Build full history
    var sanidad     = sheetToObjects(ss.getSheetByName(SHEETS.SANIDAD))
                        .filter(function(r) { return r['Id Animal'] === data.id; });
    var movimientos = sheetToObjects(ss.getSheetByName(SHEETS.MOVIMIENTOS))
                        .filter(function(r) { return r['ID Animal'] === data.id; });
    var reproduccion = sheetToObjects(ss.getSheetByName(SHEETS.REPRODUCCION))
                        .filter(function(r) { return r['Id Madre'] === data.id; });
    var faena       = sheetToObjects(ss.getSheetByName(SHEETS.FAENA))
                        .filter(function(r) { return r['ID Animal'] === data.id; });

    return {
      success: true,
      data: {
        animal:      animal,
        sanidad:     sanidad,
        movimientos: movimientos,
        reproduccion:reproduccion,
        faena:       faena
      }
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function addAnimal(data) {
  try {
    var ss    = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(SHEETS.STOCK);

    // Auto-generate ID if not provided
    if (!data['ID Animal']) {
      data['ID Animal'] = generateAnimalId(sheet, data['Especie'] || 'GEN');
    }

    // Defaults
    data['Estado']  = data['Estado']  || 'Activo';
    data['Origen']  = data['Origen']  || 'Nacido';

    var headers = getHeaders(sheet);
    var newRow  = headersToRow(headers, data);
    sheet.appendRow(newRow);

    return { success: true, data: { id: data['ID Animal'], message: 'Animal agregado correctamente' } };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function updateAnimal(data) {
  if (!data['ID Animal']) return { success: false, error: 'ID Animal requerido' };

  try {
    var ss    = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(SHEETS.STOCK);
    var headers = getHeaders(sheet);
    var idCol   = headers.indexOf('ID Animal');
    if (idCol === -1) return { success: false, error: 'Columna ID Animal no encontrada' };

    var allData = sheet.getDataRange().getValues();
    for (var i = 1; i < allData.length; i++) {
      if (allData[i][idCol] === data['ID Animal']) {
        var updatedRow = mergeRow(headers, allData[i], data);
        sheet.getRange(i + 1, 1, 1, updatedRow.length).setValues([updatedRow]);
        return { success: true, data: { message: 'Animal actualizado' } };
      }
    }
    return { success: false, error: 'Animal no encontrado' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function deleteAnimal(data) {
  if (!data['ID Animal']) return { success: false, error: 'ID Animal requerido' };

  // Soft delete: set Estado = Inactivo
  data['Estado'] = 'Inactivo';
  return updateAnimal(data);
}

// ─── ID auto-generation ──────────────────────────────────────────────────────

function generateAnimalId(sheet, especie) {
  var prefix  = especieToCode(especie);
  var year    = new Date().getFullYear();
  var allData = sheet.getDataRange().getValues();
  var max     = 0;

  for (var i = 1; i < allData.length; i++) {
    var id = String(allData[i][0]);
    // Pattern: XXX-YYYY-NNN
    var parts = id.split('-');
    if (parts.length === 3 && parts[0] === prefix && parseInt(parts[1]) === year) {
      var num = parseInt(parts[2]);
      if (num > max) max = num;
    }
  }

  var seq = String(max + 1).padStart(3, '0');
  return prefix + '-' + year + '-' + seq;
}

function especieToCode(especie) {
  if (!especie) return 'GEN';
  var map = {
    'bovino':   'BOV',
    'ovino':    'OVI',
    'caprino':  'CAP',
    'porcino':  'POR',
    'equino':   'EQU',
    'aviar':    'AVI',
    'ave':      'AVI',
  };
  var key = especie.toLowerCase().trim();
  return map[key] || especie.substring(0, 3).toUpperCase();
}

// =============================================================================
// ALIMENTACIÓN (with calculated Costo Total)
// =============================================================================

function addAlimentacion(data) {
  try {
    // Costo Total = Total KG × Costo/Kg
    var totalKg  = parseFloat(data['Total KG']  || 0);
    var costoKg  = parseFloat(data['Costo/Kg']  || 0);
    data['Costo Total'] = totalKg * costoKg;

    return addRow(SHEETS.ALIMENTACION, data);
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// =============================================================================
// FAENA (with calculated Rendimiento%)
// =============================================================================

function addFaena(data) {
  try {
    var pesoVivo  = parseFloat(data['Peso Vivo']  || 0);
    var pesoCanal = parseFloat(data['Peso Canal'] || 0);
    if (pesoVivo > 0) {
      data['Rendimiento%'] = ((pesoCanal / pesoVivo) * 100).toFixed(2);
    } else {
      data['Rendimiento%'] = 0;
    }

    // Mark animal state as Faena
    if (data['ID Animal']) {
      updateAnimal({ 'ID Animal': data['ID Animal'], 'Estado': 'En faena' });
    }

    return addRow(SHEETS.FAENA, data);
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// =============================================================================
// DASHBOARD
// =============================================================================

function getStats() {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);

    // 1. Total active animals by species
    var stockRows  = sheetToObjects(ss.getSheetByName(SHEETS.STOCK));
    var activeRows = stockRows.filter(function(r) { return r['Estado'] === 'Activo'; });
    var byEspecie  = {};
    activeRows.forEach(function(r) {
      var esp = r['Especie'] || 'Sin especie';
      byEspecie[esp] = (byEspecie[esp] || 0) + 1;
    });

    // 2. Upcoming vaccines / sanidad in next 30 days
    var now      = new Date();
    var in30     = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    var sanRows  = sheetToObjects(ss.getSheetByName(SHEETS.SANIDAD));
    var upcomingVacunas = sanRows.filter(function(r) {
      var d = parseDateDMY(r['Fecha']);
      return d && d >= now && d <= in30;
    });

    // 3. Expected births in next 60 days
    var in60     = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    var reproRows = sheetToObjects(ss.getSheetByName(SHEETS.REPRODUCCION));
    var partosEsperados = reproRows.filter(function(r) {
      var d = parseDateDMY(r['Fecha Parto']);
      return d && d >= now && d <= in60;
    });

    // 4. Last total cost per species
    var costosRows  = sheetToObjects(ss.getSheetByName(SHEETS.COSTOS));
    var costoEspecie = {};
    costosRows.forEach(function(r) {
      var esp  = r['Especie'] || 'General';
      var monto = parseFloat(r['Monto'] || 0);
      costoEspecie[esp] = (costoEspecie[esp] || 0) + monto;
    });

    return {
      success: true,
      data: {
        totalActivosPorEspecie: byEspecie,
        totalActivos:           activeRows.length,
        proximasVacunas:        upcomingVacunas,
        partosEsperados:        partosEsperados,
        costoPorEspecie:        costoEspecie,
      }
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// =============================================================================
// GENERIC CRUD HELPERS
// =============================================================================

function getAllRows(sheetName) {
  try {
    var ss    = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return { success: false, error: 'Hoja no encontrada: ' + sheetName };
    return { success: true, data: sheetToObjects(sheet) };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function addRow(sheetName, data) {
  try {
    var ss      = SpreadsheetApp.openById(SHEET_ID);
    var sheet   = ss.getSheetByName(sheetName);
    if (!sheet) return { success: false, error: 'Hoja no encontrada: ' + sheetName };

    var headers = getHeaders(sheet);
    var newRow  = headersToRow(headers, data);
    sheet.appendRow(newRow);

    return { success: true, data: { message: 'Fila agregada en ' + sheetName } };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function updateRow(sheetName, data) {
  if (data._rowIndex === undefined && data._rowIndex === null) {
    return { success: false, error: '_rowIndex requerido para actualizar' };
  }

  try {
    var ss      = SpreadsheetApp.openById(SHEET_ID);
    var sheet   = ss.getSheetByName(sheetName);
    if (!sheet) return { success: false, error: 'Hoja no encontrada: ' + sheetName };

    var rowIndex = parseInt(data._rowIndex); // 1-based, row 1 = headers
    if (isNaN(rowIndex) || rowIndex < 2) {
      return { success: false, error: '_rowIndex inválido (debe ser >= 2)' };
    }

    var headers    = getHeaders(sheet);
    var existingRow = sheet.getRange(rowIndex, 1, 1, headers.length).getValues()[0];
    var updatedRow  = mergeRow(headers, existingRow, data);

    sheet.getRange(rowIndex, 1, 1, updatedRow.length).setValues([updatedRow]);

    return { success: true, data: { message: 'Fila actualizada en ' + sheetName } };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function deleteRow(sheetName, data) {
  if (data._rowIndex === undefined) {
    return { success: false, error: '_rowIndex requerido para eliminar' };
  }

  try {
    var ss    = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return { success: false, error: 'Hoja no encontrada: ' + sheetName };

    var rowIndex = parseInt(data._rowIndex);
    if (isNaN(rowIndex) || rowIndex < 2) {
      return { success: false, error: '_rowIndex inválido (debe ser >= 2)' };
    }

    sheet.deleteRow(rowIndex);

    return { success: true, data: { message: 'Fila eliminada de ' + sheetName } };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Converts a sheet to an array of objects using the first row as keys.
 * Also injects a 1-based `_rowIndex` property for update/delete operations.
 */
function sheetToObjects(sheet) {
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  var headers = data[0];
  var result  = [];

  for (var i = 1; i < data.length; i++) {
    var obj = { _rowIndex: i + 1 }; // +1 because getValues is 0-based, sheet rows are 1-based
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    result.push(obj);
  }

  return result;
}

function getHeaders(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) return [];
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0];
}

/**
 * Builds an array of values ordered by headers from a data object.
 * Missing keys are filled with empty string.
 */
function headersToRow(headers, data) {
  return headers.map(function(h) {
    var val = data[h];
    return (val !== undefined && val !== null) ? val : '';
  });
}

/**
 * Merges existing row values with new data, returning updated array.
 * Keys starting with '_' (internal) are ignored.
 */
function mergeRow(headers, existingRow, newData) {
  return headers.map(function(h, idx) {
    if (h === '') return existingRow[idx];
    if (newData[h] !== undefined && !h.startsWith('_')) return newData[h];
    return existingRow[idx];
  });
}

/**
 * Parses a date string in DD/MM/YYYY format to a Date object.
 * Returns null if invalid.
 */
function parseDateDMY(str) {
  if (!str) return null;
  var s = String(str).trim();
  var parts = s.split('/');
  if (parts.length !== 3) return null;
  var d = parseInt(parts[0]);
  var m = parseInt(parts[1]) - 1;
  var y = parseInt(parts[2]);
  var date = new Date(y, m, d);
  if (isNaN(date.getTime())) return null;
  return date;
}

/**
 * Formats a Date to DD/MM/YYYY string.
 */
function formatDateDMY(date) {
  var d = String(date.getDate()).padStart(2, '0');
  var m = String(date.getMonth() + 1).padStart(2, '0');
  var y = date.getFullYear();
  return d + '/' + m + '/' + y;
}

// =============================================================================
// CORS RESPONSE BUILDER
// =============================================================================

/**
 * Builds a ContentService TextOutput with JSON content and CORS headers.
 * NOTE: Apps Script only allows setting CORS headers via
 * HtmlService.createHtmlOutput when deployed as Web App with "Anyone" access.
 * For JSON APIs we use ContentService and rely on the deployment settings.
 */
function buildCorsResponse(payload) {
  var output = ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}
