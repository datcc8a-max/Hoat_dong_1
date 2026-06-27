const CART_STORAGE_KEY = 'cartData';
let cart = [];
let isLoggedIn = false;
let currentUser = '';

function loadCartFromStorage() {
    try {
        const savedCart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY));
        if (Array.isArray(savedCart)) {
            cart = savedCart.map((item) => ({
                ...item,
                quantity: Number(item.quantity) || 1,
                price: Number(item.price) || 0
            }));
        }
    } catch (error) {
        cart = [];
    }
    updateCartCount();
}

function saveCartToStorage() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function updateCartCount() {
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    const counter = document.getElementById('cartCount');
    if (counter) counter.innerText = totalQty;
}

function addToCart(name, price, quantity = 1) {
    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const existingItem = cart.find(item => item.name === name);

    if (existingItem) {
        existingItem.quantity += qty;
    } else {
        cart.push({ name: name, price: price, quantity: qty });
    }

    updateCartCount();
    saveCartToStorage();
    showToast(`Đã thêm ${qty}x ${name}`, 'success');
}

const PROMO_CODES = {
    'GIAODICH10': 0.10,
    'NGON50': 0.05,
    'SHIPFREE': 0.03
};

const ORDER_STATUS_KEY = 'orderStatusData';

let activePromo = { code: '', discount: 0 };

function saveOrderStatus(status) {
    if (!currentUser) return;
    const orderStatusDb = JSON.parse(localStorage.getItem(ORDER_STATUS_KEY)) || {};
    orderStatusDb[currentUser] = status;
    localStorage.setItem(ORDER_STATUS_KEY, JSON.stringify(orderStatusDb));
}

function getOrderStatus() {
    const orderStatusDb = JSON.parse(localStorage.getItem(ORDER_STATUS_KEY)) || {};
    return currentUser ? orderStatusDb[currentUser] || null : null;
}

function updateOrderStatusUI() {
    const statusMessage = document.getElementById('orderStatusMessage');
    const statusSteps = document.getElementById('orderStatusSteps');
    const orderStatusCard = document.getElementById('orderStatusCard');
    const cancelBtn = document.getElementById('cancelOrderBtn');
    if (!statusMessage || !statusSteps || !orderStatusCard) return;

    const orderStatus = getOrderStatus();
    if (!isLoggedIn || !orderStatus) {
        statusMessage.innerText = 'Bạn chưa có đơn hàng mới.';
        orderStatusCard.classList.add('empty');
        statusSteps.querySelectorAll('.status-pill').forEach((pill, index) => {
            pill.classList.toggle('active', index === 0);
            pill.classList.remove('completed');
        });
        if (cancelBtn) cancelBtn.style.display = 'none';
        return;
    }

    orderStatusCard.classList.remove('empty');
    statusMessage.innerText = `Đơn #${orderStatus.id} • ${orderStatus.date} • ${orderStatus.message}`;

    const stepMap = ['Đã đặt', 'Đang chuẩn bị', 'Đang giao', 'Hoàn thành'];
    statusSteps.querySelectorAll('.status-pill').forEach((pill, index) => {
        pill.classList.remove('active', 'completed');
        if (index <= orderStatus.stepIndex) {
            pill.classList.add(index === orderStatus.stepIndex ? 'active' : 'completed');
        }
    });

    const canCancel = orderStatus.stepIndex < 2 && !orderStatus.canceled;
    if (cancelBtn) {
        cancelBtn.style.display = canCancel ? 'inline-flex' : 'none';
    }
}

function cancelCurrentOrder() {
    if (!isLoggedIn || !currentUser) {
        return showToast('Vui lòng đăng nhập để hủy đơn hàng.', 'error');
    }

    const orderStatus = getOrderStatus();
    if (!orderStatus || orderStatus.canceled) {
        return showToast('Không có đơn hàng nào để hủy.', 'error');
    }

    if (orderStatus.stepIndex >= 2) {
        return showToast('Đơn hàng đã đến giai đoạn giao hoặc hoàn thành, không thể hủy.', 'error');
    }

    orderStatus.canceled = true;
    orderStatus.message = 'Đơn hàng đã bị hủy theo yêu cầu của bạn.';
    orderStatus.stepIndex = 0;
    saveOrderStatus(orderStatus);
    updateOrderStatusUI();

    if (currentUser) {
        const usersDb = JSON.parse(localStorage.getItem('usersDb')) || {};
        const userData = usersDb[currentUser] || {};
        if (Array.isArray(userData.history) && userData.history.length > 0) {
            const lastOrder = userData.history[userData.history.length - 1];
            if (lastOrder && !lastOrder.canceled) {
                lastOrder.canceled = true;
                lastOrder.status = 'Đã hủy';
                lastOrder.note = lastOrder.note || 'Đơn hàng bị hủy.';
                usersDb[currentUser] = userData;
                localStorage.setItem('usersDb', JSON.stringify(usersDb));
            }
        }
    }

    showToast('Đơn hàng của bạn đã được hủy.', 'success');
}

