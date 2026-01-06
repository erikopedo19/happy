# Email Confirmation Setup with Resend

This guide will help you set up email confirmations for bookings using Resend.

## Prerequisites

1. A Resend account (sign up at https://resend.com)
2. Supabase CLI installed
3. Your domain verified in Resend (or use their test domain)

## Setup Steps

### 1. Get Your Resend API Key

1. Go to https://resend.com/api-keys
2. Create a new API key
3. Copy the API key (it starts with `re_`)

### 2. Configure Resend Domain

**Option A: Use Resend's Test Domain (for testing)**
- You can send emails from `onboarding@resend.dev`
- Limited to sending to your own email address
- No setup required

**Option B: Use Your Own Domain (for production)**
1. Go to https://resend.com/domains
2. Add your domain (e.g., `creativedesignsdevs.com`)
3. Add the DNS records provided by Resend to your domain
4. Wait for verification (usually takes a few minutes)
5. Update the `from` field in the edge function to use your domain:
   ```typescript
   from: 'Cutzio Bookings <bookings@creativedesignsdevs.com>'
   ```

### 3. Set Up Environment Variables

#### Local Development (.env file)
Update your `.env` file:
```bash
RESEND_API_KEY="re_your_actual_api_key_here"
```

#### Supabase Production
Set the secret in Supabase:
```bash
# Using Supabase CLI
supabase secrets set RESEND_API_KEY=re_your_actual_api_key_here

# Or via Supabase Dashboard:
# 1. Go to your project settings
# 2. Navigate to Edge Functions > Secrets
# 3. Add RESEND_API_KEY with your API key
```

### 4. Deploy the Edge Function

```bash
# Make sure you're in the project root
cd c:\Users\xmaxe\Desktop\cutzio.beta

# Deploy the edge function
supabase functions deploy send-booking-confirmation

# Or deploy with environment variable
supabase functions deploy send-booking-confirmation --no-verify-jwt
```

### 5. Test the Email Functionality

#### Test with Public Booking
1. Go to your booking page (e.g., `http://localhost:8081/book/your-booking-link`)
2. Fill out the booking form with a valid email
3. Submit the booking
4. Check the email inbox for the confirmation

#### Test with Internal Booking
1. Log in to the dashboard
2. Go to Agenda
3. Click on a time slot to create an appointment
4. Select a customer with an email address
5. Create the appointment
6. Check the email inbox for the confirmation

### 6. Email Configuration

The confirmation email includes:
- ✅ Customer name and greeting
- ✅ Business name
- ✅ Service details
- ✅ Appointment date and time
- ✅ Price (if available)
- ✅ Notes (if provided)
- ✅ Professional HTML template with gradient header
- ✅ BCC copy to `creativedesignsdevs@gmail.com`

### 7. Troubleshooting

#### Emails not sending
1. Check Supabase Edge Function logs:
   ```bash
   supabase functions logs send-booking-confirmation
   ```

2. Verify your Resend API key is correct:
   ```bash
   supabase secrets list
   ```

3. Check Resend dashboard for delivery status:
   - Go to https://resend.com/emails
   - View recent emails and their status

#### Domain verification issues
- Ensure all DNS records are added correctly
- Wait 24-48 hours for DNS propagation
- Use Resend's test domain for immediate testing

#### Rate limits
- Resend free tier: 100 emails/day, 3,000 emails/month
- Upgrade your plan if you need more

### 8. Customization

To customize the email template, edit:
```
supabase/functions/send-booking-confirmation/index.ts
```

Then redeploy:
```bash
supabase functions deploy send-booking-confirmation
```

## Email Features

- **Automatic sending**: Emails are sent automatically after successful booking
- **Graceful failure**: If email sending fails, the booking still succeeds
- **BCC to business**: All confirmation emails are BCC'd to `creativedesignsdevs@gmail.com`
- **Professional design**: Beautiful HTML email with gradient header and responsive design
- **Complete details**: Includes all booking information in an easy-to-read format

## Security Notes

- Never commit your Resend API key to version control
- Use Supabase secrets for production
- The edge function validates all inputs
- CORS is properly configured for security

## Support

If you encounter issues:
1. Check Supabase Edge Function logs
2. Check Resend dashboard for email delivery status
3. Verify your API key and domain settings
4. Ensure the edge function is deployed

## Next Steps

- [ ] Get Resend API key
- [ ] Set up domain in Resend (or use test domain)
- [ ] Configure environment variables
- [ ] Deploy edge function
- [ ] Test email sending
- [ ] Monitor email delivery in Resend dashboard
