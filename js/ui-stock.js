/**
 * ==============================================================================
 * MÓDULO DE INTERFAZ DE STOCK (UI STOCK - ESPECÍFICO PARA STOCK.HTML)
 * ==============================================================================
 */

/**
 * Genera la insignia de stock para el catálogo principal (solo alerta si <= 10 o agotado).
 */
function renderStockBadge(item) {
  const stock = Number(item.cantidad) || 0;
  const medida = item.medida || 'pz';

  if (stock <= 0) {
    return `<span class="bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase shadow-md">Agotado</span>`;
  } else if (stock <= 10) {
    return `<span class="bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase shadow-md">Stock: ${stock} ${medida}</span>`;
  }
  return '';
}

/**
 * Sobrescribe la generación de tarjetas para inyectar la insignia de stock en stock.html
 */
function createStockCardHTML(item, currency = '$') {
  return createCardHTML(item, currency, renderStockBadge(item));
}

/**
 * Renderiza todas las secciones usando el generador de tarjetas de stock.
 */
function renderAllSections() {
  renderSection('productos', currentCurrency, createStockCardHTML);
  renderSection('paquetes', currentCurrency, createStockCardHTML);
  renderSection('promociones', currentCurrency, createStockCardHTML);
}

/**
 * Abre el modal de detalles con el indicador de stock exacto en vivo flotando en la esquina.
 */
function openProductDetailModal(item) {
  const modal = document.getElementById('product-detail-modal');
  if (!modal || !item) return;

  const stock = Number(item.cantidad) || 0;
  const medida = item.medida || 'pz';
  const isAgotado = stock <= 0;
  const activeCurrency = typeof currentCurrency !== 'undefined' ? currentCurrency : '$';
  const titulo = item.producto || item.titulo || 'Sin Título';

  const imgElement = document.getElementById('detail-modal-img');
  if (imgElement) {
    imgElement.className = "w-full h-full object-contain bg-gray-50 p-2";
    imgElement.src = (item.foto && item.foto !== 'NaN') ? item.foto : 'https://via.placeholder.com/300';
  }

  let stockBadgeStyle = "bg-emerald-500 text-white border-emerald-600";
  let stockText = `Stock: ${stock} ${medida}`;
  
  if (stock <= 0) {
    stockBadgeStyle = "bg-red-600 text-white border-red-700";
    stockText = `Agotado (0 ${medida})`;
  } else if (stock <= 10) {
    stockBadgeStyle = "bg-amber-500 text-white border-amber-600";
    stockText = `Stock bajo: ${stock} ${medida}`;
  }

  const badgesContainer = document.getElementById('detail-modal-badges');
  if (badgesContainer) {
    badgesContainer.className = "absolute top-3 left-3 z-20";
    badgesContainer.innerHTML = `
      <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold shadow-lg ${stockBadgeStyle}">
        <span>📦</span>
        <span>${stockText}</span>
      </div>
    `;
  }

  document.getElementById('detail-modal-title').textContent = titulo;
  document.getElementById('detail-modal-price').textContent = `${activeCurrency} ${Number(item.precio || 0).toFixed(2)}`;
  document.getElementById('detail-modal-description').textContent = item.descripcion || 'Sin descripción disponible.';

  const oldLiveStock = document.getElementById('detail-modal-livestock');
  if (oldLiveStock) oldLiveStock.remove();

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