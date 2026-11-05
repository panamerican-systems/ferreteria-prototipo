/**
 * ==========================================
 * MÓDULO DE CARRITO DE COMPRAS / POS (js/cart.js)
 * ==========================================
 * Utiliza sessionStorage: Mantiene los productos si se recarga la página,
 * pero se borra automáticamente al cerrar la pestaña.
 */

// Clave única para guardar el carrito en la sesión actual
const CART_STORAGE_KEY = 'ferreteria_session_cart';

/**
 * Obtiene el carrito desde la memoria de la sesión actual (sessionStorage).
 * @returns {Array} Arreglo de objetos con los productos agregados.
 */
function getCart() {
    const data = sessionStorage.getItem(CART_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

/**
 * Guarda el estado actual del carrito en sessionStorage.
 * @param {Array} cart - Estado actualizado del carrito.
 */
function saveCart(cart) {
    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

/**
 * Agrega un producto al carrito respetando el límite de stock disponible.
 * @param {string|number} id - ID único del producto.
 */
function addToCart(id) {
    // 1. Buscar el producto en el catálogo unificado
    const allItems = rawCatalogData.todos || [
        ...(rawCatalogData.productos || []),
        ...(rawCatalogData.paquetes || []),
        ...(rawCatalogData.promociones || [])
    ];
    
    const product = allItems.find(item => String(item.id) === String(id));
    if (!product) return;

    const maxStock = Number(product.cantidad) || 0;
    if (maxStock <= 0) {
        alert("Este producto se encuentra agotado.");
        return;
    }

    const cart = getCart();
    const existingIndex = cart.findIndex(item => String(item.id) === String(id));

    if (existingIndex !== -1) {
        if (cart[existingIndex].cantidad + 1 > maxStock) {
            alert(`Límite alcanzado: Solo hay ${maxStock} ${product.medida || 'pz'} en stock.`);
            return;
        }
        cart[existingIndex].cantidad += 1;
    } else {
        cart.push({
            id: product.id,
            titulo: product.producto || product.titulo || 'Producto',
            precio: parseFloat(product.precio) || 0,
            cantidad: 1,
            maxStock: maxStock,
            medida: product.medida || 'pz'
        });
    }

    saveCart(cart);
    renderCartUI();
}

/**
 * Incrementa o decrementa la cantidad de un ítem en el carrito con límite por stock.
 * @param {string|number} id - ID del ítem.
 * @param {number} change - Variación (+1 o -1).
 */
function updateCartItemQuantity(id, change) {
    let cart = getCart();
    const index = cart.findIndex(item => String(item.id) === String(id));

    if (index !== -1) {
        const item = cart[index];
        const newQuantity = item.cantidad + change;

        if (change > 0 && newQuantity > item.maxStock) {
            alert(`Límite alcanzado: Solo hay ${item.maxStock} ${item.medida} disponibles.`);
            return;
        }

        item.cantidad = newQuantity;
        if (item.cantidad <= 0) {
            cart.splice(index, 1);
        }
    }

    saveCart(cart);
    renderCartUI();
}

/**
 * Remueve por completo un producto del carrito según su ID.
 * @param {string|number} id - ID del ítem a remover.
 */
function removeFromCart(id) {
    let cart = getCart();
    cart = cart.filter(item => String(item.id) !== String(id));
    saveCart(cart);
    renderCartUI();
}

/**
 * Vacía la memoria del carrito en sessionStorage.
 */
function clearCart() {
    sessionStorage.removeItem(CART_STORAGE_KEY);
    renderCartUI();
}

/**
 * Calcula la suma total del precio por cantidad de todos los ítems.
 * @returns {number} Monto total calculado.
 */
function calculateCartTotal() {
    const cart = getCart();
    return cart.reduce((total, item) => total + (item.precio * item.cantidad), 0);
}

/**
 * Limpia el nombre ingresado por el usuario permitiendo únicamente letras y espacios.
 * @param {string} rawName - Cadena de texto recibida del campo de entrada.
 * @returns {string} Texto sanitizado.
 */
function sanitizeCustomerName(rawName) {
    if (!rawName) return '';
    return rawName.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
}

/**
 * Construye el enlace para enviar el pedido por WhatsApp.
 * @returns {string} URL formateada de WhatsApp.
 */
function buildWhatsAppOrderUrl(customerName, phone, currency = '$') {
    const cart = getCart();
    if (cart.length === 0) return '';

    let message = `*NUEVO PEDIDO - FERRETERÍA*\n`;
    message += `----------------------------\n`;
    message += `*Cliente:* ${customerName}\n`;
    message += `----------------------------\n\n`;
    message += `*Detalle del Pedido:*\n`;

    cart.forEach(item => {
        const subtotal = (item.precio * item.cantidad).toFixed(2);
        message += `• ${item.cantidad} ${item.medida} - ${item.titulo} -> ${currency}${subtotal}\n`;
    });

    const total = calculateCartTotal().toFixed(2);
    message += `\n----------------------------\n`;
    message += `*TOTAL:* ${currency}${total}\n`;
    message += `----------------------------\n`;
    message += `¡Quedo a la espera de la confirmación!`;

    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${phone}?text=${encodedMessage}`;
}

/**
 * Actualiza la representación visual del carrito en el DOM.
 */
function renderCartUI() {
    const cart = getCart();
    const activeCurrency = (CONFIG && CONFIG.STORE && CONFIG.STORE.moneda) ? CONFIG.STORE.moneda : '$';
    
    // 1. Contador del header
    const counterEl = document.getElementById('cart-counter');
    const totalItems = cart.reduce((sum, item) => sum + item.cantidad, 0);
    if (counterEl) {
        counterEl.textContent = totalItems;
    }

    // 2. Renderizar lista dentro del modal / boleta
    const cartItemsList = document.getElementById('cart-items-list');
    const totalEl = document.getElementById('cart-total');
    
    if (cartItemsList) {
        if (cart.length === 0) {
            cartItemsList.innerHTML = `<p class="text-xs text-gray-400 text-center py-4 uppercase">El carrito está vacío</p>`;
        } else {
            cartItemsList.innerHTML = cart.map(item => {
                const subtotal = (item.precio * item.cantidad).toFixed(2);
                return `
                    <div class="py-2 flex items-center justify-between text-xs uppercase">
                        <div class="flex-1 pr-2">
                            <p class="font-bold">${item.titulo}</p>
                            <p class="text-gray-500">${activeCurrency} ${Number(item.precio).toFixed(2)} c/u</p>
                        </div>
                        <div class="flex items-center space-x-2">
                            <button onclick="updateCartItemQuantity('${item.id}', -1)" class="px-1.5 py-0.5 border border-black font-bold hover:bg-black hover:text-white transition">-</button>
                            <span class="font-bold">${item.cantidad}</span>
                            <button onclick="updateCartItemQuantity('${item.id}', 1)" class="px-1.5 py-0.5 border border-black font-bold hover:bg-black hover:text-white transition">+</button>
                            <span class="font-bold min-w-[50px] text-right">${activeCurrency} ${subtotal}</span>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    // 3. Actualizar el precio total
    if (totalEl) {
        totalEl.textContent = `${activeCurrency} ${calculateCartTotal().toFixed(2)}`;
    }

    // 4. Adaptar el botón según el estado de WhatsApp ("none" o Número)
    const sendOrderBtn = document.getElementById('send-order-btn');
    if (sendOrderBtn) {
        const whatsappConfig = CONFIG && CONFIG.STORE ? CONFIG.STORE.whatsapp : 'none';
        if (whatsappConfig === 'none' || String(whatsappConfig).trim() === '') {
            sendOrderBtn.textContent = "Cobrar y Limpiar Boleta";
            sendOrderBtn.className = "w-full bg-emerald-700 text-white font-bold py-3 uppercase tracking-wider hover:bg-emerald-800 transition";
        } else {
            sendOrderBtn.textContent = "Enviar Pedido por WhatsApp";
            sendOrderBtn.className = "w-full bg-black text-white font-bold py-3 uppercase tracking-wider hover:bg-gray-800 transition";
        }
    }
}