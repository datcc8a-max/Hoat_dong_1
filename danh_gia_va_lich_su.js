// Reviews and Ratings Module

const REVIEWS_STORAGE_KEY = 'reviewsData';
const ORDER_HISTORY_KEY = 'orderHistoryData';
let reviews = [];
let orderHistory = {};

// Load reviews from storage
function loadReviews() {
    try {
        const saved = localStorage.getItem(REVIEWS_STORAGE_KEY);
        reviews = saved ? JSON.parse(saved) : [];
    } catch (error) {
        reviews = [];
    }
}

// Save reviews to storage
function saveReviews() {
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
}

// Get reviews for a specific food
function getFoodReviews(foodName) {
    return reviews.filter(review => review.foodName === foodName);
}

// Get average rating for a food
function getAverageRating(foodName) {
    const foodReviews = getFoodReviews(foodName);
    if (foodReviews.length === 0) return 0;
    const sum = foodReviews.reduce((total, review) => total + review.rating, 0);
    return (sum / foodReviews.length).toFixed(1);
}

// Submit a review
function submitReview(foodName) {
    if (!isLoggedIn || !currentUser) {
        showToast('Vui lòng đăng nhập để đánh giá.', 'error');
        return;
    }

    const ratingSelect = document.getElementById('reviewRatingSelect');
    const commentInput = document.getElementById('reviewCommentInput');

    if (!ratingSelect || !commentInput) return;

    const rating = parseInt(ratingSelect.value);
    const comment = commentInput.value.trim();

    if (rating === 0) {
        showToast('Vui lòng chọn mức đánh giá.', 'error');
        return;
    }

    if (!comment) {
        showToast('Vui lòng nhập bình luận.', 'error');
        return;
    }

    if (comment.length < 10) {
        showToast('Bình luận phải có ít nhất 10 ký tự.', 'error');
        return;
    }

    reviews.push({
        foodName: foodName,
        userName: currentUser,
        rating: rating,
        comment: comment,
        date: new Date().toLocaleString('vi-VN'),
        helpful: 0
    });

    saveReviews();
    showToast('Đánh giá của bạn đã được gửi!', 'success');
    
    // Clear form
    ratingSelect.value = '0';
    commentInput.value = '';
    
    // Close modal and refresh details
    if (typeof showFoodDetails === 'function') {
        showFoodDetails(foodName);
    }
}

// Open review form
function openReviewForm(foodName) {
    const modal = document.getElementById('reviewFormModal');
    if (!modal) {
        createReviewFormModal();
    }

    const form = document.getElementById('reviewForm');
    if (!form) return;

    form.innerHTML = `
        <h3 style="margin-top:0;">Đánh giá ${foodName}</h3>
        <div style="margin-bottom:16px;">
            <label style="display:block; margin-bottom:8px; font-weight:600;">Mức đánh giá:</label>
            <select id="reviewRatingSelect" style="width:100%; padding:10px; border:1px solid #dfe4ea; border-radius:8px;">
                <option value="0">-- Chọn mức đánh giá --</option>
                <option value="1">⭐ 1 sao - Rất tệ</option>
                <option value="2">⭐⭐ 2 sao - Tệ</option>
                <option value="3">⭐⭐⭐ 3 sao - Bình thường</option>
                <option value="4">⭐⭐⭐⭐ 4 sao - Tốt</option>
                <option value="5">⭐⭐⭐⭐⭐ 5 sao - Xuất sắc</option>
            </select>
        </div>
        <div style="margin-bottom:16px;">
            <label style="display:block; margin-bottom:8px; font-weight:600;">Bình luận (tối thiểu 10 ký tự):</label>
            <textarea id="reviewCommentInput" placeholder="Chia sẻ trải nghiệm của bạn về món ăn này..." style="width:100%; height:120px; padding:10px; border:1px solid #dfe4ea; border-radius:8px; resize:vertical;"></textarea>
        </div>
        <div style="display:flex; gap:12px;">
            <button class="action-btn" onclick="submitReview('${foodName}')" style="flex:1; background:#2ed573;">Gửi đánh giá</button>
            <button class="action-btn" onclick="closeModal('reviewFormModal')" style="flex:1; background:#a4b0bd;">Hủy</button>
        </div>
    `;

    openModal('reviewFormModal');
}

// Create review form modal if not exists
function createReviewFormModal() {
    const modals = document.querySelector('.modals-container');
    if (!modals) return;

    const modal = document.createElement('div');
    modal.id = 'reviewFormModal';
    modal.className = 'modal';
    modal.style.cssText = 'display:none; align-items:center; justify-content:center;';
    modal.innerHTML = `
        <div style="background:#fff; border-radius:16px; padding:24px; max-width:500px; width:90%; box-shadow:0 4px 16px rgba(0,0,0,0.1);">
            <button class="close-btn" onclick="closeModal('reviewFormModal')" style="position:absolute; top:10px; right:10px; background:none; border:none; font-size:24px; cursor:pointer;">✕</button>
            <div id="reviewForm"></div>
        </div>
    `;
    modals.appendChild(modal);
}