function setOrderStatus(paymentMethod, total) {
    const statusMessage = paymentMethod === 'Tiền mặt (COD)'
        ? 'Đơn đang chờ xác nhận và sẽ được giao ngay khi bạn nhận hàng.'
        : `Thanh toán trực tuyến bằng ${paymentMethod} đã hoàn tất.`;
    const stepIndex = paymentMethod === 'Tiền mặt (COD)' ? 0 : 1;
    const status = {
        id: Math.floor(Math.random() * 9000) + 1000,
        date: new Date().toLocaleString('vi-VN'),
        paymentMethod,
        total,
        message: statusMessage,
        stepIndex
    };
    saveOrderStatus(status);
    updateOrderStatusUI();
}

function renderCheckoutSummary() {
    const summaryDiv = document.getElementById('checkoutSummary');
    const totalAmount = document.getElementById('checkoutTotalAmount');
    let total = 0;

    if (!summaryDiv || !totalAmount) return;

    populateCheckoutSavedAddresses();

    if (cart.length === 0) {
        summaryDiv.innerHTML = "<p style='color:#57606f; margin:0;'>Giỏ hàng đang trống.</p>";
        totalAmount.innerText = '0đ';
        return;
    }

    summaryDiv.innerHTML = '';
    cart.forEach((item, index) => {
        const lineTotal = item.price * item.quantity;
        total += lineTotal;
        summaryDiv.innerHTML += `
            <div class="summary-item">
                <div style="flex:1;">
                    <strong>${item.name}</strong>
                    <p style="margin:6px 0 8px; color:#57606f; font-size:12px;">${item.price.toLocaleString('vi-VN')}đ / món</p>
                    <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                        <label style="font-size:12px; color:#57606f;">Số lượng</label>
                        <input type="number" min="1" value="${item.quantity}" style="width:70px; padding:6px 8px; border-radius:10px; border:1px solid #dfe4ea;" onchange="updateCheckoutItemQuantity(${index}, this.value)">
                        <button type="button" style="border:none; border-radius:999px; padding:8px 12px; background:#ff6b81; color:#fff; font-size:12px; cursor:pointer;" onclick="removeCheckoutItem(${index})">Xóa</button>
                    </div>
                </div>
                <div style="text-align:right; min-width:95px;">
                    ${lineTotal.toLocaleString('vi-VN')}đ
                </div>
            </div>`;
    });

    if (activePromo.code && activePromo.discount > 0) {
        const discountValue = Math.round(total * activePromo.discount);
        const discountedTotal = total - discountValue;

        summaryDiv.innerHTML += `
            <div class="summary-item" style="justify-content: space-between; padding-top: 10px; border-top: 1px dashed #dfe4ea;">
                <div><strong>Mã giảm giá:</strong> ${activePromo.code}</div>
                <div style="color:#2ed573;">- ${discountValue.toLocaleString('vi-VN')}đ</div>
            </div>`;

        totalAmount.innerText = discountedTotal.toLocaleString() + 'đ';
    } else {
        totalAmount.innerText = total.toLocaleString() + 'đ';
    }
}

function populateCheckoutSavedAddresses() {
    const addressSelect = document.getElementById('checkoutAddressSelect');
    const addressInput = document.getElementById('checkoutAddress');
    if (!addressSelect) return;

    let optionsHTML = '<option value="">Chọn địa chỉ lưu</option>';
    if (isLoggedIn && currentUser) {
        const usersDb = JSON.parse(localStorage.getItem('usersDb')) || {};
        const userData = usersDb[currentUser] || {};
        const savedAddresses = Array.isArray(userData.savedAddresses) ? userData.savedAddresses : [];

        savedAddresses.forEach((address) => {
            const value = address.includes(':') ? address.split(':')[1].trim() : address;
            optionsHTML += `<option value="${value}">${value}</option>`;
        });
    }

    addressSelect.innerHTML = optionsHTML;
    addressSelect.onchange = () => {
        if (addressInput) {
            addressInput.value = addressSelect.value || '';
        }
    };
}

