/**
 * ==============================================================================
 * CONTROLADOR GENERAL DE LA APLICACIÓN (APP-GRAL.JS)
 * ==============================================================================
 */

let currentCurrency = '$';
let storeConfig = {};

document.addEventListener('DOMContentLoaded', async () => {
  console.log("Iniciando carga de datos de inventario (General)...");

  try {
    const data = await loadAllSheetData();
    console.log("Inventario cargado exitosamente:", data);

    rawCatalogData = data;

    if (data.config) {
      storeConfig = data.config;
      if (data.config.moneda) {
        currentCurrency = data.config.moneda;
      }
    }

    renderHeaderAndFooter(data.config);

    paginationState.productos.data = sortCatalogItems(data.productos || []);
    paginationState.paquetes.data = sortCatalogItems(data.paquetes || []);
    paginationState.promociones.data = sortCatalogItems(data.promociones || []);

    renderAllSections();
    
    // Si la función específica de la página existe, la ejecutamos
    if (typeof setupPageEventListeners === 'function') {
      setupPageEventListeners(data);
    }
    
    renderCartUI();

  } catch (error) {
    console.error("Error al inicializar la aplicación:", error);
  }
});

function renderAllSections() {
  renderSection('productos', currentCurrency);
  renderSection('paquetes', currentCurrency);
  renderSection('promociones', currentCurrency);
}

/**
 * Controladores de paginación universales
 */
function setupPaginationControls(sectionKey, btnPrefix) {
  const prevBtn = document.getElementById(`prev-${btnPrefix}`);
  const nextBtn = document.getElementById(`next-${btnPrefix}`);

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (paginationState[sectionKey].page > 1) {
        paginationState[sectionKey].page--;
        renderSection(sectionKey, currentCurrency);
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      paginationState[sectionKey].page++;
      renderSection(sectionKey, currentCurrency);
    });
  }
}

/**
 * Sanitización universal de nombre de cliente
 */
function sanitizeCustomerName(rawName) {
  if (!rawName) return '';
  return rawName.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
}