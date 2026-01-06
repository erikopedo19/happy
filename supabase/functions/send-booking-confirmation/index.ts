import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BookingConfirmationData {
  customerEmail: string
  customerName: string
  customerPhone?: string
  businessName: string
  serviceName: string
  appointmentDate: string
  appointmentTime: string
  price?: number
  notes?: string
  bookingId?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { 
      customerEmail, 
      customerName,
      customerPhone,
      businessName, 
      serviceName, 
      appointmentDate, 
      appointmentTime,
      price,
      notes,
      bookingId
    }: BookingConfirmationData = await req.json()

    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Cutzio Bookings <onboarding@resend.dev>',
        to: ['creativedesignsdevs@gmail.com'],
        cc: customerEmail ? [customerEmail] : [],
        subject: `✂️ Appointment Confirmed - ${serviceName}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Booking Confirmation</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
                <tr>
                  <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                      <!-- Header -->
                      <tr>
                        <td style="background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); padding: 40px 30px; text-align: center;">
                          <div style="font-size: 48px; margin-bottom: 15px;">✂️</div>
                          <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">Appointment Confirmed!</h1>
                          <p style="margin: 10px 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">Your barber is ready for you</p>
                        </td>
                      </tr>
                      
                      <!-- Content -->
                      <tr>
                        <td style="padding: 40px 30px;">
                          <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                            Hi <strong>${customerName}</strong>,
                          </p>
                          <p style="margin: 0 0 30px; color: #666666; font-size: 15px; line-height: 1.6;">
                            Great news! Your appointment has been confirmed. We're looking forward to giving you a fresh new look!
                          </p>
                          
                          <!-- Appointment Details Card -->
                          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-left: 5px solid #1a1a1a; border-radius: 8px; margin-bottom: 30px;">
                            <tr>
                              <td style="padding: 25px;">
                                <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 20px; font-weight: 600;">📋 Appointment Details</h2>
                                
                                <table width="100%" cellpadding="8" cellspacing="0">
                                  ${bookingId ? `
                                  <tr>
                                    <td style="color: #666666; font-size: 14px; padding: 8px 0;">
                                      <strong style="color: #333333;">Booking ID:</strong>
                                    </td>
                                    <td style="color: #1a1a1a; font-size: 14px; text-align: right; padding: 8px 0; font-weight: 600;">
                                      #${bookingId}
                                    </td>
                                  </tr>
                                  ` : ''}
                                  <tr>
                                    <td style="color: #666666; font-size: 14px; padding: 8px 0;">
                                      <strong style="color: #333333;">Service:</strong>
                                    </td>
                                    <td style="color: #333333; font-size: 14px; text-align: right; padding: 8px 0;">
                                      ${serviceName}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td style="color: #666666; font-size: 14px; padding: 8px 0;">
                                      <strong style="color: #333333;">Date:</strong>
                                    </td>
                                    <td style="color: #333333; font-size: 14px; text-align: right; padding: 8px 0;">
                                      ${appointmentDate}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td style="color: #666666; font-size: 14px; padding: 8px 0;">
                                      <strong style="color: #333333;">Time:</strong>
                                    </td>
                                    <td style="color: #333333; font-size: 14px; text-align: right; padding: 8px 0;">
                                      ${appointmentTime}
                                    </td>
                                  </tr>
                                  ${price ? `
                                  <tr>
                                    <td style="color: #666666; font-size: 14px; padding: 8px 0;">
                                      <strong style="color: #333333;">Price:</strong>
                                    </td>
                                    <td style="color: #333333; font-size: 14px; text-align: right; padding: 8px 0;">
                                      $${price}
                                    </td>
                                  </tr>
                                  ` : ''}
                                  ${customerPhone ? `
                                  <tr>
                                    <td style="color: #666666; font-size: 14px; padding: 8px 0;">
                                      <strong style="color: #333333;">Contact:</strong>
                                    </td>
                                    <td style="color: #333333; font-size: 14px; text-align: right; padding: 8px 0;">
                                      ${customerPhone}
                                    </td>
                                  </tr>
                                  ` : ''}
                                  ${notes ? `
                                  <tr>
                                    <td colspan="2" style="color: #666666; font-size: 14px; padding: 12px 0 0;">
                                      <strong style="color: #333333;">Notes:</strong><br>
                                      <span style="color: #666666;">${notes}</span>
                                    </td>
                                  </tr>
                                  ` : ''}
                                </table>
                              </td>
                            </tr>
                          </table>
                          
                          <!-- Important Info -->
                          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 30px; border-radius: 4px;">
                            <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                              <strong>Please arrive 5-10 minutes early</strong> to ensure your appointment starts on time.
                            </p>
                          </div>
                          
                          <p style="margin: 0 0 25px; color: #666666; font-size: 15px; line-height: 1.6;">
                            <strong>Need to reschedule or cancel?</strong><br>
                            Call us at least 24 hours in advance or reply to this email.
                          </p>
                          
                          <p style="margin: 0; color: #666666; font-size: 15px; line-height: 1.6;">
                            See you soon! 🎉<br>
                            <em style="color: #1a1a1a; font-weight: 600;">- ${businessName} Team</em>
                          </p>
                        </td>
                      </tr>
                      
                      <!-- Footer -->
                      <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                          <p style="margin: 0 0 10px; color: #999999; font-size: 12px;">
                            This is an automated confirmation email from Cutzio
                          </p>
                          <p style="margin: 0; color: #999999; font-size: 12px;">
                            © ${new Date().getFullYear()} ${businessName}. All rights reserved.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(`Resend API error: ${JSON.stringify(data)}`)
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
