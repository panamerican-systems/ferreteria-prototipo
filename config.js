/**
 * ==============================================================================
 * CONFIGURACIÓN GLOBAL DEL PROYECTO - TIENDA SYNC-SHEETS (POS / INVENTARIO)
 * ==============================================================================
 */

// Identificador único de publicación de la hoja de cálculo de Google Sheets
const SHEET_BASE_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTupLE4hlQpudLq_eA066uG8e-awCz0GJZPdAJ5dPA4PbLVMxxT8AHYMAnXUabWeCl9wK5bssmjSQ63";

// Mapa de Identificadores de Hoja (GID). Única pestaña activa: gid=0
const GIDS = {
  INVENTARIO: "0"
};

/**
 * Genera la URL de descarga directa en formato CSV a partir del GID recibido
 * @param {string} gid - Identificador numérico de la pestaña en Google Sheets
 * @returns {string} URL formateada para exportar datos en CSV
 */
function buildCsvUrl(gid) {
  return `${SHEET_BASE_URL}/pub?gid=${gid}&output=csv`;
}

// Objeto global accesible por los demás archivos JS
const CONFIG = {
  ENDPOINTS: {
    INVENTARIO: buildCsvUrl(GIDS.INVENTARIO)
  },
  
  // Datos locales de la tienda (Sistema "none" para WhatsApp y Redes)
  STORE: {
    nombre: "Ferrelectrica DAE",
    whatsapp: "none",
    moneda: "$"
  },

  PAGINATION: {
    DESKTOP_ITEMS_PER_PAGE: 12,
    MOBILE_ITEMS_PER_PAGE: 4
  }
};