/**
 * ==============================================================================
 * MÓDULO DE INTEGRACIÓN DE DATOS (DATA FETCHER - INVENTARIO & PROVEEDORES)
 * ==============================================================================
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

    entry.id = String(entry.id || '').trim();
    entry.titulo = entry.producto || entry.titulo || 'Sin Título';
    entry.producto = entry.titulo;
    
    const rawPrecio = String(entry.precio || '').replace(/[^0-9.]/g, '');
    entry.precio = parseFloat(rawPrecio) || 0;

    const rawCantidad = String(entry.cantidad || '').replace(/[^0-9.]/g, '');
    entry.cantidad = parseFloat(rawCantidad) || 0;

    // Lectura exacta y limpia del proveedor en el inventario principal
    entry.proveedor = String(entry.proveedor || 'sin proveedor').trim();

    result.push(entry);
  }

  return result;
}

async function fetchCsvData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("⚠️ Error al descargar datos de Sheets");
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
 * Carga completa y simultánea de todo el inventario y la lista de proveedores desde Google Sheets.
 */
async function loadAllSheetData() {
  try {
    const [inventarioRaw, proveedoresRaw] = await Promise.all([
      fetchCsvData(CONFIG.ENDPOINTS.INVENTARIO),
      fetchCsvData(CONFIG.ENDPOINTS.PROVEEDORES)
    ]);

    const inventarioValido = inventarioRaw.filter(item => {
      const productoValido = item.producto && 
                             String(item.producto).trim() !== '' && 
                             String(item.producto).trim() !== 'Sin Título';
      
      const grupoNormalizado = String(item.grupo || '').toLowerCase().trim();
      if (!grupoNormalizado) return false;

      return productoValido;
    });

    const productos = [];
    const paquetes = [];
    const promociones = [];

    inventarioValido.forEach(item => {
      const grupoNormalizado = String(item.grupo || '').toLowerCase().trim();

      if (grupoNormalizado === 'paquete' || grupoNormalizado === 'paquetes' || grupoNormalizado === 'combos'|| grupoNormalizado === 'combo') {
        paquetes.push(item);
      } else if (grupoNormalizado === 'promocion' || grupoNormalizado === 'promociones' || grupoNormalizado === 'promo' || grupoNormalizado === 'promos') {
        promociones.push(item);
      } else {
        productos.push(item);
      }
    });

    // Mapeo exacto adaptado a las columnas reales: 'Nombre' y 'Whatsapp (LADA+NUMERO)'
    const proveedores = proveedoresRaw.map(p => {
      const nombreProv = String(p.nombre || p.Nombre || '').trim();
      // Buscamos en todas las posibles variantes de la columna de WhatsApp de tu hoja
      const whatsappRaw = p['whatsapp (lada+numero)'] || p['whatsapp'] || p['telefono'] || '';
      const contactoProv = String(whatsappRaw).replace(/[^0-9+]/g, '');

      return {
        nombre: nombreProv,
        contacto: contactoProv
      };
    }).filter(p => p.nombre !== '');

    const dataFinal = {
      config: CONFIG.STORE,
      productos: productos,
      paquetes: paquetes,
      promociones: promociones,
      todos: inventarioValido,
      proveedores: proveedores
    };

    return dataFinal;
  } catch (error) {
    console.error("⚠️ Error en loadAllSheetData:", error);
    throw error;
  }
}