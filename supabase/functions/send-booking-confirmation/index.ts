// Edge Function for sending emails via Mailerlite
// Handles booking confirmations, cancellations, and reminders

declare const Deno: {
  env: {
    get(key: string): string | undefined
  }
}

// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const MAILERLITE_API_KEY = Deno.env.get('MAILERLITE_API_KEY')
const FUNCTION_SECRET = Deno.env.get('FUNCTION_SECRET')
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
  .split(',')
  .map((o: string) => o.trim())
  .filter(Boolean)

const MAILERLITE_API_URL = 'https://connect.mailerlite.com/api'

const buildCorsHeaders = (origin: string) => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
})

const isAllowedOrigin = (origin: string) => {
  if (!ALLOWED_ORIGINS.length) return false
  return ALLOWED_ORIGINS.includes(origin)
}

interface EmailData {
  type: 'confirmation' | 'cancellation' | 'reminder'
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
  cancellationReason?: string
}

const validate = (payload: unknown): EmailData => {
  if (typeof payload !== 'object' || payload === null) {
    throw new Error('Invalid payload')
  }
  const obj = payload as Record<string, unknown>
  const requiredStrings: Array<keyof EmailData> = [
    'type',
    'customerEmail',
    'customerName',
    'businessName',
    'serviceName',
    'appointmentDate',
    'appointmentTime',
  ]

  for (const key of requiredStrings) {
    if (typeof obj[key] !== 'string' || !obj[key]) {
      throw new Error(`Missing or invalid field: ${key}`)
    }
  }

  if (!['confirmation', 'cancellation', 'reminder'].includes(obj.type as string)) {
    throw new Error('Invalid type: must be confirmation, cancellation, or reminder')
  }

  if (obj.price !== undefined && typeof obj.price !== 'number') {
    throw new Error('Invalid field: price')
  }
  if (obj.customerPhone !== undefined && typeof obj.customerPhone !== 'string') {
    throw new Error('Invalid field: customerPhone')
  }
  if (obj.notes !== undefined && typeof obj.notes !== 'string') {
    throw new Error('Invalid field: notes')
  }
  if (obj.bookingId !== undefined && typeof obj.bookingId !== 'string') {
    throw new Error('Invalid field: bookingId')
  }
  if (obj.cancellationReason !== undefined && typeof obj.cancellationReason !== 'string') {
    throw new Error('Invalid field: cancellationReason')
  }

  return {
    type: obj.type as 'confirmation' | 'cancellation' | 'reminder',
    customerEmail: obj.customerEmail as string,
    customerName: obj.customerName as string,
    businessName: obj.businessName as string,
    serviceName: obj.serviceName as string,
    appointmentDate: obj.appointmentDate as string,
    appointmentTime: obj.appointmentTime as string,
    price: obj.price as number | undefined,
    customerPhone: obj.customerPhone as string | undefined,
    notes: obj.notes as string | undefined,
    bookingId: obj.bookingId as string | undefined,
    cancellationReason: obj.cancellationReason as string | undefined,
  }
}

serve(async (req: Request) => {
  const origin = req.headers.get('origin') ?? ''
  const allowedOrigin = isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0]

  if (!allowedOrigin) {
    return new Response(
      JSON.stringify({ error: 'Origin not allowed' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const corsHeaders = {
    ...buildCorsHeaders(allowedOrigin),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Require shared secret to prevent abuse
  if (!FUNCTION_SECRET) {
    return new Response(
      JSON.stringify({ error: 'Server misconfigured: missing FUNCTION_SECRET' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  const apiKey = req.headers.get('x-api-key')
  if (!apiKey || apiKey !== FUNCTION_SECRET) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  if (!MAILERLITE_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'Server misconfigured: missing MAILERLITE_API_KEY' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  try {
    const data = validate(await req.json())

    // Import Mailerlite functions dynamically
    const { sendEmailViaMailerlite } = await import('./mailerlite-helper.ts')

    const result = await sendEmailViaMailerlite(data, MAILERLITE_API_KEY)

    if (!result.success) {
      throw new Error(result.error)
    }

    return new Response(
      JSON.stringify({ success: true, campaignId: result.campaignId }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error sending email:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
