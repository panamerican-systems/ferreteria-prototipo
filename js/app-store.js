/**
 * ==============================================================================
 * CONTROLADOR ESPECÍFICO DE TIENDA / CLIENTES (APP-STORE.JS)
 * ==============================================================================
 */

function setupPageEventListeners(fullData) {
  setupPaginationControls('productos', 'prod');
  setupPaginationControls('paquetes', 'paq');
  setupPaginationControls('promociones', 'promo');

  // Buscador de tienda
  const searchInput = document.getElementById('global-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();

      const filterByQuery = (items) => (items || []).filter(item => 
        (item.producto || item.titulo || '').toLowerCase().includes(query) ||
        (item.descripcion || '').toLowerCase().includes(query)
      );

      paginationState.productos.data = sortCatalogItems(filterByQuery(fullData.productos));
      paginationState.paquetes.data = sortCatalogItems(filterByQuery(fullData.paquetes));
      paginationState.promociones.data = sortCatalogItems(filterByQuery(fullData.promociones));

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

  // Botón de envío por WhatsApp
  const sendOrderBtn = document.getElementById('send-order-btn');
  if (sendOrderBtn) {
    sendOrderBtn.addEventListener('click', () => {
      const rawName = clientInput ? clientInput.value : '';
      const name = rawName.trim();

      if (!name) {
        if (nameError) {
          nameError.textContent = "Por favor, ingresa tu nombre para procesar el pedido.";
          nameError.classList.remove('hidden');
        }
        if (clientInput) clientInput.focus();
        return;
      }

      if (getCart().length === 0) {
        if (nameError) {
          nameError.textContent = "Tu carrito está vacío. Agrega productos antes de enviar.";
          nameError.classList.remove('hidden');
        }
        return;
      }

      if (nameError) nameError.classList.add('hidden');

      const phone = storeConfig.whatsapp || '';
      const whatsappUrl = buildWhatsAppOrderUrl(name, phone, currentCurrency);

      if (whatsappUrl) {
        window.open(whatsappUrl, '_blank');
      }
    });
  }
}