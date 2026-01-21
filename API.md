# API Documentation

Chi tiết về API endpoints và webhook payload format.

## Endpoints

### 1. Health Check

**GET** `/health`

Kiểm tra trạng thái server và Google Sheets authentication.

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "authenticated": true
}
```

---

### 2. Google OAuth

#### 2.1. Initiate OAuth Flow

**GET** `/auth/google`

Redirect user đến Google consent screen để authorize access.

**Response:** HTML page với link authorize.

#### 2.2. OAuth Callback

**GET** `/oauth2callback?code=xxx`

Google redirect về đây sau khi user authorize.

**Query Parameters:**
- `code` (string, required): Authorization code from Google

**Response:** HTML page thông báo success hoặc error.

#### 2.3. Check Auth Status

**GET** `/auth/status`

Kiểm tra xem đã authenticate với Google chưa.

**Response:**
```json
{
  "success": true,
  "authenticated": true,
  "message": "Google Sheets is connected"
}
```

---

### 3. Webhook

#### 3.1. Webhook Verification

**GET** `/webhook/zalo?challenge=xxx`

Endpoint để Zalo verify webhook URL khi setup.

**Query Parameters:**
- `challenge` (string, optional): Challenge string from Zalo

**Response:**
- Trả về challenge string nếu có
- Hoặc:
```json
{
  "success": true,
  "message": "Webhook endpoint is active"
}
```

#### 3.2. Receive Webhook Events

**POST** `/webhook/zalo`

Nhận form submission events từ Zalo.

**Headers:**
- `Content-Type: application/json`
- `x-zalo-signature` (optional): HMAC signature for verification

**Request Body:**

```json
{
  "event_name": "form_submit",
  "app_id": "1234567890123456789",
  "timestamp": "2024-01-20T10:30:00Z",
  "data": {
    "form_id": "form_abc123",
    "submit_time": 1705745000000,
    "fields": [
      {
        "id": "field_1",
        "name": "Họ và tên",
        "value": "Nguyen Van A",
        "type": "text"
      },
      {
        "id": "field_2",
        "name": "Số điện thoại",
        "value": "0901234567",
        "type": "text"
      },
      {
        "id": "field_3",
        "name": "Email",
        "value": "nguyenvana@example.com",
        "type": "email"
      }
    ],
    "user_info": {
      "user_id": "zalo_user_123",
      "user_name": "Nguyen Van A"
    }
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Lead successfully added to Google Sheets",
  "isDuplicate": false
}
```

**Response (Duplicate):**
```json
{
  "success": true,
  "message": "Duplicate phone number, skipped",
  "isDuplicate": true
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Phone number is required"
}
```

---

## Webhook Payload Variations

Zalo có thể gửi webhook với nhiều format khác nhau. Dưới đây là các variations được hỗ trợ:

### Variation 1: Standard Form Submit

```json
{
  "event_name": "form_submit",
  "app_id": "123456789",
  "data": {
    "form_id": "abc123",
    "submit_time": 1705745000000,
    "fields": [...]
  }
}
```

### Variation 2: Follow Event (với form)

```json
{
  "event_name": "follow",
  "app_id": "123456789",
  "data": {
    "form_data": [
      {"field_name": "Name", "answer": "Nguyen Van A"},
      {"field_name": "Phone", "answer": "0901234567"}
    ],
    "user": {
      "id": "user_123",
      "name": "Nguyen Van A"
    },
    "timestamp": 1705745000000
  }
}
```

### Variation 3: Alternative Field Format

```json
{
  "event_name": "form_submit",
  "data": {
    "id": "form_123",
    "fields": [
      {
        "field_id": "f1",
        "label": "Tên",
        "value": "Nguyen Van A",
        "field_type": "text"
      }
    ]
  }
}
```

Tất cả các format trên đều được normalize và xử lý tự động.

---

## Field Mapping

### Automatic Field Detection

Service tự động detect và map các trường phổ biến:

| Zalo Field Names | Mapped To | Notes |
|-----------------|-----------|-------|
| "Phone", "phone", "PHONE", "Số điện thoại", "sdt", "SDT", "mobile" | `phone` | Required, auto-normalized |
| "Name", "name", "Tên", "Họ và tên", "Họ tên", "Full name" | `name` | Optional |
| "Email", "email", "EMAIL" | `email` | Optional |

### Phone Number Normalization

Tất cả phone numbers được normalize về format `0xxxxxxxxx`:

**Input Examples:**
- `+84 901 234 567` → `0901234567`
- `84901234567` → `0901234567`
- `0901-234-567` → `0901234567`
- `(090) 123-4567` → `0901234567`

**Validation:**
- Must be Vietnamese phone format: `0` + 9-10 digits
- Invalid formats sẽ bị reject

---

## Google Sheets Format

### Default Headers

Khi sheet trống, headers mặc định:

```
| Timestamp | Name | Phone | Email | form_id | zalo_user_id | Source |
```

### Dynamic Headers

Nếu Zalo form có thêm fields khác (như "Company", "Address", etc.), headers sẽ tự động mở rộng:

```
| Timestamp | Name | Phone | Email | Company | Address | form_id | Source |
```

### Data Format

```
| Timestamp | Name | Phone | Email | Source |
|-----------|------|-------|-------|--------|
| 2024-01-20T10:30:00.000Z | Nguyen Van A | 0901234567 | test@example.com | Zalo Ads |
```

**Column Index (cho deduplication):**
- Phone column: **C** (index 2)

---

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Invalid webhook payload: missing event_name"
}
```

**Causes:**
- Missing required fields
- Invalid phone format
- Invalid JSON

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Invalid signature"
}
```

**Causes:**
- Webhook signature verification failed

### 404 Not Found

```json
{
  "success": false,
  "message": "Route POST /invalid-path not found"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Google Sheets API Error: Permission denied"
}
```

**Causes:**
- Google Sheets API errors
- Network timeout
- Invalid spreadsheet ID
- Missing permissions

---

## Logging Format

### Info Logs

```
[2024-01-20T10:30:00.123Z] [INFO] Processing webhook event {"event_name":"form_submit","timestamp":"2024-01-20T10:30:00Z"}
[2024-01-20T10:30:00.456Z] [INFO] Successfully added lead to Google Sheets {"phone":"0901234567","name":"Nguyen Van A"}
```

### Warning Logs

```
[2024-01-20T10:30:01.789Z] [WARN] Duplicate lead detected, skipping {"phone":"0901234567"}
[2024-01-20T10:30:02.012Z] [WARN] No phone number in form submission
```

### Error Logs

```
[2024-01-20T10:30:03.345Z] [ERROR] Error appending row to sheet {"message":"Permission denied","stack":"..."}
```

---

## Testing Examples

### cURL Examples

#### Test webhook with minimal data

```bash
curl -X POST http://localhost:3000/webhook/zalo \
  -H "Content-Type: application/json" \
  -d '{
    "event_name": "form_submit",
    "data": {
      "fields": [
        {"name": "Phone", "value": "0901234567"}
      ]
    }
  }'
