# Stripe payments setup — step by step

This guide gets you from zero to **$20/month subscriptions** for the AI Product Decision Platform (14-day trial, then Stripe Checkout).

---

## What you need

- A Stripe account (free at [stripe.com](https://stripe.com))
- Your **backend** running (local or deployed) so Stripe can send webhooks
- Your **frontend** URL for success/cancel redirects (e.g. `http://localhost:3000` or `https://your-app.vercel.app`)

---

## Step 1: Log in to Stripe

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com) and sign in (or create an account).
2. Use **Test mode** (toggle in the top right) while developing. Switch to **Live** when you’re ready to charge real cards.

---

## Step 2: Create the $20/month product and price

1. In the Stripe Dashboard, go to **Product catalog** → **Products** (or **Add product**).
2. Click **+ Add product**.
3. Fill in:
   - **Name:** e.g. `AI Product Decision Platform — Monthly`
   - **Description:** (optional) e.g. `Decision Cards + weekly report. Upload logs, generate insights.`
   - **Pricing:**
     - Choose **Recurring**.
     - **Price:** `20` (and your currency, e.g. USD).
     - **Billing period:** Monthly.
4. Click **Save product**.
5. On the product page, open the **Pricing** section. You’ll see a price with an ID like `price_1ABC123...`.  
   **Copy that ID** — this is your **STRIPE_PRICE_ID** (e.g. `price_1ABC123xyz`).

---

## Step 3: Get your Secret Key

1. In Stripe Dashboard go to **Developers** → **API keys**.
2. Under **Standard keys**, find **Secret key** (starts with `sk_test_` in test mode or `sk_live_` in live).
3. Click **Reveal** and **Copy**.  
   This is your **STRIPE_SECRET_KEY**.  
   ⚠️ Never commit this or expose it in the frontend. Only the backend should use it.

---

## Step 4: Add Stripe keys to your backend

1. Open your backend `.env` (or create it from `.env.example`).
2. Add (replace with your real values):

```env
STRIPE_SECRET_KEY=<paste from Stripe Dashboard → API keys>
STRIPE_PRICE_ID=<paste from Stripe Dashboard → your product price ID>
```

3. Save the file. Restart the backend if it’s already running.

**Check:** With only these two, the **Subscribe** button in your app can create a Checkout session and redirect users to Stripe. Subscription status in your database will only update after you complete the webhook step below.

---

## Step 5: Create the webhook (so your app knows when someone subscribes)

The webhook is an HTTP endpoint Stripe calls when events happen (e.g. subscription created/updated/canceled). Your backend already has the route: **POST /billing/webhook**.

### 5a. Local development (optional)

To test webhooks on your machine:

1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli):  
   - Windows: `scoop install stripe` or download from GitHub.  
   - Mac: `brew install stripe/stripe-cli/stripe`.
2. Log in: `stripe login`.
3. Forward webhooks to your local backend (backend must be on port 8000):

   ```bash
   stripe listen --forward-to localhost:8000/billing/webhook
   ```

4. The CLI will print a **webhook signing secret**.  
   Add it to `.env`:

   ```env
   STRIPE_WEBHOOK_SECRET=<paste from CLI output>
   ```

5. Restart the backend. Trigger a test subscription in your app; the CLI will forward events to localhost and your app will update the organization’s `subscription_status`.

### 5b. Production (deployed backend)

1. In Stripe Dashboard go to **Developers** → **Webhooks**.
2. Click **Add endpoint**.
3. **Endpoint URL:**  
   Your backend base URL + `/billing/webhook`, e.g.  
   `https://your-backend.onrender.com/billing/webhook`.
4. Click **Select events** and add:
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click **Add endpoint**.
6. Open the new endpoint and click **Reveal** under **Signing secret**. Copy the value (starts with `whsec_`).
7. Add it to your backend’s **production** environment (e.g. Render env vars):

   ```env
   STRIPE_WEBHOOK_SECRET=<paste from Stripe Dashboard signing secret>
   ```

8. Redeploy or restart the backend so it picks up the new variable.

**Important:** Use the **same** Stripe mode (test vs live) for both API keys and webhook. For a second environment (e.g. live), add a separate webhook endpoint and use its signing secret in that environment.

---

## Step 6: Confirm success and cancel URLs

Your frontend already sends `success_url` and `cancel_url` when calling **POST /billing/checkout** (e.g. in Settings → Billing). Those should point to your real app:

- **Local:** `http://localhost:3000/settings?subscription=success` and `...?subscription=canceled`
- **Production:** `https://your-app.vercel.app/settings?subscription=success` and `...?subscription=canceled`

No code change is needed if the frontend uses `window.location.origin` (it does in `BillingBlock.tsx`).

---

## Step 7: End-to-end test

1. **Backend:** Ensure all three env vars are set:  
   `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`.
2. **Frontend:** Log in, create an organization (or use one you have), go to **Settings**.
3. In Billing, click **Subscribe — $20/month** (or “Add payment method”).
4. You should be redirected to Stripe Checkout. In **test mode** use card `4242 4242 4242 4242`, any future expiry, any CVC, any postal code.
5. Complete checkout. You should be redirected back to Settings with `?subscription=success`.
6. Check:
   - **Stripe Dashboard** → **Customers** and **Subscriptions** (new customer and active subscription).
   - **Your app:** Settings Billing should show “Subscribed” and upload/generate should stay allowed after trial.

If the webhook is working, the organization’s `subscription_status` in Supabase will be set to `active` (or `trialing` if Stripe sends that). If not, check backend logs and Stripe **Developers → Webhooks → [your endpoint] → Logs** for errors.

---

## Quick reference: env vars

| Variable | Where | Example |
|----------|--------|--------|
| `STRIPE_SECRET_KEY` | Backend `.env` / production env | From Stripe Dashboard → API keys |
| `STRIPE_PRICE_ID` | Backend `.env` / production env | From Stripe Dashboard → your product price |
| `STRIPE_WEBHOOK_SECRET` | Backend `.env` / production env | From CLI or Dashboard signing secret |

---

## Troubleshooting

- **“Billing not configured”**  
  Backend is missing `STRIPE_SECRET_KEY` or `STRIPE_PRICE_ID`. Add them and restart.

- **“Webhook not configured”**  
  Backend is missing `STRIPE_WEBHOOK_SECRET`. Add the signing secret for the endpoint Stripe calls (CLI for local, Dashboard for production).

- **Checkout works but subscription status doesn’t update**  
  Webhook isn’t received or is failing. Check:  
  - Webhook URL is correct and reachable (no typo, HTTPS in production).  
  - `STRIPE_WEBHOOK_SECRET` matches the endpoint (test vs live; CLI vs Dashboard).  
  - Stripe webhook logs for 4xx/5xx or “invalid signature”.

- **Invalid signature**  
  You’re using the wrong `STRIPE_WEBHOOK_SECRET` for this endpoint/mode, or the request body was modified. Ensure the backend reads the raw body for the webhook (our route does).

- **CORS / 403 on Checkout**  
  Stripe Checkout is hosted by Stripe; the browser goes to Stripe, then back to your success_url. CORS applies to your **backend** API: ensure `ALLOWED_ORIGINS` includes your frontend origin so the frontend can call `POST /billing/checkout`.

Once this is done, your Stripe payments setup is complete: trial → Checkout → webhook → subscription status in your app.