// Order History Management
function loadOrderHistory() {
    try {
        const saved = localStorage.getItem(ORDER_HISTORY_KEY);
        orderHistory = saved ? JSON.parse(saved) : {};
    } catch (error) {
        orderHistory = {};
    }
}

// Save order to history
function saveOrderToHistory(orderId, items, total, address) {
    if (!isLoggedIn || !currentUser) return;

    if (!orderHistory[currentUser]) {
        orderHistory[currentUser] = [];
    }

    const order = {
        id: orderId,
        items: items,
        total: total,
        address: address,
        date: new Date().toLocaleString('vi-VN'),
        status: 'Đã đặt',
        paymentMethod: 'Chưa xác định',
        canceled: false
    };

    orderHistory[currentUser].push(order);
    localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(orderHistory));
}

// Get order history for current user
function getOrderHistory() {
    if (!isLoggedIn || !currentUser) return [];
    return orderHistory[currentUser] || [];
}

// View order history
function viewOrderHistory() {
    if (!isLoggedIn || !currentUser) {
        showToast('Vui lòng đăng nhập để xem lịch sử đơn hàng.', 'error');
        return;
    }

    const modal = document.getElementById('orderHistoryModal');
    if (!modal) {
        createOrderHistoryModal();
    }

    const container = modal.querySelector('.order-history-container');
    if (!container) return;

    const orders = getOrderHistory();

    if (orders.length === 0) {
        container.innerHTML = `
            <div style="padding:40px; text-align:center;">
                <i class="fa-solid fa-box" style="font-size:48px; color:#a4b0bd; margin-bottom:16px;"></i>
                <p style="color:#57606f; font-size:16px;">Bạn chưa có đơn hàng nào.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="order-history-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; padding-bottom:16px; border-bottom:1px solid #dfe4ea;">
            <h2 style="margin:0;">Lịch sử đơn hàng (${orders.length})</h2>
        </div>
        <div class="order-history-items">
            ${orders.slice().reverse().map((order, idx) => `
                <div class="order-item" style="border:1px solid #e9eef6; border-radius:12px; padding:16px; margin-bottom:12px; background:#f5f7fb;">
                    <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:12px;">
                        <div>
                            <h4 style="margin:0 0 4px;">Đơn #${order.id}</h4>
                            <p style="margin:0; color:#57606f; font-size:13px;">${order.date}</p>
                        </div>
                        <span class="order-status-badge" style="padding:6px 12px; border-radius:20px; font-size:12px; font-weight:600; background:${getStatusColor(order.status)}; color:#fff;">
                            ${order.status}
                        </span>
                    </div>
                    <div style="margin-bottom:12px;">
                        <p style="margin:0 0 8px; color:#2f3542; font-weight:600;">Các món:</p>
                        <p style="margin:0; color:#57606f; font-size:13px;">${order.items}</p>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; padding-top:12px; border-top:1px solid #e9eef6;">
                        <span style="font-size:16px; font-weight:700; color:#2ed573;">
                            ${order.total.toLocaleString('vi-VN')}đ
                        </span>
                        <button class="action-btn" onclick="reorderFromHistory('${order.items}')" style="padding:6px 12px; background:#2ed573;">
                            Đặt lại
                        </button>
                    </div>
                    ${order.canceled ? '<p style="margin:8px 0 0; color:#ff6b81; font-size:12px;"><i class="fa-solid fa-circle-xmark"></i> Đơn hàng đã hủy</p>' : ''}
                </div>
            `).join('')}
        </div>
    `;

    openModal('orderHistoryModal');
}

// Get color for order status
function getStatusColor(status) {
    const colors = {
        'Đã đặt': '#ffb347',
        'Đang chuẩn bị': '#a4b0bd',
        'Đang giao': '#3498db',
        'Hoàn thành': '#2ed573',
        'Đã hủy': '#ff6b81'
    };
    return colors[status] || '#a4b0bd';
}

// Reorder from history
function reorderFromHistory(itemsString) {
    showToast('Tính năng đặt lại sẽ sớm được cập nhật!', 'info');
}

// Create order history modal if not exists
function createOrderHistoryModal() {
    const modals = document.querySelector('.modals-container');
    if (!modals) return;

    const modal = document.createElement('div');
    modal.id = 'orderHistoryModal';
    modal.className = 'modal';
    modal.style.cssText = 'display:none; flex-direction:column; justify-content:flex-start; overflow-y:auto; padding:20px;';
    modal.innerHTML = `
        <button class="close-btn" onclick="closeModal('orderHistoryModal')" style="position:absolute; top:10px; right:10px; background:none; border:none; font-size:24px; cursor:pointer;">✕</button>
        <div class="order-history-container"></div>
    `;
    modals.appendChild(modal);
}

// Initialize reviews and order history on page load
document.addEventListener('DOMContentLoaded', () => {
    loadReviews();
    loadOrderHistory();
});