```

#### Test webhook with full data

```bash
curl -X POST http://localhost:3000/webhook/zalo \
  -H "Content-Type: application/json" \
  -d '{
    "event_name": "form_submit",
    "app_id": "123456789",
    "timestamp": "2024-01-20T10:30:00Z",
    "data": {
      "form_id": "test_form",
      "submit_time": 1705745000000,
      "fields": [
        {"name": "Name", "value": "Nguyen Van A"},
        {"name": "Phone", "value": "+84 901 234 567"},
        {"name": "Email", "value": "test@example.com"},
        {"name": "Company", "value": "ABC Corp"}
      ],
      "user_info": {
        "user_id": "zalo_123",
        "user_name": "Nguyen Van A"
      }
    }
  }'
```

#### Test health endpoint

```bash
curl http://localhost:3000/health
```

#### Check auth status

```bash
curl http://localhost:3000/auth/status
```

### Postman Collection

Import vào Postman:

```json
{
  "info": {
    "name": "Zalo to Sheets API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "http://localhost:3000/health"
      }
    },
    {
      "name": "Auth Status",
      "request": {
        "method": "GET",
        "url": "http://localhost:3000/auth/status"
      }
    },
    {
      "name": "Webhook - Form Submit",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "url": "http://localhost:3000/webhook/zalo",
        "body": {
          "mode": "raw",
          "raw": "{\n  \"event_name\": \"form_submit\",\n  \"data\": {\n    \"fields\": [\n      {\"name\": \"Name\", \"value\": \"Test User\"},\n      {\"name\": \"Phone\", \"value\": \"0901234567\"},\n      {\"name\": \"Email\", \"value\": \"test@example.com\"}\n    ]\n  }\n}"
        }
      }
    }
  ]
}
```

---

## Webhook Security

### Signature Verification

Nếu Zalo gửi signature trong header `x-zalo-signature`:

1. Server sẽ verify signature bằng HMAC-SHA256
2. Secret key: `ZALO_WEBHOOK_SECRET` trong `.env`
3. Signature không khớp → return 401

### Best Practices

1. **Always use HTTPS** (production)
2. **Verify signatures** nếu Zalo cung cấp
3. **Rate limiting** để tránh abuse
4. **Log all events** để audit
5. **Validate input** trước khi process

---

## Rate Limits

### Current Implementation

- No rate limiting (local development)
- Google Sheets API: 100 requests/100 seconds/user
- Google Sheets API: 500 requests/100 seconds/project

### Production Recommendations

Implement rate limiting:
- 100 requests/minute per IP
- 1000 requests/hour per IP

Use Redis hoặc in-memory cache cho rate limiting.

---

Nếu có thắc mắc về API, check logs hoặc liên hệ support!
