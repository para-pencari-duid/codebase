# WhatsApp Integration - Troubleshooting Guide

## Setup Checklist

### 1. Environment Variables
Make sure `.env` file contains:
```env
WA_SERVICE_URL="https://wa-services.tegararsyadani.my.id"
```

### 2. Verify WA Gateway Service
Test if the WA Gateway is running:
```bash
curl https://wa-services.tegararsyadani.my.id
```

Expected response: `WA Microservice is Running 🚀`

### 3. Common Issues

#### Error: "Failed to initialize WhatsApp"

**Possible causes:**

1. **WA Service is Down**
   - Check if `https://wa-services.tegararsyadani.my.id` is accessible
   - Try: `curl https://wa-services.tegararsyadani.my.id`

2. **CORS Issues**
   - Make sure your WA Gateway has CORS enabled
   - Check browser console for CORS errors

3. **Environment Variable Not Loaded**
   - Restart Next.js dev server after adding `WA_SERVICE_URL` to `.env`
   - Run: `pkill -f "next dev"` then `npm run dev`

4. **Network/Firewall**
   - Check if your server can reach the WA Gateway URL
   - Test: `curl -X POST https://wa-services.tegararsyadani.my.id/session/status/test`

#### Check Logs

Server-side logs will show:
```
[WA] Service URL: https://wa-services.tegararsyadani.my.id
[WA] Initializing session for tenant: bakery-xxxxxxxxxxxx
[WA] Connecting to: https://wa-services.tegararsyadani.my.id/session/init
[WA] Init response status: 200
```

If you see errors, check:
- Network connectivity
- WA Gateway service logs
- Firewall rules

### 4. Manual Test

Test the WA service directly:

```bash
# Check service status
curl https://wa-services.tegararsyadani.my.id

# Initialize session (replace TENANT_ID)
curl -X POST https://wa-services.tegararsyadani.my.id/session/init \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "test-tenant"}'

# Check session status
curl https://wa-services.tegararsyadani.my.id/session/status/test-tenant

# Send test message (after QR scan)
curl -X POST https://wa-services.tegararsyadani.my.id/send \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "test-tenant",
    "phone": "08123456789",
    "message": "Test message"
  }'
```

### 5. Steps to Connect WhatsApp

1. Go to **Settings** → **WhatsApp** tab
2. Click **"Hubungkan WhatsApp"**
3. Scan QR Code with your WhatsApp app:
   - Open WhatsApp on your phone
   - Tap Menu (⋮) → Linked Devices
   - Tap "Link a Device"
   - Scan the QR code displayed
4. Wait for "WhatsApp Terhubung!" confirmation
5. Enter **Owner Phone** (e.g., 08123456789)
6. Enable desired notifications
7. Click **"Simpan Pengaturan"**

### 6. Rate Limiting

The system has built-in rate limiting:
- **1 message per minute** per phone number
- Low stock alerts bypass rate limit (critical)
- Rate limit resets after 60 seconds

### 7. Notification Types

| Type | Trigger | Recipient | Bypass Rate Limit |
|------|---------|-----------|-------------------|
| Transaction Receipt | After successful payment | Customer | No |
| Low Stock Alert | Stock ≤ minStock | Owner/Manager | Yes |
| Backup Success | After database backup | Owner/Manager | No |
| Daily Report | Manual/Cron | Owner/Manager | No |

### 8. Message Format

All messages use **enterprise-style formatting** with:
- Professional layout (borders, sections)
- Clear structure (header, items, totals)
- Business branding (name, address, phone)
- Emojis for better UX (🎁 for points, ⚠️ for alerts)

### 9. Security

- Only **OWNER** and **MANAGER** roles can access WA settings
- **KASIR** role cannot configure WhatsApp
- Tenant ID is auto-generated and unique
- All notifications are fire-and-forget (async)

### 10. Debugging

Enable verbose logging:
```bash
# In whatsapp.ts, logs are already added:
# [WA] Service URL: ...
# [WA] Initializing session for tenant: ...
# [WA] Init response status: ...
```

Check browser console for client-side errors.
Check terminal/server logs for API errors.

---

## Production Deployment

When deploying to production:

1. Update `.env` with production WA Gateway URL
2. Make sure your production server can reach WA Gateway
3. Configure firewall to allow outbound HTTPS to WA Gateway
4. Use process manager (PM2) to keep WA Gateway running
5. Set up monitoring for WA Gateway uptime
6. Configure backup WA Gateway for redundancy (optional)

---

## Support

If issues persist:
1. Check WA Gateway service logs via SSH
2. Verify PostgreSQL database connection
3. Test API routes directly with curl/Postman
4. Check Next.js server logs
5. Enable debug mode in browser DevTools
