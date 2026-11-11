/**
 * ==============================================================================
 * CONTROLADOR PRINCIPAL DE LA APLICACIÓN (APP CONTROLLER - POS & INVENTARIO)
 * ==============================================================================
 */

let currentCurrency = '$';
let storeConfig = {};

document.addEventListener('DOMContentLoaded', async () => {
  console.log("Iniciando carga de datos de inventario...");

  try {
    const data = await loadAllSheetData();
    console.log("Inventario cargado exitosamente:", data);

    // Guardar referencia global para el carrito y modal de detalles
    rawCatalogData = data;

    if (data.config) {
      storeConfig = data.config;
      if (data.config.moneda) {
        currentCurrency = data.config.moneda;
      }
    }

    renderHeaderAndFooter(data.config);

    // Aplicar ordenamiento por disponibilidad de stock
    paginationState.productos.data = sortCatalogItems(data.productos || []);
    paginationState.paquetes.data = sortCatalogItems(data.paquetes || []);
    paginationState.promociones.data = sortCatalogItems(data.promociones || []);

    renderAllSections();
    setupEventListeners(data);
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

function setupEventListeners(fullData) {
  // Controles de paginación
  setupPaginationControls('productos', 'prod');
  setupPaginationControls('paquetes', 'paq');
  setupPaginationControls('promociones', 'promo');

  // =========================================================================
  // BUSCADOR INTELIGENTE POR 3 COLUMNAS Y MULTI-PALABRAS
  // =========================================================================
  const searchInput = document.getElementById('global-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const rawQuery = e.target.value.toLowerCase().trim();

      if (!rawQuery) {
        paginationState.productos.data = sortCatalogItems(fullData.productos || []);
        paginationState.paquetes.data = sortCatalogItems(fullData.paquetes || []);
        paginationState.promociones.data = sortCatalogItems(fullData.promociones || []);
        
        paginationState.productos.page = 1;
        paginationState.paquetes.page = 1;
        paginationState.promociones.page = 1;

        renderAllSections();
        return;
      }

      // Dividir consulta en palabras clave individuales
      const searchWords = rawQuery.split(/\s+/);

      // Función de coincidencia cruzada entre producto, etiqueta y descripción
      const matchesSearch = (item) => {
        const fullText = `
          ${item.producto || item.titulo || ''} 
          ${item.etiqueta || ''} 
          ${item.descripcion || ''}
        `.toLowerCase();

        return searchWords.every(word => fullText.includes(word));
      };

      const filteredProd = (fullData.productos || []).filter(matchesSearch);
      const filteredPaq = (fullData.paquetes || []).filter(matchesSearch);
      const filteredPromo = (fullData.promociones || []).filter(matchesSearch);

      paginationState.productos.data = sortCatalogItems(filteredProd);
      paginationState.paquetes.data = sortCatalogItems(filteredPaq);
      paginationState.promociones.data = sortCatalogItems(filteredPromo);

      paginationState.productos.page = 1;
      paginationState.paquetes.page = 1;
      paginationState.promociones.page = 1;

      renderAllSections();
    });

    // =========================================================================
  // BOTÓN DE FILTRO: SOLO AGOTADOS
  // =========================================================================
  const filterAgotadosBtn = document.getElementById('filter-agotados-btn');
  let showingOnlyAgotados = false;

  if (filterAgotadosBtn) {
      filterAgotadosBtn.addEventListener('click', () => {
        showingOnlyAgotados = !showingOnlyAgotados;
      
        // Cambiar estilo visual del botón para indicar si está activo
        if (showingOnlyAgotados) {
          filterAgotadosBtn.classList.remove('bg-white', 'text-gray-700', 'border-gray-300');
          filterAgotadosBtn.classList.add('bg-red-600', 'text-white', 'border-red-600');
          filterAgotadosBtn.textContent = "Ver Todos";
        } else {
          filterAgotadosBtn.classList.remove('bg-red-600', 'text-white', 'border-red-600');
          filterAgotadosBtn.classList.add('bg-white', 'text-gray-700', 'border-gray-300');
          filterAgotadosBtn.textContent = "⚠️ Agotados";
        }
      
        // Limpiar el buscador de texto al usar este filtro para evitar conflictos
        const searchInput = document.getElementById('global-search');
        if (searchInput) searchInput.value = '';
      
        if (showingOnlyAgotados) {
          // Filtrar solo productos con cantidad <= 0
          const filterAgotado = item => (Number(item.cantidad) || 0) <= 0;
        
          paginationState.productos.data = sortCatalogItems((fullData.productos || []).filter(filterAgotado));
          paginationState.paquetes.data = sortCatalogItems((fullData.paquetes || []).filter(filterAgotado));
          paginationState.promociones.data = sortCatalogItems((fullData.promociones || []).filter(filterAgotado));
        } else {
          // Restaurar catálogo completo ordenado por stock
          paginationState.productos.data = sortCatalogItems(fullData.productos || []);
          paginationState.paquetes.data = sortCatalogItems(fullData.paquetes || []);
          paginationState.promociones.data = sortCatalogItems(fullData.promociones || []);
        }
      
        // Reiniciar páginas a la 1
        paginationState.productos.page = 1;
        paginationState.paquetes.page = 1;
        paginationState.promociones.page = 1;
      
        renderAllSections();
      });
    }
  }

  // =========================================================================
  // CONTROL DE MODALES (BOLETA TICKET & DETALLES)
  // =========================================================================
  const cartBtn = document.getElementById('cart-btn');
  const closeCartBtn = document.getElementById('close-cart-btn');
  const cartModal = document.getElementById('cart-modal');

  if (cartBtn && cartModal) {
    cartBtn.addEventListener('click', () => cartModal.classList.remove('hidden'));
  }
  if (closeCartBtn && cartModal) {
    closeCartBtn.addEventListener('click', () => cartModal.classList.add('hidden'));
  }

  const closeDetailBtn = document.getElementById('close-detail-modal-btn');
  const detailModal = document.getElementById('product-detail-modal');

  if (closeDetailBtn) {
    closeDetailBtn.addEventListener('click', closeProductDetailModal);
  }
  if (detailModal) {
    detailModal.addEventListener('click', (e) => {
      if (e.target === detailModal) closeProductDetailModal();
    });
  }

  // Sanitización de nombre de cliente
  const clientInput = document.getElementById('client-name');
  const nameError = document.getElementById('name-error');

  if (clientInput) {
    clientInput.addEventListener('input', (e) => {
      const rawValue = e.target.value;
      const cleanValue = sanitizeCustomerName(rawValue);
      
      if (rawValue !== cleanValue) {
        e.target.value = cleanValue;
        if (nameError) {
          nameError.textContent = "Solo se permiten letras y espacios.";
          nameError.classList.remove('hidden');
        }
      } else {
        if (nameError) nameError.classList.add('hidden');
      }
    });
  }

  // =========================================================================
  // BOTÓN PRINCIPAL DE LA BOLETA (COBRAR LOCALMENTE O ENVIAR WHATSAPP)
  // =========================================================================
  const sendOrderBtn = document.getElementById('send-order-btn');
  if (sendOrderBtn) {
    sendOrderBtn.addEventListener('click', () => {
      if (getCart().length === 0) {
        if (nameError) {
          nameError.textContent = "La boleta está vacía. Agrega productos antes de procesar.";
          nameError.classList.remove('hidden');
        }
        return;
      }

      if (nameError) nameError.classList.add('hidden');

      const whatsappConfig = CONFIG && CONFIG.STORE ? CONFIG.STORE.whatsapp : 'none';

      // Si WhatsApp está en "none", actúa como cobro local POS
      if (whatsappConfig === 'none' || String(whatsappConfig).trim() === '') {
        alert("¡Venta finalizada y cobrada con éxito!");
        clearCart();
        if (clientInput) clientInput.value = '';
        if (cartModal) cartModal.classList.add('hidden');
      } else {
        // Enviar pedido por WhatsApp si hay un número configurado
        const rawName = clientInput ? clientInput.value : '';
        const name = rawName.trim() || 'Cliente';
        const whatsappUrl = buildWhatsAppOrderUrl(name, whatsappConfig, currentCurrency);

        if (whatsappUrl) {
          window.open(whatsappUrl, '_blank');
        }
      }
    });
  }
}

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