function applyPromoCode() {
    const promoInput = document.getElementById('promoCodeInput');
    const promoMessage = document.getElementById('promoMessage');
    if (!promoInput || !promoMessage) return;

    const enteredCode = promoInput.value.trim().toUpperCase();
    if (!enteredCode) {
        promoMessage.textContent = 'Vui lòng nhập mã giảm giá.';
        promoMessage.style.color = '#ff4757';
        return;
    }

    if (PROMO_CODES[enteredCode]) {
        activePromo.code = enteredCode;
        activePromo.discount = PROMO_CODES[enteredCode];
        promoMessage.textContent = `Áp dụng mã ${enteredCode} thành công! Bạn được giảm ${Math.round(activePromo.discount * 100)}%.`;
        promoMessage.style.color = '#2ed573';
        renderCheckoutSummary();
    } else {
        activePromo = { code: '', discount: 0 };
        promoMessage.textContent = 'Mã giảm giá không hợp lệ. Vui lòng thử lại.';
        promoMessage.style.color = '#ff4757';
        renderCheckoutSummary();
    }
}

function renderCart() {
    let cartItemsDiv = document.getElementById('cartItems');
    let total = 0;

    if (!cartItemsDiv) return;

    if (cart.length === 0) {
        cartItemsDiv.innerHTML = "<p style='text-align:center;'>Giỏ hàng đang trống.</p>";
    } else {
        cartItemsDiv.innerHTML = '';
        cart.forEach((item, index) => {
            const lineTotal = item.price * item.quantity;
            total += lineTotal;
            cartItemsDiv.innerHTML += `
                <div class="cart-item">
                    <div style="flex:1;">
                        <strong>${item.name}</strong>
                        <p style="margin:4px 0 0; color:#57606f; font-size:12px;">${item.price.toLocaleString('vi-VN')}đ / món</p>
                        <div style="display:flex; align-items:center; gap:10px; margin-top:10px; flex-wrap: wrap;">
                            <label style="font-size:12px; color:#57606f;">Số lượng</label>
                            <input type="number" min="1" value="${item.quantity}" style="width:70px; padding:6px 8px; border-radius:10px; border:1px solid #dfe4ea;" onchange="updateCartItemQuantity(${index}, this.value)">
                            <button type="button" style="border:none; border-radius:999px; padding:8px 12px; background:#ff6b81; color:#fff; font-size:12px; cursor:pointer;" onclick="removeCartItem(${index})">Xóa</button>
                        </div>
                    </div>
                    <div style="text-align:right; min-width:95px;">
                        ${lineTotal.toLocaleString('vi-VN')}đ
                    </div>
                </div>`;
        });
    }

    const totalPrice = document.getElementById('totalPrice');
    if (totalPrice) totalPrice.innerText = total.toLocaleString('vi-VN');
}

function updateCartItemQuantity(index, quantity) {
    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    if (index < 0 || index >= cart.length) return;
    cart[index].quantity = qty;
    updateCartCount();
    saveCartToStorage();
    renderCart();
}

function updateCheckoutItemQuantity(index, quantity) {
    updateCartItemQuantity(index, quantity);
    renderCheckoutSummary();
}

function removeCartItem(index) {
    if (index < 0 || index >= cart.length) return;
    const removed = cart.splice(index, 1)[0];
    updateCartCount();
    saveCartToStorage();
    renderCart();
    renderCheckoutSummary();
    showToast(`Đã xóa ${removed.name} khỏi giỏ hàng.`, 'success');
}

function removeCheckoutItem(index) {
    removeCartItem(index);
    renderCheckoutSummary();
}

function clearCart() {
    if (cart.length === 0) {
        return showToast('Giỏ hàng đã trống.', 'error');
    }
    cart = [];
    saveCartToStorage();
    updateCartCount();
    renderCart();
    renderCheckoutSummary();
    showToast('Đã xóa toàn bộ giỏ hàng.', 'success');
}

