/**
 * ==============================================================================
 * CONFIGURACIÓN GLOBAL DEL PROYECTO - TIENDA SYNC-SHEETS (POS / INVENTARIO / RESTOCK)
 * ==============================================================================
 */

const SHEET_BASE_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTupLE4hlQpudLq_eA066uG8e-awCz0GJZPdAJ5dPA4PbLVMxxT8AHYMAnXUabWeCl9wK5bssmjSQ63";

// Mapa de Identificadores de Hoja (GID)
const GIDS = {
  INVENTARIO: "0",
  PROVEEDORES: "1265758584" // Nueva pestaña para contactos de proveedores
};

function buildCsvUrl(gid) {
  return `${SHEET_BASE_URL}/pub?gid=${gid}&output=csv`;
}

const CONFIG = {
  ENDPOINTS: {
    INVENTARIO: buildCsvUrl(GIDS.INVENTARIO),
    PROVEEDORES: buildCsvUrl(GIDS.PROVEEDORES)
  },
  
  STORE: {
    nombre: "Ferrelectrica DAE",
    whatsapp: "51953395647",
    moneda: "$"
  },

  PAGINATION: {
    DESKTOP_ITEMS_PER_PAGE: 12,
    MOBILE_ITEMS_PER_PAGE: 4
  }
};