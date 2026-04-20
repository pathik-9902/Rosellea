/* Admin Logic for Rosellea */

const API_URL = 'api.php';

document.addEventListener("DOMContentLoaded", () => {
    fetchAdminProducts();
    // Pre-check for admin role could be added here
});

function switchAdminTab(tab) {
    document.querySelectorAll('.tab-link').forEach(link => link.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    document.querySelectorAll('.admin-tab-panel').forEach(panel => panel.classList.remove('active'));
    document.getElementById(`admin-${tab}-panel`).classList.add('active');
    
    if (tab === 'moderation') fetchModerationQueue();
    if (tab === 'stock-req') fetchStockRequests();
    if (tab === 'products') fetchAdminProducts();
    if (tab === 'seller-apps') fetchSellerApps();
}

function fetchSellerApps() {
    const tbody = document.getElementById('seller-apps-list');
    tbody.innerHTML = '<tr><td colspan="5">Loading applications...</td></tr>';
    
    fetch(`${API_URL}?action=get_seller_applications`)
        .then(res => {
            if (!res.ok) throw new Error('Network response was not ok');
            return res.json();
        })
        .then(data => {
            if (data.status === 'success') {
                renderSellerApps(data.data);
            } else {
                tbody.innerHTML = `<tr><td colspan="5" style="color:red">Error: ${data.message}</td></tr>`;
            }
        })
        .catch(err => {
            console.error('Fetch error:', err);
            tbody.innerHTML = `<tr><td colspan="5" style="color:red">Failed to load: ${err.message}</td></tr>`;
        });
}

function renderSellerApps(items) {
    const tbody = document.getElementById('seller-apps-list');
    tbody.innerHTML = items.length === 0 ? '<tr><td colspan="5">No pending seller requests.</td></tr>' : '';
    
    items.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${s.full_name}</td>
            <td>${s.email}</td>
            <td><strong>${s.company_name}</strong></td>
            <td>${s.phone}</td>
            <td>
                <button class="btn-small btn-toggle" onclick="moderateSeller(${s.id}, 'active')" style="background:#28a745; color:white;">Approve</button>
                <button class="btn-small btn-danger" onclick="moderateSeller(${s.id}, 'rejected')">Reject</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function moderateSeller(id, status) {
    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'moderate_seller', user_id: id, status: status })
    }).then(res => res.json()).then(data => {
        alert(data.message);
        fetchSellerApps();
    });
}

function fetchAdminProducts() {
    fetch(`${API_URL}?action=get_products`)
        .then(res => res.json())
        .then(data => {
            if(data.status === 'success') {
                renderAdminList(data.data);
            } else {
                alert("Error fetching products: " + data.message);
            }
        })
        .catch(err => console.error("Admin fetch error:", err));
}

function renderAdminList(items) {
    const tbody = document.getElementById('admin-product-list');
    tbody.innerHTML = '';

    items.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><img src="${p.image_url}" alt="${p.name}"></td>
            <td><strong>${p.name}</strong></td>
            <td>${p.category}</td>
            <td>$${parseFloat(p.price).toFixed(2)}</td>
            <td>${p.stock_quantity} (Toggle: ${p.in_stock == 1 ? 'ON' : 'OFF'})</td>
            <td><span class="status-badge status-${p.status}">${p.status.toUpperCase()}</span></td>
            <td>
                <button class="btn-small btn-toggle" onclick="toggleStock(${p.id}, ${p.in_stock == 1 ? 0 : 1})">Toggle OOS</button>
                <button class="btn-small btn-danger" onclick="deleteProduct(${p.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/* MODERATION */
function fetchModerationQueue() {
    const tbody = document.getElementById('moderation-list');
    tbody.innerHTML = '<tr><td colspan="4">Loading queue...</td></tr>';
    
    fetch(`${API_URL}?action=get_moderation_queue`)
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                renderModerationQueue(data.data);
            } else {
                tbody.innerHTML = `<tr><td colspan="4" style="color:red">Error: ${data.message}</td></tr>`;
            }
        })
        .catch(err => {
            tbody.innerHTML = `<tr><td colspan="4" style="color:red">Failed: ${err.message}</td></tr>`;
        });
}

function renderModerationQueue(items) {
    const tbody = document.getElementById('moderation-list');
    tbody.innerHTML = items.length === 0 ? '<tr><td colspan="4">No pending submissions.</td></tr>' : '';
    
    items.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${p.name}</strong><br><small>${p.brand}</small></td>
            <td>${p.seller_name || 'House Admin'}</td>
            <td>Category: ${p.category}<br>Price: $${p.price}</td>
            <td>
                <button class="btn-small btn-toggle" onclick="moderateProduct(${p.id}, 'approve')" style="background:#28a745; color:white;">Approve</button>
                <button class="btn-small btn-danger" onclick="moderateProduct(${p.id}, 'reject')">Reject</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function moderateProduct(id, action) {
    const endpoint = action === 'approve' ? 'approve_product' : 'reject_product';
    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: endpoint, id: id })
    }).then(() => fetchModerationQueue());
}

/* STOCK REQUESTS */
function fetchStockRequests() {
    const tbody = document.getElementById('stock-requests-list');
    tbody.innerHTML = '<tr><td colspan="4">Loading requests...</td></tr>';
    
    fetch(`${API_URL}?action=get_stock_requests`)
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                renderStockRequests(data.data);
            } else {
                tbody.innerHTML = `<tr><td colspan="4" style="color:red">Error: ${data.message}</td></tr>`;
            }
        })
        .catch(err => {
            tbody.innerHTML = `<tr><td colspan="4" style="color:red">Failed: ${err.message}</td></tr>`;
        });
}

function renderStockRequests(items) {
    const tbody = document.getElementById('stock-requests-list');
    tbody.innerHTML = items.length === 0 ? '<tr><td colspan="4">No pending stock requests.</td></tr>' : '';
    
    items.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${r.product_name}</strong></td>
            <td>${r.seller_name}</td>
            <td>+ ${r.requested_quantity} units</td>
            <td>
                <button class="btn-small btn-toggle" onclick="approveStock(${r.id})" style="background:#28a745; color:white;">Approve Increase</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function approveStock(requestId) {
    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve_stock', request_id: requestId })
    }).then(res => res.json()).then(data => {
        alert(data.message);
        fetchStockRequests();
    });
}

function toggleStock(id, newStatus) {
    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_stock', id: id, in_stock: newStatus })
    }).then(() => fetchAdminProducts());
}

function deleteProduct(id) {
    if(!confirm('Delete this product?')) return;
    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_product', id: id })
    }).then(() => fetchAdminProducts());
}

/* Modals */
function openAddModal() {
    document.getElementById('add-product-modal').classList.add('show');
}
function closeAddModal() {
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

    fetch(API_URL, { method: 'POST', body: formData })
    .then(res => res.json())
    .then(res => {
        if(res.status === 'success') {
            alert('Product added/submitted!');
            closeAddModal();
            document.getElementById('add-product-form').reset();
            fetchAdminProducts();
        }
    });
});

function adminLogout() {
    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' })
    }).then(() => {
        window.location.href = 'admin_login.html';
    });
}
