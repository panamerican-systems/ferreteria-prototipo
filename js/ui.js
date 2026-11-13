/**
 * ==============================================================================
 * MÓDULO DE INTERFAZ DE USUARIO (UI RENDERER - POS & INVENTARIO)
 * ==============================================================================
 */

// Estado global de paginación
const paginationState = {
  productos: { page: 1, data: [] },
  paquetes: { page: 1, data: [] },
  promociones: { page: 1, data: [] }
};

// Referencia global al último catálogo completo cargado
let rawCatalogData = { productos: [], paquetes: [], promociones: [], todos: [] };

/**
 * Ordena los ítems según stock (Disponibles primero, Agotados al final).
 */
function sortCatalogItems(items) {
  if (!Array.isArray(items)) return [];
  
  return [...items].sort((a, b) => {
    const stockA = Number(a.cantidad) || 0;
    const stockB = Number(b.cantidad) || 0;

    // Si uno está agotado (<= 0) y el otro no, mandamos el agotado al final
    if (stockA <= 0 && stockB > 0) return 1;
    if (stockA > 0 && stockB <= 0) return -1;
    return 0;
  });
}

/**
 * Configura la información básica del encabezado.
 */
function renderHeaderAndFooter(config) {
  if (!config) return;

  const storeName = config.nombre || 'Ferrelectrica';
  const nameEl = document.getElementById('store-name');
  if (nameEl) {
    nameEl.textContent = storeName;
  }
  document.title = storeName;

  const ticketStoreName = document.getElementById('ticket-store-name');
  if (ticketStoreName) {
    ticketStoreName.textContent = `BOLETA - ${storeName.toUpperCase()}`;
  }
}

/**
 * Genera la representación de las insignias (Badges) en las tarjetas principales:
 * Solo muestra alerta si hay 10 o menos unidades, o si está agotado.
 */
function renderStockBadge(item) {
  const stock = Number(item.cantidad) || 0;
  const medida = item.medida || 'pz';

  if (stock <= 0) {
    return `<span class="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shadow">Agotado</span>`;
  } else if (stock <= 10) {
    return `<span class="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shadow">Stock: ${stock} ${medida}</span>`;
  }
  return ''; // No muestra badge en tarjeta si hay más de 10 para mantener limpio el catálogo
}

/**
 * Genera el elemento visual para la imagen o el fallback con el nombre de la empresa.
 */
function renderCardMedia(item) {
  const isAgotado = (Number(item.cantidad) || 0) <= 0;
  const storeName = (CONFIG && CONFIG.STORE && CONFIG.STORE.nombre) ? CONFIG.STORE.nombre : 'Ferrelectrica';

  const fallbackHTML = `
    <div class="w-full h-40 bg-gray-900 flex flex-col items-center justify-center p-4 text-center select-none ${isAgotado ? 'opacity-50' : ''}">
      <span class="text-white font-extrabold text-sm uppercase tracking-wider line-clamp-1">${storeName}</span>
      <span class="text-gray-400 text-[10px] uppercase font-semibold">Catálogo POS</span>
    </div>
  `;

  if (!item.foto || String(item.foto).trim() === '' || item.foto === 'NaN') {
    return fallbackHTML;
  }

  return `
    <img 
      src="${item.foto}" 
      alt="${item.producto || item.titulo}" 
      class="w-full h-40 object-cover ${isAgotado ? 'opacity-50' : ''}"
      onerror="this.onerror=null; this.parentElement.innerHTML=\`${fallbackHTML.replace(/"/g, '&quot;')}\`;"
    />
  `;
}

/**
 * Genera el HTML completo de una tarjeta de catálogo.
 */
function createCardHTML(item, currency = '$') {
  const stock = Number(item.cantidad) || 0;
  const isAgotado = stock <= 0;
  const titulo = item.producto || item.titulo || 'Sin Título';
  const precio = Number(item.precio || 0).toFixed(2);
  const etiqueta = item.etiqueta ? `<span class="text-[11px] text-gray-500 font-medium block mb-0.5">${item.etiqueta}</span>` : '';

  return `
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between hover:shadow-md transition">
      
      <!-- Contenedor Multimedia y Badges -->
      <div class="relative cursor-pointer" onclick="openProductDetailById('${item.id}')">
        ${renderCardMedia(item)}
        
        <div class="absolute top-2 left-2 flex flex-col gap-1 z-10">
          ${renderStockBadge(item)}
        </div>
      </div>

      <!-- Contenido Principal -->
      <div class="p-3 flex-grow flex flex-col justify-between space-y-3">
        <div>
          ${etiqueta}
          <h3 class="font-bold text-sm text-gray-800 line-clamp-2 leading-tight">${titulo}</h3>
          <p class="font-extrabold text-base text-gray-900 mt-1">${currency} ${precio}</p>
        </div>

        <!-- Botones de Acción -->
        <div class="pt-2 border-t border-gray-100 flex flex-col gap-1.5">
          <button 
            onclick="openProductDetailById('${item.id}')"
            class="w-full bg-gray-100 text-gray-700 text-xs font-semibold py-1.5 rounded-lg hover:bg-gray-200 transition">
            Ver detalles
          </button>
          
          <button 
            onclick="addToCart('${item.id}')"
            ${isAgotado ? 'disabled' : ''} 
            class="w-full bg-gray-900 text-white text-xs font-semibold py-1.5 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition">
            ${isAgotado ? 'Agotado' : 'Agregar'}
          </button>
        </div>
      </div>

    </div>
  `;
}

