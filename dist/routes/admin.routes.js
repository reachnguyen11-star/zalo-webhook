"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_service_1 = require("../services/client.service");
const logger_1 = require("../utils/logger");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
// Simple admin password protection (should use proper auth in production)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
function checkAuth(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth || auth !== `Bearer ${ADMIN_PASSWORD}`) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
    }
    next();
}
/**
 * GET /admin/zalo_verifier*.html - Serve Zalo verification file
 */
router.get('/zalo_verifier*.html', (req, res) => {
    const filename = req.path.split('/').pop();
    const filePath = path_1.default.join(process.cwd(), 'admin', filename || '');
    if (fs_1.default.existsSync(filePath)) {
        res.sendFile(filePath);
    }
    else {
        res.status(404).send('Verification file not found');
    }
});
/**
 * GET /admin/clients - List all clients
 */
router.get('/clients', checkAuth, (req, res) => {
    const clients = client_service_1.clientService.getAllClients();
    res.json({ success: true, clients });
});
/**
 * POST /admin/clients - Create new client
 */
router.post('/clients', checkAuth, (req, res) => {
    try {
        const { name, spreadsheetId } = req.body;
        if (!name || !spreadsheetId) {
            res.status(400).json({
                success: false,
                message: 'Name and spreadsheetId are required',
            });
            return;
        }
        const client = client_service_1.clientService.createClient(name, spreadsheetId);
        res.json({ success: true, client });
    }
    catch (error) {
        logger_1.logger.error('Error creating client', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
/**
 * PUT /admin/clients/:id - Update client
 */
router.put('/clients/:id', checkAuth, (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const client = client_service_1.clientService.updateClient(id, updates);
        res.json({ success: true, client });
    }
    catch (error) {
        logger_1.logger.error('Error updating client', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
/**
 * DELETE /admin/clients/:id - Delete client
 */
router.delete('/clients/:id', checkAuth, (req, res) => {
    try {
        const { id } = req.params;
        client_service_1.clientService.deleteClient(id);
        res.json({ success: true, message: 'Client deleted' });
    }
    catch (error) {
        logger_1.logger.error('Error deleting client', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
/**
 * GET /admin - Admin dashboard HTML
 */
router.get('/', (req, res) => {
    const clients = client_service_1.clientService.getAllClients();
    res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Zalo Ads - Admin Dashboard</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta property="zalo-platform-site-verification" content="PeAU3-Ao7pS5I90VmBG_41gAf3ds_7DcD3Co" />
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background: #f5f7fa;
            padding: 20px;
          }
          .container { max-width: 1200px; margin: 0 auto; }
          header {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          h1 { color: #0068ff; margin-bottom: 10px; }
          .subtitle { color: #666; font-size: 14px; }
          .card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .btn {
            background: #0068ff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
          }
          .btn:hover { background: #0056d6; }
          .btn-danger { background: #dc3545; }
          .btn-danger:hover { background: #c82333; }
          .btn-success { background: #28a745; }
          .btn-success:hover { background: #218838; }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            text-align: left;
            padding: 12px;
            border-bottom: 1px solid #eee;
          }
          th { background: #f8f9fa; font-weight: 600; }
          .badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
          }
          .badge-success { background: #d4edda; color: #155724; }
          .badge-danger { background: #f8d7da; color: #721c24; }
          .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            align-items: center;
            justify-content: center;
          }
          .modal.show { display: flex; }
          .modal-content {
            background: white;
            padding: 30px;
            border-radius: 8px;
            max-width: 500px;
            width: 90%;
          }
          .form-group {
            margin-bottom: 15px;
          }
          label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
            color: #333;
          }
          input, select {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
          }
          .actions { display: flex; gap: 10px; }
          code {
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 12px;
            font-family: monospace;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <header>
            <h1>🚀 Zalo Ads to Sheets - Admin Dashboard</h1>
            <p class="subtitle">Quản lý multi-client cho agency</p>
          </header>

          <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <h2>Danh sách Clients</h2>
              <button class="btn" onclick="showAddModal()">+ Thêm Client Mới</button>
            </div>

            ${clients.length === 0 ? `
              <p style="text-align: center; color: #999; padding: 40px;">
                Chưa có client nào. Click "Thêm Client Mới" để bắt đầu.
              </p>
            ` : `
              <table>
                <thead>
                  <tr>
                    <th>Client ID</th>
                    <th>Tên</th>
                    <th>Spreadsheet ID</th>
                    <th>OAuth</th>
                    <th>Trạng thái</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${clients.map(client => `
                    <tr>
                      <td><code>${client.id}</code></td>
                      <td>${client.name}</td>
                      <td><code>${client.googleSheetId.substring(0, 20)}...</code></td>
                      <td>
                        ${client.googleOAuthTokens
        ? '<span class="badge badge-success">✓ Connected</span>'
        : '<span class="badge badge-danger">✗ Not Connected</span>'}
                      </td>
                      <td>
                        <span class="badge badge-success">Active</span>
                      </td>
                      <td class="actions">
                        ${!client.googleOAuthTokens ? `
                          <button class="btn btn-success" onclick="authorizeClient('${client.id}')">Authorize</button>
                        ` : ''}
                        <button class="btn" onclick="copyWebhookURL('${client.id}')">Copy Webhook</button>
                        <button class="btn btn-danger" onclick="deleteClient('${client.id}')">Delete</button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            `}
          </div>

          <div class="card">
            <h3>📝 Hướng dẫn sử dụng</h3>
            <ol style="padding-left: 20px; margin-top: 10px; line-height: 1.8;">
              <li>Thêm client mới với tên và Spreadsheet ID</li>
              <li>Click "Authorize" để kết nối Google Sheets của client</li>
              <li>Copy Webhook URL và paste vào Zalo Developer Portal</li>
              <li>Client sẵn sàng nhận leads!</li>
            </ol>
          </div>
        </div>

        <!-- Add Client Modal -->
        <div id="addModal" class="modal">
          <div class="modal-content">
            <h2 style="margin-bottom: 20px;">Thêm Client Mới</h2>
            <form onsubmit="addClient(event)">
              <div class="form-group">
                <label>Tên Client:</label>
                <input type="text" id="clientName" required placeholder="VD: Công ty ABC">
              </div>
              <div class="form-group">
                <label>Spreadsheet ID:</label>
                <input type="text" id="spreadsheetId" required placeholder="1ABC2DEF3GHI...">
                <small style="color: #666; font-size: 12px;">Lấy từ URL Google Sheet</small>
              </div>
              <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button type="submit" class="btn">Tạo Client</button>
                <button type="button" class="btn" style="background: #6c757d;" onclick="closeModal()">Hủy</button>
              </div>
            </form>
          </div>
        </div>

        <script>
          function showAddModal() {
            document.getElementById('addModal').classList.add('show');
          }

          function closeModal() {
            document.getElementById('addModal').classList.remove('show');
          }

          async function addClient(e) {
            e.preventDefault();
            const name = document.getElementById('clientName').value;
            const spreadsheetId = document.getElementById('spreadsheetId').value;

            try {
              const res = await fetch('/admin/clients', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer ${ADMIN_PASSWORD}'
                },
                body: JSON.stringify({ name, spreadsheetId })
              });

              const data = await res.json();
              if (data.success) {
                alert('Client đã được tạo thành công!');
                location.reload();
              } else {
                alert('Lỗi: ' + data.message);
              }
            } catch (error) {
              alert('Lỗi: ' + error.message);
            }
          }

          function authorizeClient(clientId) {
            window.location.href = '/auth/google?client_id=' + clientId;
          }

          function copyWebhookURL(clientId) {
            const url = window.location.origin + '/webhook/zalo?client_id=' + clientId;
            navigator.clipboard.writeText(url);
            alert('Đã copy Webhook URL:\\n' + url);
          }

          async function deleteClient(clientId) {
            if (!confirm('Bạn có chắc muốn xóa client này?')) return;

            try {
              const res = await fetch('/admin/clients/' + clientId, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ${ADMIN_PASSWORD}' }
              });

              const data = await res.json();
              if (data.success) {
                alert('Client đã bị xóa!');
                location.reload();
              } else {
                alert('Lỗi: ' + data.message);
              }
            } catch (error) {
              alert('Lỗi: ' + error.message);
            }
          }
        </script>
      </body>
    </html>
  `);
});
exports.default = router;
//# sourceMappingURL=admin.routes.js.map