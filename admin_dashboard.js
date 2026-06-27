// Admin Dashboard Module

const ADMIN_STATS_KEY = 'adminStats';
let adminStats = {
    totalFoods: 0,
    totalCustomers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    monthRevenue: 0,
    yearRevenue: 0
};

// Load admin stats
function loadAdminStats() {
    try {
        const saved = localStorage.getItem(ADMIN_STATS_KEY);
        adminStats = saved ? JSON.parse(saved) : adminStats;
    } catch (error) {
        // Keep default values
    }
}

// Calculate and update admin stats
function updateAdminStats() {
    const usersDb = JSON.parse(localStorage.getItem('usersDb')) || {};
    const foods = JSON.parse(localStorage.getItem('storeMenuData')) || [];
    const orderStatusData = JSON.parse(localStorage.getItem('orderStatusData')) || {};

    // Count customers (excluding admin)
    adminStats.totalCustomers = Object.keys(usersDb).filter(key => {
        const user = usersDb[key];
        return user && user.role !== 'admin';
    }).length;

    // Count foods
    adminStats.totalFoods = foods.length || (typeof foodMenu !== 'undefined' ? foodMenu.length : 0);

    // Count orders
    let totalRevenue = 0;
    let todayRevenue = 0;
    let monthRevenue = 0;
    let yearRevenue = 0;
    let orderCount = 0;

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    Object.keys(usersDb).forEach(user => {
        const history = usersDb[user].history || [];
        history.forEach(order => {
            if (order.total && !order.canceled) {
                totalRevenue += order.total;
                orderCount++;

                const orderDate = new Date(order.date);
                if (orderDate.toDateString() === today.toDateString()) {
                    todayRevenue += order.total;
                }
                if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
                    monthRevenue += order.total;
                }
                if (orderDate.getFullYear() === currentYear) {
                    yearRevenue += order.total;
                }
            }
        });
    });

    adminStats.totalOrders = orderCount;
    adminStats.totalRevenue = totalRevenue;
    adminStats.todayRevenue = todayRevenue;
    adminStats.monthRevenue = monthRevenue;
    adminStats.yearRevenue = yearRevenue;

    localStorage.setItem(ADMIN_STATS_KEY, JSON.stringify(adminStats));
}

// Open admin dashboard
function openAdminDashboard() {
    if (!isCurrentUserAdmin()) {
        showToast('Chỉ admin mới có thể truy cập dashboard.', 'error');
        return;
    }

    updateAdminStats();
    const modal = document.getElementById('adminDashboardModal');
    if (!modal) {
        createAdminDashboardModal();
    }

    renderAdminDashboard();
    openModal('adminDashboardModal');
}

// Render admin dashboard
function renderAdminDashboard() {
    const container = document.getElementById('adminDashboardContainer');
    if (!container) return;

    container.innerHTML = `
        <div class="admin-dashboard">
            <h2 style="margin-top:0;">Dashboard Quản Trị</h2>
            
            <div class="admin-stats-grid">
                <div class="stat-card">
                    <i class="fa-solid fa-utensils" style="font-size:32px; color:#2ed573;"></i>
                    <div class="stat-info">
                        <span class="stat-label">Tổng Món Ăn</span>
                        <span class="stat-value">${adminStats.totalFoods}</span>
                    </div>
                </div>

                <div class="stat-card">
                    <i class="fa-solid fa-users" style="font-size:32px; color:#3498db;"></i>
                    <div class="stat-info">
                        <span class="stat-label">Tổng Khách Hàng</span>
                        <span class="stat-value">${adminStats.totalCustomers}</span>
                    </div>
                </div>

                <div class="stat-card">
                    <i class="fa-solid fa-receipt" style="font-size:32px; color:#f39c12;"></i>
                    <div class="stat-info">
                        <span class="stat-label">Tổng Đơn Hàng</span>
                        <span class="stat-value">${adminStats.totalOrders}</span>
                    </div>
                </div>

                <div class="stat-card">
                    <i class="fa-solid fa-coins" style="font-size:32px; color:#9b59b6;"></i>
                    <div class="stat-info">
                        <span class="stat-label">Doanh Thu Tổng</span>
                        <span class="stat-value">${(adminStats.totalRevenue / 1000000).toFixed(1)}M</span>
                    </div>
                </div>
            </div>

            <div class="admin-revenue-section">
                <h3>Doanh Thu</h3>
                <div class="revenue-cards">
                    <div class="revenue-card">
                        <span class="revenue-label">Hôm nay</span>
                        <span class="revenue-value">${adminStats.todayRevenue.toLocaleString('vi-VN')}đ</span>
                    </div>
                    <div class="revenue-card">
                        <span class="revenue-label">Tháng này</span>
                        <span class="revenue-value">${adminStats.monthRevenue.toLocaleString('vi-VN')}đ</span>
                    </div>
                    <div class="revenue-card">
                        <span class="revenue-label">Năm nay</span>
                        <span class="revenue-value">${adminStats.yearRevenue.toLocaleString('vi-VN')}đ</span>
                    </div>
                </div>
            </div>

            <div class="admin-management-section">
                <h3>Quản Lý</h3>
                <div class="admin-menu-grid">
                    <button class="admin-menu-btn" onclick="openFoodsManagement()">
                        <i class="fa-solid fa-burger"></i>
                        <span>Quản Lý Món Ăn</span>
                    </button>
                    <button class="admin-menu-btn" onclick="openCategoriesManagement()">
                        <i class="fa-solid fa-list"></i>
                        <span>Quản Lý Danh Mục</span>
                    </button>
                    <button class="admin-menu-btn" onclick="openCustomersManagement()">
                        <i class="fa-solid fa-users"></i>
                        <span>Quản Lý Khách Hàng</span>
                    </button>
                    <button class="admin-menu-btn" onclick="openOrdersManagement()">
                        <i class="fa-solid fa-receipt"></i>
                        <span>Quản Lý Đơn Hàng</span>
                    </button>
                    <button class="admin-menu-btn" onclick="openDeliveriesManagement()">
                        <i class="fa-solid fa-truck"></i>
                        <span>Quản Lý Giao Hàng</span>
                    </button>
                    <button class="admin-menu-btn" onclick="openPromotionsManagement()">
                        <i class="fa-solid fa-tag"></i>
                        <span>Quản Lý Khuyến Mãi</span>
                    </button>
                    <button class="admin-menu-btn" onclick="openReviewsManagement()">
                        <i class="fa-solid fa-star"></i>
                        <span>Quản Lý Đánh Giá</span>
                    </button>
                    <button class="admin-menu-btn" onclick="exportReports()">
                        <i class="fa-solid fa-file-excel"></i>
                        <span>Xuất Báo Cáo</span>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Create admin dashboard modal
function createAdminDashboardModal() {
    const modals = document.querySelector('.modals-container');
    if (!modals) return;

    const modal = document.createElement('div');
    modal.id = 'adminDashboardModal';
    modal.className = 'modal';
    modal.style.cssText = 'display:none; flex-direction:column; justify-content:flex-start; overflow-y:auto; padding:20px;';
    modal.innerHTML = `
        <button class="close-btn" onclick="closeModal('adminDashboardModal')" style="position:absolute; top:10px; right:10px; background:none; border:none; font-size:24px; cursor:pointer;">✕</button>
        <div id="adminDashboardContainer"></div>
    `;
    modals.appendChild(modal);
}

// Initialize admin stats on page load
document.addEventListener('DOMContentLoaded', () => {
    loadAdminStats();
});
