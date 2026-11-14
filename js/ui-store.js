/**
 * ==============================================================================
 * MÓDULO DE INTERFAZ DE TIENDA (UI STORE - ESPECÍFICO PARA STORE.HTML)
 * ==============================================================================
 */

/**
 * Insignia comercial de 3 niveles para el catálogo principal de clientes.
 */
function renderStoreStockBadge(item) {
  const stock = Number(item.cantidad) || 0;

  if (stock <= 0) {
    return `<span class="bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase shadow-md">Agotado</span>`;
  } else if (stock <= 10) {
    return `<span class="bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase shadow-md">Pocas piezas</span>`;
  }
  return `<span class="bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase shadow-md">Disponible</span>`;
}

/**
 * Generador de tarjetas exclusivo para la tienda de clientes.
 */
function createStoreCardHTML(item, currency = '$') {
  return createCardHTML(item, currency, renderStoreStockBadge(item));
}

/**
 * Renderiza todas las secciones usando el catálogo comercial.
 */
function renderAllSections() {
  renderSection('productos', currentCurrency, createStoreCardHTML);
  renderSection('paquetes', currentCurrency, createStoreCardHTML);
  renderSection('promociones', currentCurrency, createStoreCardHTML);
}

/**
 * Abre el modal de detalles con los 3 niveles de colores y mensajes comerciales para el cliente.
 */
function openProductDetailModal(item) {
  const modal = document.getElementById('product-detail-modal');
  if (!modal || !item) return;

  const stock = Number(item.cantidad) || 0;
  const isAgotado = stock <= 0;
  const activeCurrency = typeof currentCurrency !== 'undefined' ? currentCurrency : '$';
  const titulo = item.producto || item.titulo || 'Sin Título';

  const imgElement = document.getElementById('detail-modal-img');
  if (imgElement) {
    imgElement.className = "w-full h-full object-contain bg-gray-50 p-2";
    imgElement.src = (item.foto && item.foto !== 'NaN') ? item.foto : 'https://via.placeholder.com/300';
  }

  // Definición de estilos y textos según los 3 niveles solicitados por el pana
  let badgeStyle = "bg-emerald-500 text-white border-emerald-600";
  let badgeText = "Disponible";
  
  if (stock <= 0) {
    badgeStyle = "bg-red-600 text-white border-red-700";
    badgeText = "Agotado";
  } else if (stock <= 10) {
    badgeStyle = "bg-amber-500 text-white border-amber-600";
    badgeText = "¡Quedan pocos!";
  }

  const badgesContainer = document.getElementById('detail-modal-badges');
  if (badgesContainer) {
    badgesContainer.className = "absolute top-3 left-3 z-20";
    badgesContainer.innerHTML = `
      <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold shadow-lg ${badgeStyle}">
        <span>🛍️</span>
        <span>${badgeText}</span>
      </div>
    `;
  }

  document.getElementById('detail-modal-title').textContent = titulo;
  document.getElementById('detail-modal-price').textContent = `${activeCurrency} ${Number(item.precio || 0).toFixed(2)}`;
  document.getElementById('detail-modal-description').textContent = item.descripcion || 'Sin descripción disponible.';

  const addBtn = document.getElementById('detail-modal-add-btn');
  if (addBtn) {
    addBtn.disabled = isAgotado;
    addBtn.textContent = isAgotado ? 'Agotado' : 'Agregar al Carrito';
    addBtn.onclick = () => {
      addToCart(item.id);
      closeProductDetailModal();
    };
  }

  modal.classList.remove('hidden');
}