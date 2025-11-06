# Testing Clerk Webhooks Locally with ngrok

This guide explains how to set up and test Clerk webhooks in your local development environment using ngrok.

## Prerequisites

- [ngrok](https://ngrok.com/) installed and authenticated
- Local API server running (typically on `http://localhost:4000`)
- Clerk account with webhook configuration access

## Quick Start

### 1. Start Your Local API Server

```bash
pnpm dev:api
```

Ensure your API is running on the expected port (default: `4000`).

### 2. Start ngrok Tunnel

Run ngrok to create a tunnel to your local API server:

```bash
ngrok http 4000 --domain=casual-light-viper.ngrok-free.app
```

This will:

- Create a secure tunnel from the ngrok domain to `localhost:4000`
- Use the reserved domain `casual-light-viper.ngrok-free.app`
- Display connection status and request logs

### 3. Configure Clerk Webhook Endpoint

In your [Clerk Dashboard](https://dashboard.clerk.com):

1. Navigate to **Webhooks** in the left sidebar
2. Add or update your webhook endpoint:
   - **Endpoint URL**: `https://casual-light-viper.ngrok-free.app/api/webhooks/clerk`
   - **Events**: Select the events you want to receive (e.g., `user.created`, `user.updated`, `session.created`)
3. Copy the **Signing Secret** and add it to your `.env` file:

   ```bash
   CLERK_WEBHOOK_SECRET=whsec_...
   ```

### 4. Test the Webhook

Trigger a webhook event in Clerk (e.g., create a test user) and watch:

- **ngrok console**: Shows incoming HTTP requests in real-time
- **API logs**: Your local server logs will show webhook processing

## Troubleshooting

### ngrok Domain Not Working

If the reserved domain doesn't work:

1. Verify the domain is registered to your ngrok account
2. Check that you're authenticated: `ngrok config check`
3. Try using a random domain instead: `ngrok http 4000`

### Webhook Verification Failing

If Clerk webhook signature verification fails:

1. Ensure `CLERK_WEBHOOK_SECRET` is set correctly in `.env`
2. Restart your API server after updating environment variables
3. Check that the webhook endpoint in Clerk matches your ngrok URL exactly

### Not Receiving Webhooks

1. Verify ngrok tunnel is active and showing "online"
2. Check Clerk Dashboard webhook logs for delivery status
3. Ensure your firewall isn't blocking ngrok connections
4. Confirm the webhook endpoint path is correct (`/api/webhooks/clerk`)

## Notes

- **Reserved Domain**: `casual-light-viper.ngrok-free.app` is a reserved domain for this project. It won't change between sessions.
- **Free Plan Limitations**: ngrok free plan allows one tunnel at a time
- **HTTPS Only**: Clerk webhooks require HTTPS, which ngrok provides automatically
- **Request Inspection**: Use the ngrok web interface at `http://localhost:4040` to inspect requests

## Alternative: Using a Dynamic Domain

If you don't have a reserved domain:

```bash
ngrok http 4000
```

This will generate a random URL like `https://abc123.ngrok-free.app`. You'll need to update the Clerk webhook endpoint URL each time you restart ngrok.

## See Also

- [Clerk Webhooks Documentation](https://clerk.com/docs/integration/webhooks)
- [ngrok Documentation](https://ngrok.com/docs)
- API webhook handler: `apps/api/src/routers/webhooks.ts`