function proceedToCheckout() {
    if (cart.length === 0) return showToast('Giỏ hàng trống!', 'error');
    if (!isLoggedIn) {
        showToast('Vui lòng đăng nhập để đặt hàng', 'error');
        switchModal('cartModal', 'loginModal');
        return;
    }

    const checkoutName = document.getElementById('checkoutName');
    if (checkoutName && !checkoutName.value.trim() && currentUser) {
        checkoutName.value = currentUser;
    }

    renderCheckoutSummary();
    switchModal('cartModal', 'checkoutModal');
}

function completeOrder() {
    if (cart.length === 0) return showToast('Giỏ hàng trống!', 'error');

    let name = document.getElementById('checkoutName').value.trim();
    let phone = document.getElementById('checkoutPhone').value.trim();
    let address = document.getElementById('checkoutAddress').value.trim();
    let note = document.getElementById('checkoutNote').value.trim();
    let paymentMethod = document.querySelector('input[name="payment"]:checked')?.value || 'Tiền mặt (COD)';

    if (!phone || !address) {
        showToast('Vui lòng nhập số điện thoại và địa chỉ giao hàng.', 'error');
        return;
    }

    let total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let discountAmount = activePromo.discount ? Math.round(total * activePromo.discount) : 0;
    let totalAfterDiscount = total - discountAmount;
    let itemNames = cart.map(item => `${item.name} x${item.quantity}`).join(', ');

    let newOrder = {
        id: Math.floor(Math.random() * 9000) + 1000,
        date: new Date().toLocaleString('vi-VN'),
        createdAt: Date.now(),
        items: itemNames,
        itemsDetail: cart.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity
        })),
        itemCount: cart.reduce((sum, item) => sum + item.quantity, 0),
        total: totalAfterDiscount,
        discountAmount: discountAmount,
        promoCode: activePromo.code || '',
        paymentMethod: paymentMethod,
        customerName: name || currentUser,
        phone: phone,
        address: address,
        note: note,
        time: document.getElementById('checkoutTime').value.trim()
    };

    let usersDb = JSON.parse(localStorage.getItem('usersDb')) || {};
    if (!usersDb[currentUser]) {
        showToast('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.', 'error');
        return;
    }

    usersDb[currentUser].history = usersDb[currentUser].history || [];
    usersDb[currentUser].history.push(newOrder);
    usersDb[currentUser].totalSpent = (usersDb[currentUser].totalSpent || 0) + totalAfterDiscount;
    usersDb[currentUser].points = (usersDb[currentUser].points || 0) + Math.max(10, Math.floor(totalAfterDiscount / 100000));
    usersDb[currentUser].phone = phone || usersDb[currentUser].phone;
    usersDb[currentUser].address = address || usersDb[currentUser].address;
    localStorage.setItem('usersDb', JSON.stringify(usersDb));

    const amountPaid = totalAfterDiscount;
    setOrderStatus(paymentMethod, amountPaid);
    simulateOrderProgress();

    cart = [];
    activePromo = { code: '', discount: 0 };
    const promoInput = document.getElementById('promoCodeInput');
    if (promoInput) promoInput.value = '';
    const promoMessage = document.getElementById('promoMessage');
    if (promoMessage) promoMessage.textContent = '';

    updateCartCount();
    saveCartToStorage();
    document.getElementById('checkoutName').value = '';
    document.getElementById('checkoutPhone').value = '';
    document.getElementById('checkoutAddress').value = '';
    document.getElementById('checkoutTime').value = '';
    document.getElementById('checkoutNote').value = '';
    closeModal('checkoutModal');
    renderProfileData();
    if (typeof window.renderAdminSalesDashboard === 'function') {
        window.renderAdminSalesDashboard();
    }

    showToast(`Đặt hàng thành công! Phương thức: ${paymentMethod}.`, 'success');
}

function simulateOrderProgress() {
    const orderStatus = getOrderStatus();
    if (!orderStatus) return;

    const steps = ['Đã đặt', 'Đang chuẩn bị', 'Đang giao', 'Hoàn thành'];
    let nextIndex = Math.min((orderStatus.stepIndex || 0) + 1, steps.length - 1);

    const updateStep = () => {
        if (!orderStatus || nextIndex >= steps.length) return;
        orderStatus.stepIndex = nextIndex;
        orderStatus.message = `Đơn hàng đang ${steps[nextIndex].toLowerCase()}.`;
        saveOrderStatus(orderStatus);
        updateOrderStatusUI();
        nextIndex += 1;
        if (nextIndex < steps.length) {
            setTimeout(updateStep, 6000);
        }
    };

    setTimeout(updateStep, 5000);
}
