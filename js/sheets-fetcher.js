/**
 * ==============================================================================
 * MÓDULO DE INTEGRACIÓN DE DATOS (DATA FETCHER - INVENTARIO ÚNICO)
 * ==============================================================================
 */

/**
 * Parsea una línea individual de CSV respetando valores entre comillas.
 */
function parseCsvLine(text) {
  const result = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

/**
 * Convierte un texto en formato CSV a un arreglo de objetos JavaScript.
 */
function parseCSV(csvText) {
  const lines = csvText.split(/\r\n|\n/).filter(line => line.trim() !== "");
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map(h => h.trim().toLowerCase());
  const result = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const entry = {};

    headers.forEach((header, index) => {
      let value = values[index] !== undefined ? values[index] : "";

      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }

      entry[header] = value;
    });

    // NORMALIZACIÓN GARANTIZADA DE CAMPOS
    entry.id = String(entry.id || '').trim();
    entry.titulo = entry.producto || entry.titulo || 'Sin Título';
    entry.producto = entry.titulo;
    
    // Limpieza estricta de Precio (elimina $, comas y convierte a número real)
    const rawPrecio = String(entry.precio || '').replace(/[^0-9.]/g, '');
    entry.precio = parseFloat(rawPrecio) || 0;

    // Limpieza estricta de Cantidad / Stock
    const rawCantidad = String(entry.cantidad || '').replace(/[^0-9.]/g, '');
    entry.cantidad = parseFloat(rawCantidad) || 0;

    result.push(entry);
  }

  return result;
}

/**
 * Petición asíncrona para obtener y parsear los datos de una URL CSV.
 */
async function fetchCsvData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("⚠️ Error al descargar el inventario");
    }
    const csvText = await response.text();

    if (csvText.trim().startsWith("<") || csvText.trim().startsWith("<!DOCTYPE")) {
      console.error("⚠️ El CSV devolvió una respuesta HTML inválida.");
      return [];
    }

    return parseCSV(csvText);
  } catch (error) {
    console.error("⚠️ Error en fetchCsvData:", error);
    return [];
  }
}

/**
 * Carga única de la pestaña de Inventario y clasificación por grupos.
 */
async function loadAllSheetData() {
  try {
    const inventarioRaw = await fetchCsvData(CONFIG.ENDPOINTS.INVENTARIO);

    // Filtrar filas válidas que tengan título / producto
    const inventarioValido = inventarioRaw.filter(item => item.producto && String(item.producto).trim() !== '');

    const productos = [];
    const paquetes = [];
    const promociones = [];

    inventarioValido.forEach(item => {
      const grupoNormalizado = String(item.grupo || '').toLowerCase().trim();

      if (grupoNormalizado === 'paquete' || grupoNormalizado === 'paquetes') {
        paquetes.push(item);
      } else if (grupoNormalizado === 'promocion' || grupoNormalizado === 'promociones') {
        promociones.push(item);
      } else {
        productos.push(item);
      }
    });

    const dataFinal = {
      config: CONFIG.STORE,
      productos: productos,
      paquetes: paquetes,
      promociones: promociones,
      todos: inventarioValido
    };

    return dataFinal;
  } catch (error) {
    console.error("⚠️ Error en loadAllSheetData:", error);
    throw error;
  }
}