# Deploy Email Confirmation Function

## Quick Deploy Steps

### 1. Set Resend API Key in Supabase

```bash
# Get your Resend API key from https://resend.com/api-keys
# Then set it as a secret in Supabase:

supabase secrets set RESEND_API_KEY=re_your_actual_api_key_here
```

### 2. Deploy the Edge Function

```bash
# Navigate to project root
cd c:\Users\xmaxe\Desktop\cutzio.beta

# Deploy the function
supabase functions deploy send-booking-confirmation
```

### 3. Test the Function

**Option A: Using the test script**
```bash
node test-email.js
```

**Option B: Create a real booking**
1. Go to your booking page
2. Fill out the form with a test email
3. Submit the booking
4. Check `creativedesignsdevs@gmail.com` inbox

### 4. Check Function Logs

```bash
# View real-time logs
supabase functions logs send-booking-confirmation --tail

# View recent logs
supabase functions logs send-booking-confirmation
```

## Troubleshooting

### Email not sending?

1. **Check API Key**:
   ```bash
   supabase secrets list
   ```
   Make sure `RESEND_API_KEY` is set

2. **Check Function Logs**:
   ```bash
   supabase functions logs send-booking-confirmation
   ```
   Look for error messages

3. **Verify Resend Dashboard**:
   - Go to https://resend.com/emails
   - Check if emails are being sent
   - Look for any errors or bounces

### "Booking Failed" Error?

This is likely a Supabase database issue, not email. Check:

1. **RLS Policies**: Make sure public users can insert appointments
2. **Table Structure**: Verify all required fields exist
3. **Browser Console**: Check for specific error messages

Run this SQL in Supabase to check RLS:
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('appointments', 'customers');

-- Check policies
SELECT * FROM pg_policies 
WHERE tablename IN ('appointments', 'customers');
```

## Email Template Features

✅ Professional barber shop design
✅ Dark gradient header with scissors emoji
✅ Booking ID display
✅ Service, date, time details
✅ Customer phone (if provided)
✅ Price (if provided)
✅ Notes (if provided)
✅ Arrival reminder
✅ Cancellation policy
✅ Responsive design

## Email Delivery

- **To**: `creativedesignsdevs@gmail.com` (always)
- **CC**: Customer email (if provided)
- **From**: `Cutzio Bookings <onboarding@resend.dev>`
- **Subject**: `✂️ Appointment Confirmed - [Service Name]`

## Rate Limits (Resend Free Tier)

- 100 emails/day
- 3,000 emails/month
- Upgrade at https://resend.com/pricing if needed

## Next Steps

1. ✅ Deploy function
2. ✅ Test with real booking
3. ✅ Verify email delivery
4. 🔄 (Optional) Set up custom domain for production
5. 🔄 (Optional) Customize email template further

## Custom Domain Setup (Optional)

For production, use your own domain instead of `onboarding@resend.dev`:

1. Go to https://resend.com/domains
2. Add your domain
3. Add DNS records to your domain provider
4. Update the `from` field in the edge function:
   ```typescript
   from: 'Cutzio Bookings <bookings@yourdomain.com>'
   ```
5. Redeploy the function

## Support

If you encounter issues:
1. Check function logs
2. Check Resend dashboard
3. Verify API key is set correctly
4. Test with the test script first
