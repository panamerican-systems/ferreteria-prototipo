/**
 * ==============================================================================
 * MÓDULO DE PORTAPAPELES DE REPOSICIÓN / RESTOCK (JS/CLIPBOARD.JS)
 * ==============================================================================
 * Gestiona el portapapeles de restock, cantidades libres, selector de proveedor 
 * con opción inteligente "Nuevo" y botón para vaciar pedido.
 */

const RESTOCK_CLIPBOARD_STORAGE_KEY = 'ferreteria_restock_clipboard';

function getRestockClipboard() {
    try {
        const data = sessionStorage.getItem(RESTOCK_CLIPBOARD_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error("⚠️ Error al leer el portapapeles:", e);
        sessionStorage.removeItem(RESTOCK_CLIPBOARD_STORAGE_KEY);
        return [];
    }
}

function saveRestockClipboard(clipboard) {
    try {
        sessionStorage.setItem(RESTOCK_CLIPBOARD_STORAGE_KEY, JSON.stringify(clipboard));
    } catch (e) {
        console.error("⚠️ Error al guardar el portapapeles:", e);
    }
}

/**
 * Agrega un producto al portapapeles sin restricciones del filtro superior.
 */
function addToRestockClipboard(id) {
    const allItems = rawCatalogData.todos || [
        ...(rawCatalogData.productos || []),
        ...(rawCatalogData.paquetes || []),
        ...(rawCatalogData.promociones || [])
    ];
    
    const product = allItems.find(item => String(item.id) === String(id));
    if (!product) {
        alert("⚠️ Producto no encontrado en el catálogo.");
        return;
    }

    const stockActual = Number(product.cantidad) || 0;
    if (stockActual > 2) {
        alert("⚠️ Este producto tiene suficiente stock (> 2). Solo se pueden agregar artículos urgentes.");
        return;
    }

    const clipboard = getRestockClipboard();
    const existingIndex = clipboard.findIndex(item => String(item.id) === String(id));

    if (existingIndex !== -1) {
        clipboard[existingIndex].cantidad += 1;
    } else {
        clipboard.push({
            id: product.id,
            titulo: product.producto || product.titulo || 'Producto',
            precio: parseFloat(product.precio) || 0,
            cantidad: 1,
            stockActual: stockActual,
            medida: product.medida || 'pz',
            proveedorSugerido: product.proveedor || 'Sin Proveedor'
        });
    }

    saveRestockClipboard(clipboard);
    renderRestockClipboardUI();
}

function updateRestockClipboardQuantity(id, change) {
    let clipboard = getRestockClipboard();
    const index = clipboard.findIndex(item => String(item.id) === String(id));

    if (index !== -1) {
        const item = clipboard[index];
        const newQuantity = item.cantidad + change;

        if (newQuantity <= 0) {
            clipboard.splice(index, 1);
        } else {
            item.cantidad = newQuantity;
        }
    }

    saveRestockClipboard(clipboard);
    renderRestockClipboardUI();
}

function removeFromRestockClipboard(id) {
    let clipboard = getRestockClipboard();
    clipboard = clipboard.filter(item => String(item.id) !== String(id));
    saveRestockClipboard(clipboard);
    renderRestockClipboardUI();
}

function clearRestockClipboard() {
    sessionStorage.removeItem(RESTOCK_CLIPBOARD_STORAGE_KEY);
    renderRestockClipboardUI();
}

/**
 * Renderiza el modal del portapapeles con Proveedor inteligente y Botón Limpiar.
 */
function renderRestockClipboardUI() {
    const clipboard = getRestockClipboard();
    
    const counterEl = document.getElementById('cart-counter');
    const totalItems = clipboard.reduce((sum, item) => sum + item.cantidad, 0);
    if (counterEl) {
        counterEl.textContent = totalItems;
    }

    const cartItemsList = document.getElementById('cart-items-list');
    const totalEl = document.getElementById('cart-total');
    
    const modalTitleEl = document.querySelector('#cart-modal h2');
    if (modalTitleEl) {
        modalTitleEl.textContent = `PORTAPAPELES DE ORDEN`;
    }

    // Inyectar controles superiores (Proveedor Inteligente) dentro del modal si no existen
    let modalHeaderContainer = document.querySelector('#cart-modal > div > div:nth-child(1)');
    if (modalHeaderContainer && !document.getElementById('modal-top-controls')) {
        const suppliers = (rawCatalogData && rawCatalogData.proveedores) ? rawCatalogData.proveedores : [];
        
        const topControlsHTML = `
            <div id="modal-top-controls" class="mt-4 space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <!-- Proveedor con opción "Nuevo" -->
                <div>
                    <label for="modal-supplier-select" class="text-[11px] font-bold text-gray-700 uppercase block mb-1">
                        🏭 Proveedor a Cotizar:
                    </label>
                    <select id="modal-supplier-select" class="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-ferre-bright focus:outline-none bg-white font-bold text-gray-800">
                        <option value="">-- Selecciona Proveedor --</option>
                        ${suppliers.map(s => {
                            const nombre = String(s.nombre || s.Nombre || '').trim();
                            return `<option value="${nombre}">${nombre}</option>`;
                        }).join('')}
                        <option value="Nuevo">➕ Proveedor Nuevo</option>
                    </select>
                </div>

                <!-- Campos dinámicos para Proveedor Nuevo (Ocultos por defecto) -->
                <div id="new-supplier-fields" class="hidden space-y-2 pt-2 border-t border-gray-200">
                    <div>
                        <label class="block text-[10px] font-bold uppercase text-gray-600 mb-0.5">Nombre del Proveedor Nuevo:</label>
                        <input type="text" id="new-supplier-name" placeholder="Ej. Ferretera del Centro" class="w-full px-2.5 py-1 text-xs border border-gray-300 rounded bg-white">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold uppercase text-gray-600 mb-0.5">WhatsApp de Contacto:</label>
                        <input type="text" id="new-supplier-whatsapp" placeholder="Ej. 525517407646" class="w-full px-2.5 py-1 text-xs border border-gray-300 rounded bg-white">
                    </div>
                </div>
            </div>
        `;
        modalHeaderContainer.insertAdjacentHTML('afterend', topControlsHTML);

        // Lógica para mostrar/ocultar campos de proveedor nuevo
        const supplierSelect = document.getElementById('modal-supplier-select');
        const newSupplierFields = document.getElementById('new-supplier-fields');

        if (supplierSelect && newSupplierFields) {
            supplierSelect.addEventListener('change', () => {
                if (supplierSelect.value === 'Nuevo') {
                    newSupplierFields.classList.remove('hidden');
                } else {
                    newSupplierFields.classList.add('hidden');
                }
            });
        }
    }

    // Inyectar Botón de Limpiar Pedido en el pie del modal si no existe
    let modalFooter = document.querySelector('#cart-modal .border-t-2');
    if (modalFooter && !document.getElementById('clear-order-btn')) {
        const clearBtnHTML = `
            <button id="clear-order-btn" onclick="clearRestockClipboard()" class="w-full bg-gray-200 text-gray-700 font-bold py-2 uppercase tracking-wider hover:bg-gray-300 transition rounded-lg text-xs">
                Limpiar / Vaciar Pedido
            </button>
        `;
        modalFooter.insertAdjacentHTML('beforeend', clearBtnHTML);
    }
    
    if (cartItemsList) {
        if (clipboard.length === 0) {
            cartItemsList.innerHTML = `<p class="text-xs text-gray-400 text-center py-4 uppercase">El portapapeles está vacío</p>`;
        } else {
            cartItemsList.innerHTML = clipboard.map(item => {
                return `
                  <div class="py-2.5 flex items-center justify-between text-xs uppercase border-b border-gray-100">
                      <div class="flex-1 pr-2">
                          <p class="font-bold text-gray-900">${item.titulo}</p>
                          <p class="text-gray-500 text-[10px]">Stock actual: ${item.stockActual} ${item.medida} | Sugerido: ${item.proveedorSugerido}</p>
                      </div>
                      <div class="flex items-center space-x-1.5">
                          <button onclick="updateRestockClipboardQuantity('${item.id}', -1)" class="w-6 h-6 flex items-center justify-center border border-black font-bold hover:bg-black hover:text-white transition rounded">-</button>
                          <span class="font-bold px-1 text-sm">${item.cantidad}</span>
                          <button onclick="updateRestockClipboardQuantity('${item.id}', 1)" class="w-6 h-6 flex items-center justify-center border border-black font-bold hover:bg-black hover:text-white transition rounded">+</button>
                          <button onclick="removeFromRestockClipboard('${item.id}')" class="text-red-600 font-bold ml-1.5 hover:underline px-1">✕</button>
                      </div>
                  </div>
                `;
            }).join('');
        }
    }

    if (totalEl) {
        totalEl.textContent = `${clipboard.length} (Total piezas: ${totalItems})`;
    }
}

// Puentes de compatibilidad
function addToCart(id) {
    addToRestockClipboard(id);
}

function renderCartUI() {
    renderRestockClipboardUI();
}