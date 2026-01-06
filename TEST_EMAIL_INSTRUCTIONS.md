# Test Email Function - Manual Steps

Since Supabase CLI is not installed, follow these steps to deploy and test:

## Option 1: Deploy via Supabase Dashboard (Recommended)

### Step 1: Go to Supabase Dashboard
1. Open https://supabase.com/dashboard
2. Select your project: `idcifrhzlmxcdihzdtmn`
3. Go to **Edge Functions** in the left sidebar

### Step 2: Set Resend API Key
1. Click on **Secrets** tab
2. Click **Add Secret**
3. Name: `RESEND_API_KEY`
4. Value: Your Resend API key (starts with `re_`)
5. Click **Save**

### Step 3: Deploy Function
1. Click **Create Function** or **Deploy Function**
2. Name: `send-booking-confirmation`
3. Copy the entire content from:
   `c:\Users\xmaxe\Desktop\cutzio.beta\supabase\functions\send-booking-confirmation\index.ts`
4. Paste into the editor
5. Click **Deploy**

### Step 4: Test the Function
1. Go to the **Invoke** tab
2. Use this test payload:
```json
{
  "customerEmail": "test@example.com",
  "customerName": "John Doe",
  "customerPhone": "555-1234",
  "businessName": "Cutzio Barber Shop",
  "serviceName": "Haircut & Beard Trim",
  "appointmentDate": "Monday, January 15, 2025",
  "appointmentTime": "14:00",
  "price": 45,
  "notes": "Fade on sides",
  "bookingId": "abc12345"
}
```
3. Click **Invoke**
4. Check `creativedesignsdevs@gmail.com` inbox

---

## Option 2: Install Supabase CLI

### Windows Installation:
```powershell
# Using npm
npm install -g supabase

# OR using Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### After Installation:
```bash
# Login
supabase login

# Link project
supabase link --project-ref idcifrhzlmxcdihzdtmn

# Set API key
supabase secrets set RESEND_API_KEY=re_your_key_here

# Deploy
supabase functions deploy send-booking-confirmation

# Test
supabase functions invoke send-booking-confirmation --body '{"customerEmail":"test@example.com","customerName":"John Doe","businessName":"Cutzio","serviceName":"Haircut","appointmentDate":"Jan 15","appointmentTime":"2:00 PM","bookingId":"test123"}'
```

---

## Option 3: Test via Your App

1. Make sure the function is deployed (via dashboard or CLI)
2. Go to your booking page in the browser
3. Create a test booking with your email
4. Check `creativedesignsdevs@gmail.com` for the confirmation email
5. Check browser console for any errors

---

## Verify Function is Working

### Check Logs in Dashboard:
1. Go to Supabase Dashboard
2. Edge Functions → `send-booking-confirmation`
3. Click **Logs** tab
4. Look for recent invocations and any errors

### Check Resend Dashboard:
1. Go to https://resend.com/emails
2. Look for recent sent emails
3. Check delivery status

---

## Troubleshooting

### "Function not found" error:
- Make sure function is deployed in Supabase dashboard
- Check function name is exactly: `send-booking-confirmation`

### "RESEND_API_KEY not set" error:
- Go to Edge Functions → Secrets
- Verify `RESEND_API_KEY` is set
- Make sure it starts with `re_`

### Email not received:
- Check spam folder
- Verify email in Resend dashboard
- Check function logs for errors
- Make sure Resend API key is valid

### Booking fails:
- This is separate from email issue
- Check browser console for error
- Verify RLS policies in Supabase
- Check appointments table exists

---

## Quick Test Command (if CLI installed)

```bash
cd c:\Users\xmaxe\Desktop\cutzio.beta
supabase functions invoke send-booking-confirmation --body "{\"customerEmail\":\"test@example.com\",\"customerName\":\"Test User\",\"businessName\":\"Cutzio\",\"serviceName\":\"Haircut\",\"appointmentDate\":\"January 15, 2025\",\"appointmentTime\":\"2:00 PM\",\"bookingId\":\"test123\"}"
```

Check `creativedesignsdevs@gmail.com` inbox after running!
