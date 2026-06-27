// Admin Management Functions

// ========== FOODS MANAGEMENT ==========
function openFoodsManagement() {
    const modal = document.getElementById('adminFoodsModal');
    if (!modal) {
        createAdminFoodsModal();
    }
    renderFoodsList();
    openModal('adminFoodsModal');
}

function renderFoodsList() {
    const container = document.getElementById('adminFoodsContainer');
    if (!container) return;

    const foods = JSON.parse(localStorage.getItem('storeMenuData')) || (typeof foodMenu !== 'undefined' ? foodMenu : []);

    container.innerHTML = `
        <div style="margin-bottom:20px;">
            <h3>Quản Lý Món Ăn</h3>
            <button class="action-btn" onclick="openAddFoodForm()" style="background:#2ed573;">
                <i class="fa-solid fa-plus"></i> Thêm Món Mới
            </button>
        </div>
        <div class="admin-table">
            <table style="width:100%; border-collapse:collapse;">
                <thead style="background:#f0f4f8;">
                    <tr>
                        <th style="padding:12px; text-align:left;">Tên Món</th>
                        <th style="padding:12px; text-align:left;">Giá</th>
                        <th style="padding:12px; text-align:left;">Danh Mục</th>
                        <th style="padding:12px; text-align:left;">Quán</th>
                        <th style="padding:12px; text-align:center;">Hành Động</th>
                    </tr>
                </thead>
                <tbody>
                    ${foods.map((food, idx) => `
                        <tr style="border-bottom:1px solid #e9eef6;">
                            <td style="padding:12px;">${food.name}</td>
                            <td style="padding:12px;">${food.price.toLocaleString('vi-VN')}đ</td>
                            <td style="padding:12px;">${food.category || '-'}</td>
                            <td style="padding:12px;">${food.restaurant || '-'}</td>
                            <td style="padding:12px; text-align:center;">
                                <button class="action-btn" onclick="editFood(${idx})" style="padding:6px 12px; background:#3498db; margin-right:4px;">Sửa</button>
                                <button class="action-btn" onclick="deleteFood(${idx})" style="padding:6px 12px; background:#ff6b81;">Xóa</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            ${foods.length === 0 ? '<p style="padding:20px; text-align:center; color:#57606f;">Chưa có món ăn nào.</p>' : ''}
        </div>
    `;
}

function openAddFoodForm() {
    const form = document.getElementById('adminFoodForm');
    if (!form) return;
    form.innerHTML = `
        <h4>Thêm Món Ăn Mới</h4>
        <input type="text" id="foodName" placeholder="Tên món" style="width:100%; padding:8px; margin:8px 0; border:1px solid #dfe4ea; border-radius:4px;">
        <input type="number" id="foodPrice" placeholder="Giá" style="width:100%; padding:8px; margin:8px 0; border:1px solid #dfe4ea; border-radius:4px;">
        <input type="text" id="foodCategory" placeholder="Danh mục" style="width:100%; padding:8px; margin:8px 0; border:1px solid #dfe4ea; border-radius:4px;">
        <input type="text" id="foodRestaurant" placeholder="Quán" style="width:100%; padding:8px; margin:8px 0; border:1px solid #dfe4ea; border-radius:4px;">
        <textarea id="foodDescription" placeholder="Mô tả" style="width:100%; height:60px; padding:8px; margin:8px 0; border:1px solid #dfe4ea; border-radius:4px;"></textarea>
        <div style="display:flex; gap:8px;">
            <button class="action-btn" onclick="saveNewFood()" style="flex:1; background:#2ed573;">Lưu</button>
            <button class="action-btn" onclick="cancelFoodEdit()" style="flex:1; background:#a4b0bd;">Hủy</button>
        </div>
    `;
}

function saveNewFood() {
    const name = document.getElementById('foodName')?.value.trim();
    const price = parseInt(document.getElementById('foodPrice')?.value) || 0;
    const category = document.getElementById('foodCategory')?.value.trim();
    const restaurant = document.getElementById('foodRestaurant')?.value.trim();
    const description = document.getElementById('foodDescription')?.value.trim();

    if (!name || price <= 0) {
        showToast('Vui lòng nhập tên và giá hợp lệ.', 'error');
        return;
    }

    let foods = JSON.parse(localStorage.getItem('storeMenuData')) || [];
    foods.push({
        name, price, category, restaurant, description,
        image: 'https://via.placeholder.com/500?text=' + encodeURIComponent(name),
        alt: name
    });
    localStorage.setItem('storeMenuData', JSON.stringify(foods));
    showToast('Thêm món ăn thành công!', 'success');
    renderFoodsList();
    cancelFoodEdit();
    updateAdminStats();
}

function editFood(idx) {
    let foods = JSON.parse(localStorage.getItem('storeMenuData')) || [];
    const food = foods[idx];
    if (!food) return;

    const form = document.getElementById('adminFoodForm');
    if (!form) return;
    form.innerHTML = `
        <h4>Chỉnh Sửa Món Ăn</h4>
        <input type="text" id="foodName" value="${food.name}" placeholder="Tên món" style="width:100%; padding:8px; margin:8px 0; border:1px solid #dfe4ea; border-radius:4px;">
        <input type="number" id="foodPrice" value="${food.price}" placeholder="Giá" style="width:100%; padding:8px; margin:8px 0; border:1px solid #dfe4ea; border-radius:4px;">
        <input type="text" id="foodCategory" value="${food.category || ''}" placeholder="Danh mục" style="width:100%; padding:8px; margin:8px 0; border:1px solid #dfe4ea; border-radius:4px;">
        <input type="text" id="foodRestaurant" value="${food.restaurant || ''}" placeholder="Quán" style="width:100%; padding:8px; margin:8px 0; border:1px solid #dfe4ea; border-radius:4px;">
        <textarea id="foodDescription" placeholder="Mô tả" style="width:100%; height:60px; padding:8px; margin:8px 0; border:1px solid #dfe4ea; border-radius:4px;">${food.description || ''}</textarea>
        <div style="display:flex; gap:8px;">
            <button class="action-btn" onclick="saveEditedFood(${idx})" style="flex:1; background:#3498db;">Cập nhật</button>
            <button class="action-btn" onclick="cancelFoodEdit()" style="flex:1; background:#a4b0bd;">Hủy</button>
        </div>
    `;
}

function saveEditedFood(idx) {
    let foods = JSON.parse(localStorage.getItem('storeMenuData')) || [];
    if (idx >= foods.length) return;

    foods[idx].name = document.getElementById('foodName')?.value.trim() || foods[idx].name;
    foods[idx].price = parseInt(document.getElementById('foodPrice')?.value) || foods[idx].price;
    foods[idx].category = document.getElementById('foodCategory')?.value.trim() || foods[idx].category;
    foods[idx].restaurant = document.getElementById('foodRestaurant')?.value.trim() || foods[idx].restaurant;
    foods[idx].description = document.getElementById('foodDescription')?.value.trim() || foods[idx].description;

    localStorage.setItem('storeMenuData', JSON.stringify(foods));
    showToast('Cập nhật món ăn thành công!', 'success');
    renderFoodsList();
    cancelFoodEdit();
}

function deleteFood(idx) {
    if (!confirm('Bạn chắc chắn muốn xóa món này?')) return;
    let foods = JSON.parse(localStorage.getItem('storeMenuData')) || [];
    foods.splice(idx, 1);
    localStorage.setItem('storeMenuData', JSON.stringify(foods));
    showToast('Xóa món ăn thành công!', 'success');
    renderFoodsList();
    updateAdminStats();
}

function cancelFoodEdit() {
    const form = document.getElementById('adminFoodForm');
    if (form) form.innerHTML = '';
}

function createAdminFoodsModal() {
    const modals = document.querySelector('.modals-container');
    if (!modals) return;
    const modal = document.createElement('div');
    modal.id = 'adminFoodsModal';
    modal.className = 'modal';
    modal.style.cssText = 'display:none; flex-direction:column; justify-content:flex-start; overflow-y:auto; padding:20px;';
    modal.innerHTML = `
        <button class="close-btn" onclick="closeModal('adminFoodsModal')" style="position:absolute; top:10px; right:10px; background:none; border:none; font-size:24px; cursor:pointer;">✕</button>
        <div id="adminFoodsContainer"></div>
        <div id="adminFoodForm" style="margin-top:20px; padding:16px; background:#f5f7fb; border-radius:8px;"></div>
    `;
    modals.appendChild(modal);
}

// ========== CATEGORIES MANAGEMENT ==========
function openCategoriesManagement() {
    showToast('Tính năng quản lý danh mục sẽ sớm được cập nhật!', 'info');
}

// ========== CUSTOMERS MANAGEMENT ==========
function openCustomersManagement() {
    const modal = document.getElementById('adminCustomersModal');
    if (!modal) {
        createAdminCustomersModal();
    }
    renderCustomersList();
    openModal('adminCustomersModal');
}

function renderCustomersList() {
    const container = document.getElementById('adminCustomersContainer');
    if (!container) return;

    const usersDb = JSON.parse(localStorage.getItem('usersDb')) || {};
    const customers = Object.entries(usersDb).filter(([key, user]) =>
        user && user.role !== 'admin'
    );

    container.innerHTML = `
        <h3>Quản Lý Khách Hàng (${customers.length})</h3>
        <div class="admin-table">
            <table style="width:100%; border-collapse:collapse;">
                <thead style="background:#f0f4f8;">
                    <tr>
                        <th style="padding:12px; text-align:left;">Tên</th>
                        <th style="padding:12px; text-align:left;">Email</th>
                        <th style="padding:12px; text-align:left;">SĐT</th>
                        <th style="padding:12px; text-align:left;">Tổng Chi</th>
                        <th style="padding:12px; text-align:center;">Hành Động</th>
                    </tr>
                </thead>
                <tbody>
                    ${customers.map(([username, user]) => `
                        <tr style="border-bottom:1px solid #e9eef6;">
                            <td style="padding:12px;">${username}</td>
                            <td style="padding:12px;">${user.email || '-'}</td>
                            <td style="padding:12px;">${user.phone || '-'}</td>
                            <td style="padding:12px;">${(user.totalSpent || 0).toLocaleString('vi-VN')}đ</td>
                            <td style="padding:12px; text-align:center;">
                                <button class="action-btn" onclick="viewCustomerDetails('${username}')" style="padding:6px 12px; background:#3498db;">Chi tiết</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            ${customers.length === 0 ? '<p style="padding:20px; text-align:center; color:#57606f;">Chưa có khách hàng nào.</p>' : ''}
        </div>
    `;
}

function viewCustomerDetails(username) {
    const usersDb = JSON.parse(localStorage.getItem('usersDb')) || {};
    const user = usersDb[username];
    if (!user) return;

    const history = user.history || [];
    alert(`
Khách Hàng: ${username}
Email: ${user.email || '-'}
Điện Thoại: ${user.phone || '-'}
Địa Chỉ: ${user.address || '-'}
Tổng Chi: ${(user.totalSpent || 0).toLocaleString('vi-VN')}đ
Điểm Tích Lũy: ${user.points || 0}
Số Đơn: ${history.length}
    `);
}

function createAdminCustomersModal() {
    const modals = document.querySelector('.modals-container');
    if (!modals) return;
    const modal = document.createElement('div');
    modal.id = 'adminCustomersModal';
    modal.className = 'modal';
    modal.style.cssText = 'display:none; flex-direction:column; justify-content:flex-start; overflow-y:auto; padding:20px;';
    modal.innerHTML = `
        <button class="close-btn" onclick="closeModal('adminCustomersModal')" style="position:absolute; top:10px; right:10px; background:none; border:none; font-size:24px; cursor:pointer;">✕</button>
        <div id="adminCustomersContainer"></div>
    `;
    modals.appendChild(modal);
}

// ========== ORDERS MANAGEMENT ==========
function openOrdersManagement() {
    const modal = document.getElementById('adminOrdersModal');
    if (!modal) {
        createAdminOrdersModal();
    }
    renderOrdersList();
    openModal('adminOrdersModal');
}

function renderOrdersList() {
    const container = document.getElementById('adminOrdersContainer');
    if (!container) return;

    const usersDb = JSON.parse(localStorage.getItem('usersDb')) || {};
    let orders = [];

    Object.keys(usersDb).forEach(user => {
        const history = usersDb[user].history || [];
        history.forEach(order => {
            orders.push({ customer: user, ...order });
        });
    });

    container.innerHTML = `
        <h3>Quản Lý Đơn Hàng (${orders.length})</h3>
        <div class="admin-table">
            <table style="width:100%; border-collapse:collapse; font-size:13px;">
                <thead style="background:#f0f4f8;">
                    <tr>
                        <th style="padding:8px; text-align:left;">ID</th>
                        <th style="padding:8px; text-align:left;">Khách</th>
                        <th style="padding:8px; text-align:left;">Tổng</th>
                        <th style="padding:8px; text-align:left;">Trạng Thái</th>
                        <th style="padding:8px; text-align:left;">Ngày</th>
                    </tr>
                </thead>
                <tbody>
                    ${orders.slice().reverse().map(order => `
                        <tr style="border-bottom:1px solid #e9eef6;">
                            <td style="padding:8px;">#${order.id}</td>
                            <td style="padding:8px;">${order.customer}</td>
                            <td style="padding:8px;">${(order.total || 0).toLocaleString('vi-VN')}đ</td>
                            <td style="padding:8px;">
                                <span style="display:inline-block; padding:4px 8px; border-radius:4px; background:${getStatusColor(order.status)}; color:#fff; font-size:11px;">
                                    ${order.status}
                                </span>
                            </td>
                            <td style="padding:8px; font-size:12px;">${order.date}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            ${orders.length === 0 ? '<p style="padding:20px; text-align:center; color:#57606f;">Chưa có đơn hàng nào.</p>' : ''}
        </div>
    `;
}

function createAdminOrdersModal() {
    const modals = document.querySelector('.modals-container');
    if (!modals) return;
    const modal = document.createElement('div');
    modal.id = 'adminOrdersModal';
    modal.className = 'modal';
    modal.style.cssText = 'display:none; flex-direction:column; justify-content:flex-start; overflow-y:auto; padding:20px;';
    modal.innerHTML = `
        <button class="close-btn" onclick="closeModal('adminOrdersModal')" style="position:absolute; top:10px; right:10px; background:none; border:none; font-size:24px; cursor:pointer;">✕</button>
        <div id="adminOrdersContainer"></div>
    `;
    modals.appendChild(modal);
}

// ========== DELIVERIES MANAGEMENT ==========
function openDeliveriesManagement() {
    showToast('Tính năng quản lý giao hàng sẽ sớm được cập nhật!', 'info');
}

// ========== PROMOTIONS MANAGEMENT ==========
function openPromotionsManagement() {
    showToast('Tính năng quản lý khuyến mãi sẽ sớm được cập nhật!', 'info');
}

// ========== REVIEWS MANAGEMENT ==========
function openReviewsManagement() {
    showToast('Tính năng quản lý đánh giá sẽ sớm được cập nhật!', 'info');
}

// ========== REPORTS EXPORT ==========
function exportReports() {
    updateAdminStats();
    const report = `
=== BÁO CÁO QUẢN TRỊ VIÊN ===
Ngày: ${new Date().toLocaleString('vi-VN')}

THỐNG KÊ CHUNG:
- Tổng Món Ăn: ${adminStats.totalFoods}
- Tổng Khách Hàng: ${adminStats.totalCustomers}
- Tổng Đơn Hàng: ${adminStats.totalOrders}

DOANH THU:
- Hôm nay: ${adminStats.todayRevenue.toLocaleString('vi-VN')}đ
- Tháng này: ${adminStats.monthRevenue.toLocaleString('vi-VN')}đ
- Năm nay: ${adminStats.yearRevenue.toLocaleString('vi-VN')}đ
- Tổng cộng: ${adminStats.totalRevenue.toLocaleString('vi-VN')}đ
    `;

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `BaoCao_QuanTri_${new Date().getTime()}.txt`;
    link.click();
    showToast('Đã tải báo cáo!', 'success');
}
