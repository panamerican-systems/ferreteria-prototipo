/**
 * ==============================================================================
 * MÓDULO DE INTERFAZ DE RESTOCK (UI RESTOCK - ESPECÍFICO PARA RESTOCK.HTML)
 * ==============================================================================
 */

activeCardGenerator = createRestockCardHTML;

function renderRestockStockBadge(item) {
  const stock = Number(item.cantidad) || 0;
  const medida = item.medida || 'pz';
  const proveedor = item.proveedor || 'Sin Proveedor';

  let badgeHTML = `<span class="bg-ferre-dark text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase shadow-sm">🏭 ${proveedor}</span>`;

  if (stock <= 0) {
    return `<div class="flex flex-col gap-1">${badgeHTML}<span class="bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase shadow-md">Agotado (0 ${medida})</span></div>`;
  } else if (stock <= 2) {
    return `<div class="flex flex-col gap-1">${badgeHTML}<span class="bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase shadow-md">Urgente: ${stock} ${medida}</span></div>`;
  }
  return `<div class="flex flex-col gap-1">${badgeHTML}<span class="bg-blue-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase shadow-md">Stock: ${stock} ${medida}</span></div>`;
}

function createRestockCardHTML(item, currency = '$') {
  return createCardHTML(item, currency, renderRestockStockBadge(item));
}

function renderAllSections() {
  renderSection('productos', currentCurrency);
  renderSection('paquetes', currentCurrency);
  renderSection('promociones', currentCurrency);
}

function openProductDetailModal(item) {
  const modal = document.getElementById('product-detail-modal');
  if (!modal || !item) return;

  const stock = Number(item.cantidad) || 0;
  const medida = item.medida || 'pz';
  const titulo = item.producto || item.titulo || 'Sin Título';
  const proveedor = item.proveedor || 'Sin Proveedor';

  const imgElement = document.getElementById('detail-modal-img');
  if (imgElement) {
    imgElement.className = "w-full h-full object-contain bg-gray-50 p-2";
    imgElement.src = (item.foto && item.foto !== 'NaN') ? item.foto : 'https://via.placeholder.com/300';
  }

  const badgesContainer = document.getElementById('detail-modal-badges');
  if (badgesContainer) {
    badgesContainer.className = "absolute top-3 left-3 z-20 flex flex-col gap-1";
    badgesContainer.innerHTML = `
      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-ferre-dark text-white border border-ferre-main text-xs font-bold shadow-lg">
        <span>🏭</span>
        <span>Proveedor: ${proveedor}</span>
      </div>
      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 text-white text-xs font-bold shadow-lg">
        <span>📦</span>
        <span>Stock actual: ${stock} ${medida}</span>
      </div>
    `;
  }

  document.getElementById('detail-modal-title').textContent = titulo;
  document.getElementById('detail-modal-price').textContent = `Proveedor asignado: ${proveedor}`;
  document.getElementById('detail-modal-description').textContent = item.descripcion || 'Sin descripción disponible.';

  const addBtn = document.getElementById('detail-modal-add-btn');
  if (addBtn) {
    addBtn.textContent = 'Agregar a Lista de Proveedor';
    addBtn.onclick = () => {
      addToCart(item.id);
      closeProductDetailModal();
    };
  }

  modal.classList.remove('hidden');
}