/**
 * Busca un producto por ID único en todo el catálogo y abre el modal.
 */
function openProductDetailById(id) {
  const allItems = rawCatalogData.todos || [
    ...(rawCatalogData.productos || []),
    ...(rawCatalogData.paquetes || []),
    ...(rawCatalogData.promociones || [])
  ];
  
  const foundItem = allItems.find(item => String(item.id) === String(id));
  if (foundItem) {
    openProductDetailModal(foundItem);
  }
}

/**
 * Abre el modal con los detalles completos del producto, mostrando el stock real en vivo.
 */
function openProductDetailModal(item) {
  const modal = document.getElementById('product-detail-modal');
  if (!modal || !item) return;

  const stock = Number(item.cantidad) || 0;
  const medida = item.medida || 'pz';
  const isAgotado = stock <= 0;
  const activeCurrency = typeof currentCurrency !== 'undefined' ? currentCurrency : '$';
  const titulo = item.producto || item.titulo || 'Sin Título';

  document.getElementById('detail-modal-img').src = (item.foto && item.foto !== 'NaN') ? item.foto : 'https://via.placeholder.com/300';
  document.getElementById('detail-modal-title').textContent = titulo;
  document.getElementById('detail-modal-price').textContent = `${activeCurrency} ${Number(item.precio || 0).toFixed(2)}`;
  document.getElementById('detail-modal-description').textContent = item.descripcion || 'Sin descripción disponible.';

  // Insignias flotantes sobre la imagen (solo alerta si <= 10 o agotado)
  const badgesContainer = document.getElementById('detail-modal-badges');
  if (badgesContainer) {
    badgesContainer.innerHTML = renderStockBadge(item);
  }

  // LÍNEA EN VIVO DE STOCK EXACTO (Visible para todos debajo de la imagen / título)
  let liveStockContainer = document.getElementById('detail-modal-livestock');
  if (!liveStockContainer) {
    // Si no existe el elemento en el HTML, lo creamos dinámicamente justo antes del título o descripción
    const titleEl = document.getElementById('detail-modal-title');
    liveStockContainer = document.createElement('div');
    liveStockContainer.id = 'detail-modal-livestock';
    titleEl.parentNode.insertBefore(liveStockContainer, titleEl);
  }

  // Estilo dinámico para el stock en vivo
  let stockBadgeStyle = "bg-emerald-100 text-emerald-800 border-emerald-200";
  let stockText = `Stock disponible: ${stock} ${medida}`;
  
  if (stock <= 0) {
    stockBadgeStyle = "bg-red-100 text-red-800 border-red-200";
    stockText = `Producto Agotado (0 ${medida})`;
  } else if (stock <= 10) {
    stockBadgeStyle = "bg-amber-100 text-amber-800 border-amber-200";
    stockText = `Stock bajo: ${stock} ${medida}`;
  }

  liveStockContainer.innerHTML = `
    <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-bold mb-2 ${stockBadgeStyle}">
      <span>📦</span>
      <span>${stockText}</span>
    </div>
  `;

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

/**
 * Cierra el modal de detalles.
 */
function closeProductDetailModal() {
  const modal = document.getElementById('product-detail-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

/**
 * Renderiza la rejilla y controles de paginación de una sección.
 */
function renderSection(sectionKey, currency = '$') {
  const state = paginationState[sectionKey];
  const gridContainer = document.getElementById(`grid-${sectionKey}`);
  
  const prefixMap = { productos: 'prod', paquetes: 'paq', promociones: 'promo' };
  const pageLabel = document.getElementById(`page-${prefixMap[sectionKey] || sectionKey.substring(0, 4)}`);
  
  if (!gridContainer) return;

  const itemsPerPage = window.innerWidth < 768 
    ? CONFIG.PAGINATION.MOBILE_ITEMS_PER_PAGE 
    : CONFIG.PAGINATION.DESKTOP_ITEMS_PER_PAGE;

  const totalPages = Math.ceil(state.data.length / itemsPerPage) || 1;
  
  if (state.page > totalPages) state.page = totalPages;
  if (state.page < 1) state.page = 1;

  const startIndex = (state.page - 1) * itemsPerPage;
  const paginatedItems = state.data.slice(startIndex, startIndex + itemsPerPage);

  if (paginatedItems.length === 0) {
    gridContainer.innerHTML = `<p class="col-span-full text-center text-sm text-gray-400 py-4">No se encontraron ítems en esta sección.</p>`;
  } else {
    gridContainer.innerHTML = paginatedItems.map(item => createCardHTML(item, currency)).join('');
  }

  if (pageLabel) {
    pageLabel.textContent = `${state.page} / ${totalPages}`;
  }
}