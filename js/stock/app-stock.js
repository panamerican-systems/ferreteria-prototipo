/**
 * ==============================================================================
 * CONTROLADOR ESPECÍFICO DE STOCK / POS (APP-STOCK.JS)
 * ==============================================================================
 */

// Sobrescribimos renderAllSections para usar el generador de tarjetas de stock con sus insignias
function renderAllSections() {
  renderSection('productos', currentCurrency, createStockCardHTML);
  renderSection('paquetes', currentCurrency, createStockCardHTML);
  renderSection('promociones', currentCurrency, createStockCardHTML);
}

function setupPageEventListeners(fullData) {
  setupPaginationControls('productos', 'prod');
  setupPaginationControls('paquetes', 'paq');
  setupPaginationControls('promociones', 'promo');

  // Asegurar que el botón del POS tenga el texto y estilo correcto de cobro local
  const sendOrderBtn = document.getElementById('send-order-btn');
  if (sendOrderBtn) {
    sendOrderBtn.textContent = "Cobrar y Limpiar Boleta";
    sendOrderBtn.className = "w-full bg-emerald-700 text-white font-bold py-3 uppercase tracking-wider hover:bg-emerald-800 transition rounded-lg shadow";
  }

  // Buscador inteligente en inventario
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

      const searchWords = rawQuery.split(/\s+/);
      const matchesSearch = (item) => {
        const fullText = `
          ${item.producto || item.titulo || ''} 
          ${item.etiqueta || ''} 
          ${item.descripcion || ''}
        `.toLowerCase();
        return searchWords.every(word => fullText.includes(word));
      };

      paginationState.productos.data = sortCatalogItems((fullData.productos || []).filter(matchesSearch));
      paginationState.paquetes.data = sortCatalogItems((fullData.paquetes || []).filter(matchesSearch));
      paginationState.promociones.data = sortCatalogItems((fullData.promociones || []).filter(matchesSearch));

      paginationState.productos.page = 1;
      paginationState.paquetes.page = 1;
      paginationState.promociones.page = 1;

      renderAllSections();
    });
  }

  // Botón de filtro: Solo agotados
  const filterAgotadosBtn = document.getElementById('filter-agotados-btn');
  let showingOnlyAgotados = false;

  if (filterAgotadosBtn) {
    filterAgotadosBtn.addEventListener('click', () => {
      showingOnlyAgotados = !showingOnlyAgotados;
      
      if (showingOnlyAgotados) {
        filterAgotadosBtn.classList.remove('bg-white', 'text-gray-700', 'border-gray-300');
        filterAgotadosBtn.classList.add('bg-red-600', 'text-white', 'border-red-600');
        filterAgotadosBtn.textContent = "Ver Todos";
      } else {
        filterAgotadosBtn.classList.remove('bg-red-600', 'text-white', 'border-red-600');
        filterAgotadosBtn.classList.add('bg-white', 'text-gray-700', 'border-gray-300');
        filterAgotadosBtn.textContent = "⚠️ Próximos / Agotados";
      }
      
      const searchInput = document.getElementById('global-search');
      if (searchInput) searchInput.value = '';
    
      if (showingOnlyAgotados) {
        const filterAgotado = item => (Number(item.cantidad) || 0) <= 2;
        paginationState.productos.data = sortCatalogItems((fullData.productos || []).filter(filterAgotado));
        paginationState.paquetes.data = sortCatalogItems((fullData.paquetes || []).filter(filterAgotado));
        paginationState.promociones.data = sortCatalogItems((fullData.promociones || []).filter(filterAgotado));
      } else {
        paginationState.productos.data = sortCatalogItems(fullData.productos || []);
        paginationState.paquetes.data = sortCatalogItems(fullData.paquetes || []);
        paginationState.promociones.data = sortCatalogItems(fullData.promociones || []);
      }
    
      paginationState.productos.page = 1;
      paginationState.paquetes.page = 1;
      paginationState.promociones.page = 1;
    
      renderAllSections();
    });
  }

  // Modales
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

  // Sanitización de cliente
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

  // Calculadora de cambio en tiempo real
  const cashReceivedInput = document.getElementById('cash-received');
  if (cashReceivedInput) {
    cashReceivedInput.addEventListener('input', () => {
      updateChangeCalculation();
    });
  }

  // Botón de cobro local y limpieza de boleta
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

      alert("¡Venta finalizada y cobrada con éxito!");
      clearCart();
      if (clientInput) clientInput.value = '';
      if (cashReceivedInput) cashReceivedInput.value = '';
      updateChangeCalculation();
      if (cartModal) cartModal.classList.add('hidden');
    });
  }
}

/**
 * Calcula el cambio en tiempo real
 */
function updateChangeCalculation() {
  const cashReceivedInput = document.getElementById('cash-received');
  const cashChangeEl = document.getElementById('cash-change');
  if (!cashReceivedInput || !cashChangeEl) return;

  const total = calculateCartTotal();
  const received = parseFloat(cashReceivedInput.value) || 0;
  const change = received - total;

  if (received <= 0 || change < 0) {
    cashChangeEl.textContent = `${currentCurrency} 0.00`;
    cashChangeEl.className = "text-red-600 font-extrabold";
  } else {
    cashChangeEl.textContent = `${currentCurrency} ${change.toFixed(2)}`;
    cashChangeEl.className = "text-emerald-700 font-extrabold";
  }
}