// Chat Support and Communications Module

const MESSAGES_KEY = 'supportMessagesData';
const SUPPORT_TICKETS_KEY = 'supportTicketsData';
let supportMessages = [];
let supportTickets = [];

// Load support data
function loadSupportData() {
    try {
        supportMessages = JSON.parse(localStorage.getItem(MESSAGES_KEY)) || [];
        supportTickets = JSON.parse(localStorage.getItem(SUPPORT_TICKETS_KEY)) || [];
    } catch (error) {
        supportMessages = [];
        supportTickets = [];
    }
}

// Save support data
function saveSupportData() {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(supportMessages));
    localStorage.setItem(SUPPORT_TICKETS_KEY, JSON.stringify(supportTickets));
}

// Submit support request
function submitSupportRequest() {
    const name = document.getElementById('supportName')?.value.trim();
    const email = document.getElementById('supportEmail')?.value.trim();
    const message = document.getElementById('supportMessage')?.value.trim();

    if (!name || !email || !message) {
        return showToast('Vui lòng nhập đầy đủ thông tin hỗ trợ.', 'error');
    }

    const ticketId = Math.floor(Math.random() * 90000) + 10000;
    const ticket = {
        id: ticketId,
        name: name,
        email: email,
        message: message,
        createdAt: new Date().toLocaleString('vi-VN'),
        status: 'Mới',
        priority: 'Bình thường',
        responses: []
    };

    supportTickets.push(ticket);
    saveSupportData();

    document.getElementById('supportName').value = '';
    document.getElementById('supportEmail').value = '';
    document.getElementById('supportMessage').value = '';
    closeModal('supportModal');
    showToast(`Yêu cầu hỗ trợ #${ticketId} đã được gửi. Chúng tôi sẽ liên hệ sớm nhất.`, 'success');
    
    // Add notification
    addNotification('📬 Yêu cầu hỗ trợ', `Ticket #${ticketId} đã được tiếp nhận. Thời gian xử lý: 1-2 giờ.`, 'info');
}

// View support chat
function openSupportChat() {
    if (!isLoggedIn || !currentUser) {
        showToast('Vui lòng đăng nhập để sử dụng chat hỗ trợ.', 'error');
        return;
    }

    const modal = document.getElementById('supportChatModal');
    if (!modal) {
        createSupportChatModal();
    }

    renderSupportChat();
    openModal('supportChatModal');
}

