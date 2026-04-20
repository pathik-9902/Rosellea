/* Main Frontend Logic for Rosellea */

let products = [];
let cart = [];
let currentUser = null;

const API_URL = 'api.php';

// Category Definitions with specific background images
const categories = [
    { name: "Serum and essence", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" },
    { name: "Face moisturizer and day cream", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" },
    { name: "Suncare", img: "https://images.unsplash.com/photo-1617897903246-719242758050?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" },
    { name: "Shampoo", img: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" },
    { name: "Lips", img: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" },
    { name: "Face wash", img: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" },
    { name: "Lip balm", img: "https://images.unsplash.com/photo-1599305090598-fe179d501227?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" },
    { name: "Kajal", img: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" },
    { name: "Shower gel and body wash", img: "https://images.unsplash.com/photo-1608289178820-2dfaa443cb00?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" }
];

document.addEventListener("DOMContentLoaded", () => {
    checkAuthStatus();
    initCategories();
    fetchBrands();
    fetchProducts();
    loadCart();
    initHeroSlider();
});

function initCategories() {
    const container = document.getElementById('category-tabs');
    categories.forEach(cat => {
        const card = document.createElement('div');
        card.className = 'category-card';
        card.onclick = () => filterByCategory(cat.name);
        card.innerHTML = `
            <img src="${cat.img}" alt="${cat.name}">
            <div class="overlay">
                <h3>${cat.name}</h3>
            </div>
        `;
        container.appendChild(card);
    });
}

function initHeroSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    if(slides.length === 0) return;
    
    let currentSlide = 0;
    setInterval(() => {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }, 5000); // Change image every 5 seconds
}

function fetchBrands() {
    fetch(`${API_URL}?action=get_brands`)
        .then(res => res.json())
        .then(data => {
            if(data.status === 'success') {
                const list = document.getElementById('brand-list');
                list.innerHTML = `<li onclick="filterByBrand('')">All Brands</li>`;
                data.data.forEach(brand => {
                    list.innerHTML += `<li onclick="filterByBrand('${brand}')">${brand}</li>`;
                });
            }
        });
}

function fetchProducts(category = '', brand = '') {
    let url = `${API_URL}?action=get_products`;
    if(category) url += `&category=${encodeURIComponent(category)}`;
    if(brand) url += `&brand=${encodeURIComponent(brand)}`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            if(data.status === 'success') {
                products = data.data;
                renderProducts(products);
            }
        });
}

function filterByCategory(cat) {
    document.getElementById('current-view-title').innerText = cat;
    document.getElementById('product-board').scrollIntoView({behavior: 'smooth'});
    fetchProducts(cat, '');
}

function filterByBrand(brand) {
    document.getElementById('current-view-title').innerText = brand ? brand : 'All Products';
    fetchProducts('', brand);
}

function filterBy(type) {
    if(type === 'all') {
        document.getElementById('current-view-title').innerText = 'All Products';
        fetchProducts();
    }
}

function renderProducts(items) {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = '';

    if(items.length === 0) {
        grid.innerHTML = '<p>No products found in this category.</p>';
        return;
    }

    items.forEach(p => {
        const outOfStock = p.in_stock == 0;
        const disabled = outOfStock ? 'disabled' : '';
        const badge = outOfStock ? '<span class="out-of-stock-badge">Sold Out</span>' : '';
        
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            ${badge}
            <div class="product-img-wrap">
                <img src="${p.image_url}" alt="${p.name}">
            </div>
            <div class="product-brand">${p.brand}</div>
            <h4 class="product-title">${p.name}</h4>
            <div class="product-price">$${parseFloat(p.price).toFixed(2)}</div>
            <button class="add-to-cart" ${disabled} onclick="addToCart(${p.id})">
                ${outOfStock ? 'Out of Stock' : 'Add to Cart'}
            </button>
        `;
        grid.appendChild(card);
    });
}

/* --- Cart Logic --- */
function toggleCart() {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('cart-overlay');
    
    if(sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
    } else {
        sidebar.classList.add('open');
        overlay.classList.add('show');
    }
}

function addToCart(id) {
    const product = products.find(p => p.id == id);
    if(!product) return;

    const existing = cart.find(item => item.id == id);
    if(existing) {
        existing.quantity += 1;
    } else {
        cart.push({...product, quantity: 1});
    }

    saveCart();
    renderCart();
    
    // Auto open cart
    document.getElementById('cart-sidebar').classList.add('open');
    document.getElementById('cart-overlay').classList.add('show');
}

function updateCartQty(id, change) {
    const item = cart.find(i => i.id == id);
    if(!item) return;
    
    item.quantity += change;
    if(item.quantity <= 0) {
        cart = cart.filter(i => i.id != id);
    }
    
    saveCart();
    renderCart();
}

function renderCart() {
    const container = document.getElementById('cart-items');
    const countEl = document.querySelector('.cart-count');
    const totalEl = document.getElementById('cart-total-price');
    const checkoutTotalEl = document.getElementById('checkout-total');
    
    container.innerHTML = '';
    
    if(cart.length === 0) {
        container.innerHTML = '<p class="empty-cart-msg">Your cart is empty.</p>';
        countEl.innerText = '0';
        totalEl.innerText = '$0.00';
        if(checkoutTotalEl) checkoutTotalEl.innerText = '$0.00';
        return;
    }

    let total = 0;
    let count = 0;

    cart.forEach(item => {
        total += item.price * item.quantity;
        count += item.quantity;

        const el = document.createElement('div');
        el.className = 'cart-item';
        el.innerHTML = `
            <img src="${item.image_url}" alt="${item.name}">
            <div class="cart-item-info">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">$${parseFloat(item.price).toFixed(2)}</div>
                <div class="cart-item-actions">
                    <button class="qty-btn" onclick="updateCartQty(${item.id}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="qty-btn" onclick="updateCartQty(${item.id}, 1)">+</button>
                </div>
            </div>
        `;
        container.appendChild(el);
    });

    countEl.innerText = count;
    totalEl.innerText = '$' + total.toFixed(2);
    if(checkoutTotalEl) checkoutTotalEl.innerText = '$' + total.toFixed(2);
}

function saveCart() {
    localStorage.setItem('rosellea_cart', JSON.stringify(cart));
}

function loadCart() {
    const saved = localStorage.getItem('rosellea_cart');
    if(saved) {
        cart = JSON.parse(saved);
        renderCart();
    }
}

/* --- Checkout Logic --- */
function openCheckout() {
    if (!currentUser) {
        alert("Please login first to proceed with your purchase.");
        toggleCart(); // close the cart sidebar
        openLogin();
        return;
    }
    if(cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }
    toggleCart(); // close sidebar
    document.getElementById('checkout-modal').classList.add('show');
}

function closeCheckout() {
    document.getElementById('checkout-modal').classList.remove('show');
}

document.getElementById('checkout-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('c_name').value;
    const address = document.getElementById('c_address').value;
    let total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    
    // Prepare items
    const items = cart.map(i => ({id: i.id, quantity: i.quantity, price: i.price}));

    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'checkout',
            customer_name: name,
            address: address,
            total_price: total,
            items: items
        })
    })
    .then(res => res.json())
    .then(data => {
        if(data.status === 'success') {
            alert('Purchase successful! Your beautiful order is on the way.');
            cart = [];
            saveCart();
            renderCart();
            closeCheckout();
            document.getElementById('checkout-form').reset();
        } else {
            alert('Error during checkout: ' + data.message);
        }
    });
});

/* --- Auth Logic --- */
function openLogin() {
    if (currentUser) {
        if (currentUser.role === 'seller') {
            window.location.href = 'seller.html';
        } else {
            openDashboard();
        }
    } else {
        document.getElementById('login-modal').classList.add('show');
    }
}

function closeLogin() {
    document.getElementById('login-modal').classList.remove('show');
}

function toggleAuthView(view) {
    if (view === 'register') {
        document.getElementById('login-view').style.display = 'none';
        document.getElementById('register-view').style.display = 'block';
    } else {
        document.getElementById('login-view').style.display = 'block';
        document.getElementById('register-view').style.display = 'none';
    }
}

function checkAuthStatus() {
    fetch(`${API_URL}?action=check_auth`)
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success' && data.authenticated) {
                currentUser = data.user;
                updateUIForAuth();
            }
        });
}

function toggleSellerFields() {
    const role = document.getElementById('r_role').value;
    document.getElementById('seller-fields').style.display = (role === 'seller') ? 'block' : 'none';
}

function updateUIForAuth() {
    const loginBtn = document.getElementById('login-trigger-btn');
    const sellerTab = document.querySelector('.id-seller-tab');
    
    if (currentUser) {
        loginBtn.innerHTML = `<ion-icon name="person-circle-outline"></ion-icon> <span>${currentUser.full_name.split(' ')[0]}</span>`;
        if (currentUser.role === 'seller') {
            window.location.href = 'seller.html'; // Redirect seller away from shop
            return;
        }
        
        // Auto-fill profile
        const up_role = document.getElementById('up_role');
        if(up_role) up_role.value = currentUser.role;

        // Auto-fill checkout if visible
        const c_name = document.getElementById('c_name');
        const c_address = document.getElementById('c_address');
        if (c_name && !c_name.value) c_name.value = currentUser.full_name;
        if (c_address && !c_address.value) c_address.value = currentUser.address;
    } else {
        loginBtn.innerHTML = `<ion-icon name="person-outline"></ion-icon> <span>Login</span>`;
    }
}

function logout() {
    fetch(`${API_URL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            currentUser = null;
            updateUIForAuth();
            alert("Successfully logged out.");
            closeDashboard();
        }
    });
}

/* --- Dashboard Logic --- */
function openDashboard() {
    if (!currentUser) return;
    
    // Fill profile fields
    document.getElementById('up_name').value = currentUser.full_name;
    document.getElementById('up_email').value = currentUser.email;
    document.getElementById('up_address').value = currentUser.address;
    
    document.getElementById('user-dashboard-modal').classList.add('show');
    fetchUserOrders();
}

function closeDashboard() {
    document.getElementById('user-dashboard-modal')?.classList.remove('show');
}

function switchDashTab(tab) {
    // Buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Content
    document.querySelectorAll('.dash-tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`dash-${tab}`).classList.add('active');
    
    if (tab === 'orders') fetchUserOrders();
    if (tab === 'seller') fetchSellerProducts();
}

function fetchSellerProducts() {
    const grid = document.getElementById('seller-product-grid');
    grid.innerHTML = '<p>Loading your catalog...</p>';
    
    fetch(`${API_URL}?action=get_my_products`)
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                renderSellerProducts(data.data);
            }
        });
}

function renderSellerProducts(items) {
    const grid = document.getElementById('seller-product-grid');
    grid.innerHTML = '';
    
    if (items.length === 0) {
        grid.innerHTML = '<p>Your catalog is empty.</p>';
        return;
    }

    items.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card mini-card';
        card.innerHTML = `
            <div class="product-img-wrap" style="height:120px;">
                <img src="${p.image_url}" alt="${p.name}">
            </div>
            <div class="product-title" style="font-size:0.9rem;">${p.name}</div>
            <div class="status-badge status-${p.status}" style="font-size:0.7rem;">${p.status.toUpperCase()}</div>
            <div class="seller-stock-badge">Stock: ${p.stock_quantity}</div>
            <div class="seller-actions">
                <button class="btn-primary btn-mini" onclick="requestStock(${p.id})">Refill</button>
                <button class="btn-danger btn-mini" onclick="setOutOfStock(${p.id})">OOS</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function setOutOfStock(id) {
    if(!confirm("Mark this product as out of stock instantly?")) return;
    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'instant_out_of_stock', product_id: id })
    }).then(() => fetchSellerProducts());
}

function requestStock(id) {
    const qty = prompt("How many units do you want to add? (Requires Admin Approval)");
    if (!qty || isNaN(qty)) return;
    
    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request_stock', product_id: id, quantity: parseInt(qty) })
    }).then(res => res.json()).then(data => alert(data.message));
}

function fetchUserOrders() {
    const container = document.getElementById('order-list-container');
    container.innerHTML = '<p>Loading your orders...</p>';
    
    fetch(`${API_URL}?action=get_user_orders`)
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                if (data.data.length === 0) {
                    container.innerHTML = '<p>You haven\'t placed any orders yet.</p>';
                } else {
                    renderDashboardOrders(data.data);
                }
            } else {
                container.innerHTML = '<p>Error loading orders: ' + data.message + '</p>';
            }
        });
}

function renderDashboardOrders(orders) {
    const container = document.getElementById('order-list-container');
    container.innerHTML = '';
    
    orders.forEach(order => {
        const card = document.createElement('div');
        card.className = 'order-card';
        
        let itemsHtml = order.items.map(item => `
            <div class="order-item-mini">
                <img src="${item.image_url}" alt="${item.name}">
                <span>${item.name} (x${item.quantity})</span>
            </div>
        `).join('');
        
        card.innerHTML = `
            <div class="order-card-header">
                <div>
                    <span class="order-id">Order #${order.id}</span>
                    <div class="order-date">${new Date(order.created_at).toLocaleDateString()}</div>
                </div>
                <span class="order-status">${order.status}</span>
            </div>
            <div class="order-items-mini">
                ${itemsHtml}
            </div>
            <div class="order-total-dash">Total: $${parseFloat(order.total_price).toFixed(2)}</div>
        `;
        container.appendChild(card);
    });
}

function logoutDashboard() {
    if (confirm("Are you sure you want to logout?")) {
        logout();
    }
}

// Update Profile Logic
document.getElementById('update-profile-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('up_name').value;
    const address = document.getElementById('up_address').value;
    
    updateUserProfile(name, address);
});

document.getElementById('update-address-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = currentUser.full_name;
    const address = document.getElementById('up_address').value;
    
    updateUserProfile(name, address);
});

function updateUserProfile(name, address) {
    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'update_profile',
            full_name: name,
            address: address
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            alert(data.message);
            currentUser.full_name = name;
            currentUser.address = address;
            updateUIForAuth();
        } else {
            alert('Update failed: ' + data.message);
        }
    });
}

// Handle Login Form
document.getElementById('login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('l_email').value;
    const password = document.getElementById('l_password').value;

    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'login',
            email: email,
            password: password
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            currentUser = data.user;
            updateUIForAuth();
            closeLogin();
            document.getElementById('login-form').reset();
            alert('Welcome back, ' + currentUser.full_name + '!');
        } else {
            alert('Login failed: ' + data.message);
        }
    });
});

// Handle Register Form
document.getElementById('register-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('r_name').value;
    const email = document.getElementById('r_email').value;
    const password = document.getElementById('r_password').value;
    const address = document.getElementById('r_address').value;
    const role = document.getElementById('r_role').value;
    
    // Seller only fields
    const company = document.getElementById('r_company').value;
    const phone = document.getElementById('r_phone').value;
    const desc = document.getElementById('r_comp_desc').value;

    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'register',
            full_name: name,
            email: email,
            password: password,
            address: address,
            role: role,
            company_name: company,
            phone: phone,
            company_description: desc
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            alert('Account created! You can now login.');
            toggleAuthView('login');
            document.getElementById('register-form').reset();
        } else {
            alert('Registration failed: ' + data.message);
        }
    });
});

function openAddProductModal() {
    document.getElementById('add-product-modal').classList.add('show');
}
function closeAddProductModal() {
    document.getElementById('add-product-modal').classList.remove('show');
}

document.getElementById('add-product-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('action', 'add_product');
    formData.append('name', document.getElementById('p_name').value);
    formData.append('category', document.getElementById('p_category').value);
    formData.append('brand', document.getElementById('p_brand').value);
    formData.append('price', document.getElementById('p_price').value);
    formData.append('description', document.getElementById('p_desc').value);
    
    const fileInput = document.getElementById('p_image');
    if(fileInput.files.length > 0) formData.append('image_upload', fileInput.files[0]);

    fetch(API_URL, {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(res => {
        if(res.status === 'success') {
            alert(res.message);
            closeAddProductModal();
            document.getElementById('add-product-form').reset();
            if (typeof fetchSellerProducts === 'function') fetchSellerProducts();
        }
    });
});
