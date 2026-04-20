/* Seller Dashboard Logic */
const API_URL = 'api.php';
let sellerData = null;
let sellerProfile = null;

document.addEventListener("DOMContentLoaded", () => {
    checkSellerAuth();
});

function checkSellerAuth() {
    fetch(`${API_URL}?action=check_auth`)
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success' && data.authenticated && data.user.role === 'seller') {
                sellerData = data.user;
                document.getElementById('seller-welcome').innerText = `Welcome, ${sellerData.full_name}!`;
                loadSellerDashboard();
            } else {
                window.location.href = 'index.html'; // Redirect non-sellers back to shop
            }
        });
}

function loadSellerDashboard() {
    fetchCompanyDetails();
    fetchSellerInventory();
}

function fetchCompanyDetails() {
    fetch(`${API_URL}?action=get_seller_profile`)
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                sellerProfile = data.data;
                document.getElementById('view-company-name').innerText = sellerProfile.company_name || 'No Brand Name Set';
                document.getElementById('view-company-desc').innerText = sellerProfile.company_description || 'No description provided.';
                document.getElementById('view-company-phone').innerText = sellerProfile.phone || 'No phone listed.';
            }
        });
}

function fetchSellerInventory() {
    fetch(`${API_URL}?action=get_my_products`)
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                renderSellerInventory(data.data);
                updateSellerStats(data.data);
            }
        });
}

function renderSellerInventory(items) {
    const grid = document.getElementById('seller-prods');
    grid.innerHTML = items.length === 0 ? '<p>No products in your catalog yet.</p>' : '';
    
    items.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-img-wrap" style="height:150px;">
                <img src="${p.image_url}" alt="${p.name}">
            </div>
            <div class="product-info">
                <span class="product-category">${p.category}</span>
                <h3 class="product-title">${p.name}</h3>
                <div class="status-badge status-${p.status}" style="font-size:0.7rem; margin-bottom: 10px;">${p.status.toUpperCase()}</div>
                <div style="font-weight:700; color:var(--primary-dark);">Stock: ${p.stock_quantity}</div>
                <div style="display:flex; gap:10px; margin-top:10px;">
                    <button class="btn-primary" style="padding: 5px 10px; font-size:0.8rem;" onclick="requestStockIncrease(${p.id})">Refill</button>
                    <button class="btn-danger" style="padding: 5px 10px; font-size:0.8rem;" onclick="markOOS(${p.id})">OOS</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function updateSellerStats(items) {
    document.getElementById('stat-live').innerText = items.filter(i => i.status === 'active').length;
    document.getElementById('stat-pending').innerText = items.filter(i => i.status === 'pending').length;
    document.getElementById('stat-stock').innerText = items.reduce((sum, i) => sum + parseInt(i.stock_quantity), 0);
}

function switchSellerTab(tab) {
    document.querySelectorAll('.seller-nav-btn').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    document.querySelectorAll('.seller-panel').forEach(p => p.style.display = 'none');
    document.getElementById(`seller-${tab}-panel`).style.display = 'block';
}

function requestStockIncrease(id) {
    const qty = prompt("Requested units to add:");
    if (!qty || isNaN(qty)) return;
    
    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request_stock', product_id: id, quantity: parseInt(qty) })
    }).then(res => res.json()).then(data => alert(data.message));
}

function markOOS(id) {
    if(!confirm("Mark as Out of Stock?")) return;
    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'instant_out_of_stock', product_id: id })
    }).then(() => fetchSellerInventory());
}

function openAddModal() { document.getElementById('add-product-modal').classList.add('show'); }
function closeAddModal() { document.getElementById('add-product-modal').classList.remove('show'); }

document.getElementById('add-product-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('action', 'add_product');
    formData.append('name', document.getElementById('p_name').value);
    formData.append('category', document.getElementById('p_category').value);
    formData.append('brand', document.getElementById('p_brand').value);
    formData.append('price', document.getElementById('p_price').value);
    formData.append('description', document.getElementById('p_desc').value);
    
    const imageFile = document.getElementById('p_image').files[0];
    if (imageFile) {
        formData.append('image_upload', imageFile);
    }

    fetch(API_URL, {
        method: 'POST',
        body: formData
    }).then(res => res.json()).then(data => {
        alert(data.message);
        document.getElementById('add-product-form').reset();
        closeAddModal();
        fetchSellerInventory();
    });
});

function sellerLogout() {
    fetch(`${API_URL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' })
    }).then(() => window.location.href = 'index.html');
}

/* Edit Profile Logic */
function openEditProfileModal() {
    if (!sellerProfile) return;
    document.getElementById('edit_company_name').value = sellerProfile.company_name || '';
    document.getElementById('edit_company_desc').value = sellerProfile.company_description || '';
    document.getElementById('edit_company_phone').value = sellerProfile.phone || '';
    document.getElementById('edit-profile-modal').classList.add('show');
}

function closeEditProfileModal() {
    document.getElementById('edit-profile-modal').classList.remove('show');
}

document.getElementById('edit-profile-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const payload = {
        action: 'update_seller_profile',
        company_name: document.getElementById('edit_company_name').value,
        company_description: document.getElementById('edit_company_desc').value,
        phone: document.getElementById('edit_company_phone').value
    };

    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).then(res => res.json()).then(data => {
        alert(data.message);
        if (data.status === 'success') {
            closeEditProfileModal();
            fetchCompanyDetails();
        }
    });
});