// Render support chat
function renderSupportChat() {
    const container = document.getElementById('supportChatContainer');
    if (!container) return;

    const userTickets = supportTickets.filter(t => t.email === (currentUser ? (currentUser.includes('@') ? currentUser : currentUser + '@email.com') : ''));

    if (userTickets.length === 0) {
        container.innerHTML = `
            <div style="padding:40px; text-align:center;">
                <i class="fa-solid fa-comments" style="font-size:48px; color:#a4b0bd; margin-bottom:16px;"></i>
                <p style="color:#57606f; font-size:16px;">Bạn chưa có yêu cầu hỗ trợ nào. Hãy gửi một yêu cầu mới.</p>
                <button class="action-btn" onclick="closeModal('supportChatModal'); openModal('supportModal')" style="margin-top:12px;">Gửi yêu cầu</button>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="support-chat-header" style="margin-bottom:20px; padding-bottom:16px; border-bottom:1px solid #dfe4ea;">
            <h2 style="margin:0;">Trung tâm hỗ trợ của bạn</h2>
        </div>
        <div class="support-tickets">
            ${userTickets.map(ticket => `
                <div class="support-ticket" style="border:1px solid #e9eef6; border-radius:8px; padding:16px; margin-bottom:12px; background:#f5f7fb; cursor:pointer;" onclick="viewTicketDetails(${ticket.id});">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                        <div>
                            <h4 style="margin:0; color:#2f3542;">Ticket #${ticket.id}</h4>
                            <p style="margin:4px 0 0; font-size:13px; color:#57606f;">${ticket.createdAt}</p>
                        </div>
                        <span class="mini-badge" style="background:${ticket.status === 'Giải quyết' ? '#2ed573' : ticket.status === 'Đang xử lý' ? '#3498db' : '#ffb347'}; color:#fff;">
                            ${ticket.status}
                        </span>
                    </div>
                    <p style="margin:8px 0; color:#2f3542; font-size:14px;">${ticket.message.substring(0, 100)}...</p>
                    <div style="display:flex; gap:12px; font-size:12px; color:#57606f;">
                        <span>Ưu tiên: <strong>${ticket.priority}</strong></span>
                        <span>Trả lời: <strong>${ticket.responses.length}</strong></span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// View ticket details
function viewTicketDetails(ticketId) {
    const ticket = supportTickets.find(t => t.id === ticketId);
    if (!ticket) return;

    const modal = document.getElementById('ticketDetailsModal');
    if (!modal) {
        createTicketDetailsModal();
    }

    const container = modal.querySelector('.ticket-details-container');
    if (!container) return;

    container.innerHTML = `
        <div style="margin-bottom:20px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                <h3 style="margin:0;">Ticket #${ticket.id}</h3>
                <span class="mini-badge" style="background:${ticket.status === 'Giải quyết' ? '#2ed573' : ticket.status === 'Đang xử lý' ? '#3498db' : '#ffb347'}; color:#fff;">
                    ${ticket.status}
                </span>
            </div>
            <div style="background:#f5f7fb; padding:16px; border-radius:8px; margin-bottom:16px;">
                <p style="margin:0 0 8px; color:#57606f;"><strong>Người gửi:</strong> ${ticket.name}</p>
                <p style="margin:0 0 8px; color:#57606f;"><strong>Email:</strong> ${ticket.email}</p>
                <p style="margin:0 0 8px; color:#57606f;"><strong>Ngày tạo:</strong> ${ticket.createdAt}</p>
                <p style="margin:0; color:#2f3542;"><strong>Yêu cầu:</strong> ${ticket.message}</p>
            </div>
        </div>

        <div class="ticket-responses" style="max-height:300px; overflow-y:auto; margin-bottom:16px; padding-bottom:16px; border-bottom:1px solid #dfe4ea;">
            ${ticket.responses.length === 0 
                ? '<p style="color:#57606f; text-align:center;">Chưa có trả lời nào. Chúng tôi đang xử lý yêu cầu của bạn.</p>'
                : ticket.responses.map((resp, idx) => `
                    <div style="margin-bottom:12px; padding:12px; background:${resp.fromAdmin ? '#e8f5e9' : '#f5f7fb'}; border-radius:8px; border-left:4px solid ${resp.fromAdmin ? '#2ed573' : '#3498db'};">
                        <p style="margin:0 0 4px; font-weight:600; color:#2f3542;">
                            ${resp.fromAdmin ? '🔧 Admin Support' : resp.name}
                        </p>
                        <p style="margin:0 0 4px; color:#2f3542;">${resp.message}</p>
                        <span style="font-size:12px; color:#57606f;">${resp.timestamp}</span>
                    </div>
                `).join('')
            }
        </div>

        <div style="display:flex; gap:8px;">
            <button class="action-btn" onclick="closeModal('ticketDetailsModal'); renderSupportChat();" style="flex:1; background:#a4b0bd;">Quay lại</button>
        </div>
    `;

    openModal('ticketDetailsModal');
}

// Create support chat modal
function createSupportChatModal() {
    const modals = document.querySelector('.modals-container');
    if (!modals) return;

    const modal = document.createElement('div');
    modal.id = 'supportChatModal';
    modal.className = 'modal';
    modal.style.cssText = 'display:none; flex-direction:column; justify-content:flex-start; overflow-y:auto; padding:20px;';
    modal.innerHTML = `
        <button class="close-btn" onclick="closeModal('supportChatModal')" style="position:absolute; top:10px; right:10px; background:none; border:none; font-size:24px; cursor:pointer;">✕</button>
        <div id="supportChatContainer"></div>
    `;
    modals.appendChild(modal);
}

// Create ticket details modal
function createTicketDetailsModal() {
    const modals = document.querySelector('.modals-container');
    if (!modals) return;

    const modal = document.createElement('div');
    modal.id = 'ticketDetailsModal';
    modal.className = 'modal';
    modal.style.cssText = 'display:none; flex-direction:column; justify-content:flex-start; overflow-y:auto; padding:20px;';
    modal.innerHTML = `
        <button class="close-btn" onclick="closeModal('ticketDetailsModal')" style="position:absolute; top:10px; right:10px; background:none; border:none; font-size:24px; cursor:pointer;">✕</button>
        <div class="ticket-details-container"></div>
    `;
    modals.appendChild(modal);
}

// Initialize support on page load
document.addEventListener('DOMContentLoaded', () => {
    loadSupportData();
});
