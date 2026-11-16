/**
 * ==============================================================================
 * CONTROLADOR ESPECÍFICO DE RESTOCK / PROVEEDORES (APP-RESTOCK.JS)
 * ==============================================================================
 */

function setupPageEventListeners(fullData) {
  setupPaginationControls('productos', 'prod');
  setupPaginationControls('paquetes', 'paq');
  setupPaginationControls('promociones', 'promo');

  setupSupplierFilter(fullData);

  applyRestockFilters(fullData);

  const searchInput = document.getElementById('global-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      applyRestockFilters(fullData);
    });
  }

  const supplierSelect = document.getElementById('supplier-select');
  if (supplierSelect) {
    supplierSelect.addEventListener('change', () => {
      applyRestockFilters(fullData);
    });
  }

  const cartBtn = document.getElementById('cart-btn');
  const closeCartBtn = document.getElementById('close-cart-btn');
  const cartModal = document.getElementById('cart-modal');

  if (cartBtn && cartModal) {
    cartBtn.addEventListener('click', () => {
      renderRestockClipboardUI();
      cartModal.classList.remove('hidden');
    });
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

  // EVENTO DE ENVÍO DE ORDEN DESDE EL MODAL (CON PROVEEDOR INTELIGENTE Y NUEVO)
  const sendOrderBtn = document.getElementById('send-order-btn');
  if (sendOrderBtn) {
    sendOrderBtn.addEventListener('click', () => {
      const clipboard = getRestockClipboard();
      if (clipboard.length === 0) {
        alert("El portapapeles de reposición está vacío.");
        return;
      }

      const clientInput = document.getElementById('client-name');
      const clientName = clientInput ? clientInput.value.trim() : '';

      const modalSupplierSelect = document.getElementById('modal-supplier-select');
      const selectedSupplier = modalSupplierSelect ? modalSupplierSelect.value : '';

      if (!selectedSupplier) {
        alert("Por favor, selecciona un proveedor a cotizar en el menú del portapapeles.");
        if (modalSupplierSelect) modalSupplierSelect.focus();
        return;
      }

      let supplierName = selectedSupplier;
      let phone = '';

      if (selectedSupplier === 'Nuevo') {
        const newNameInput = document.getElementById('new-supplier-name');
        const newPhoneInput = document.getElementById('new-supplier-whatsapp');
        
        supplierName = newNameInput ? newNameInput.value.trim() : '';
        phone = newPhoneInput ? newPhoneInput.value.replace(/[^0-9+]/g, '') : '';

        if (!supplierName) {
          alert("Por favor, ingresa el nombre del proveedor nuevo.");
          if (newNameInput) newNameInput.focus();
          return;
        }
      } else {
        // Buscar teléfono en la lista de proveedores de Sheets
        const supplierObj = (fullData.proveedores || []).find(p => {
          const pName = String(p.nombre || p.Nombre || '').trim().toLowerCase();
          return pName === selectedSupplier.toLowerCase();
        });
        phone = supplierObj ? (supplierObj.contacto || supplierObj.whatsapp || '') : '';
      }

      if (!phone) {
        alert(`No se encontró un número de WhatsApp registrado para "${supplierName}". Ingresa el número de contacto.`);
        return;
      }

      let message = `Hola *${supplierName}*, buen día. Espero que se encuentre muy bien.\n`;
      if (clientName) {
        message += `Le escribe *${clientName}* desde *Ferrelectrica DAE*.\n\n`;
      } else {
        message += `Le escribe de *Ferrelectrica DAE*.\n\n`;
      }
      message += `Me gustaría cotizar y verificar la disponibilidad de los siguientes productos para reposición:\n\n`;

      clipboard.forEach(item => {
        message += `• ${item.cantidad} ${item.medida} - ${item.titulo}\n`;
      });

      message += `\nQuedo atento a tus precios y confirmación. ¡Muchas gracias!`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
    });
  }
}

function setupSupplierFilter(fullData) {
  const supplierSelect = document.getElementById('supplier-select');
  if (!supplierSelect) return;

  const suppliers = fullData.proveedores || [];

  let optionsHTML = `<option value="todos">🏭 Todos los Proveedores (${suppliers.length})</option>`;
  
  suppliers.forEach(s => {
    const nombreProv = String(s.nombre || s.Nombre || '').trim();
    const contactoProv = String(s.contacto || s.whatsapp || '').trim();
    if (nombreProv) {
      optionsHTML += `<option value="${nombreProv}">${nombreProv}</option>`;
    }
  });

  optionsHTML += `<option value="sin_proveedor"> Sin Proveedor </option>`;

  supplierSelect.innerHTML = optionsHTML;
}

function applyRestockFilters(fullData) {
  const searchInput = document.getElementById('global-search');
  const supplierSelect = document.getElementById('supplier-select');
  
  const rawQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const selectedSupplier = supplierSelect ? supplierSelect.value : 'todos';

  const searchWords = rawQuery ? rawQuery.split(/\s+/) : [];

  const filterItem = (item) => {
    const stock = Number(item.cantidad) || 0;
    if (stock > 2) {
      return false;
    }

    if (selectedSupplier !== 'todos') {
      const itemProv = String(item.proveedor || '').trim().toLowerCase();
      
      if (selectedSupplier === 'sin_proveedor') {
        if (itemProv && itemProv !== 'sin proveedor' && itemProv !== 'general' && itemProv !== 'nan' && itemProv !== '') {
          return false;
        }
      } else {
        const targetProv = selectedSupplier.trim().toLowerCase();
        if (itemProv !== targetProv) return false;
      }
    }

    if (searchWords.length > 0) {
      const fullText = `
        ${item.producto || item.titulo || ''} 
        ${item.etiqueta || ''} 
        ${item.descripcion || ''}
        ${item.proveedor || ''}
      `.toLowerCase();
      return searchWords.every(word => fullText.includes(word));
    }

    return true;
  };

  paginationState.productos.data = sortCatalogItems((fullData.productos || []).filter(filterItem));
  paginationState.paquetes.data = sortCatalogItems((fullData.paquetes || []).filter(filterItem));
  paginationState.promociones.data = sortCatalogItems((fullData.promociones || []).filter(filterItem));

  paginationState.productos.page = 1;
  paginationState.paquetes.page = 1;
  paginationState.promociones.page = 1;

  renderAllSections();
}