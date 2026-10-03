# UPI QR Code Payment Integration

**Status**: Phase 7 (Post-MVP) | **Priority**: High for invoicing  
**Payment Provider**: Razorpay | **Currency**: INR

---

## Table of Contents

1. [Overview](#overview)
2. [QR Code Types](#qr-code-types)
3. [Static QR Codes](#static-qr-codes)
4. [Dynamic QR Codes](#dynamic-qr-codes)
5. [QR Code Generation](#qr-code-generation)
6. [Display & Rendering](#display--rendering)
7. [Webhook Handling](#webhook-handling)
8. [Use Cases](#use-cases)
9. [Security & Compliance](#security--compliance)

---

## Overview

UPI QR codes allow customers to scan and pay using any UPI-enabled app without redirecting. This is ideal for:

- **Invoices**: Fixed-amount payment QR per invoice
- **Email receipts**: Embedded in email notifications
- **SMS notifications**: Link to QR code image
- **Printed receipts**: Physical QR code
- **Property receipts**: Email/SMS after service completion

### Why QR Codes?

| Advantage | Impact |
|-----------|--------|
| **Works offline** | Customer scans when ready (no internet needed to initiate) |
| **No app switching** | Customer stays in their UPI app |
| **High conversion** | 88-92% completion rate |
| **Multiple uses** | Can be rescanned if payment fails |
| **Compliance** | Approved by NPCI for post-Feb 2026 |
| **Brand control** | Embed in marketing materials |

### Success Rate Comparison

```
┌──────────────────┬────────────┐
│ METHOD           │ SUCCESS %  │
├──────────────────┼────────────┤
│ UPI Intent       │ 92-95%     │
│ Turbo UPI        │ 95%+       │
│ QR Code (static) │ 88-90%     │
│ QR Code (dynamic)│ 90-92%     │
└──────────────────┴────────────┘
```

---

## QR Code Types

### Static QR Code

**Characteristics**:
- Merchant UPI VPA (e.g., `fixify@razorpay`)
- Customer enters amount during payment
- Unlimited scans, multiple uses
- Reusable across invoices

**Best For**:
- Marketing materials
- Social media
- Website checkout
- Point of sale

**Use Case Example**:
```
Fixify website → "Pay via UPI" button
              → Shows static QR code
              → Customer enters amount (₹500-₹5,00,000)
              → Scans QR
              → Payment completed
```

### Dynamic QR Code

**Characteristics**:
- Order/Invoice-specific amount hardcoded
- Fixed amount (customer cannot change)
- Single-use option available
- Auto-generated per invoice

**Best For**:
- Invoice emails
- SMS notifications
- Receipts
- Automatic workflows

**Use Case Example**:
```
Job completed → Invoice generated (₹15,000)
             → Dynamic QR created (amount locked to ₹15,000)
             → Email sent to customer with QR
             → Customer scans QR (amount pre-filled)
             → Payment completed
```

---

## Static QR Codes

### Generation (One-Time Setup)

```typescript
// src/lib/payments/generateStaticQR.ts

import Razorpay from 'razorpay'
import * as fs from 'fs'
import * as path from 'path'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

/**
 * Generate static QR code for merchant
 * Run once and cache the result
 */
export async function generateStaticMerchantQR() {
  try {
    const qrCode = await razorpay.qrCode.create({
      upi_link: true, // UPI-enabled QR
      amount: null, // No fixed amount (customer enters)
      description: 'Fixify - Pay for Home Services',
      notes: {
        business: 'fixify',
        type: 'static_merchant',
      },
    })

    return {
      qr_code_id: qrCode.id,
      upi_link: qrCode.upi_link,
      image_url: qrCode.image_url,
      status: qrCode.status,
    }
  } catch (error) {
    console.error('Static QR generation error:', error)
    throw error
  }
}

/**
 * Store static QR in database for reuse
 */
export async function cacheStaticQR(supabase: any, qrData: any) {
  const { error } = await supabase.from('upi_qr_codes').insert({
    type: 'static',
    razorpay_qr_id: qrData.qr_code_id,
    image_url: qrData.image_url,
    upi_link: qrData.upi_link,
    status: 'active',
    merchant_id: 'fixify_primary',
    created_at: new Date(),
  })

  if (error) {
    throw new Error(`Failed to cache static QR: ${error.message}`)
  }

  return qrData
}
```

### Usage in Frontend

```typescript
// src/components/customer/StaticUPIQR.tsx

'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

export function StaticUPIQR() {
  const [qrData, setQrData] = useState<any>(null)
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    // Fetch static QR from cache
    const fetchQR = async () => {
      const response = await fetch('/api/payments/static-qr')
      const data = await response.json()
      setQrData(data)
    }
    fetchQR()
  }, [])

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '')
    const numValue = parseInt(value) || 0

    if (numValue > 500000) {
      setError('Amount exceeds ₹5,00,000 limit')
      return
    }

    setAmount(value)
    setError('')
  }

  if (!qrData) return <div>Loading...</div>

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Pay via UPI QR Code</h3>

      {/* Amount input */}
      <div>
        <label className="block text-sm font-medium mb-2">Amount (₹)</label>
        <input
          type="text"
          value={amount}
          onChange={handleAmountChange}
          placeholder="Enter amount"
          className="w-full px-3 py-2 border rounded"
        />
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>

      {/* QR Code */}
      <div className="bg-white p-4 border rounded flex justify-center">
        {qrData.image_url && (
          <Image
            src={qrData.image_url}
            alt="UPI QR Code"
            width={250}
            height={250}
            quality={95}
          />
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 p-3 rounded text-sm text-blue-900">
        <ol className="list-decimal list-inside space-y-1">
          <li>Open your UPI app (Google Pay, PhonePe, Paytm, etc.)</li>
          <li>Select "Scan & Pay"</li>
          <li>Scan this QR code</li>
          <li>Verify amount: ₹{amount || '___'}</li>
          <li>Complete payment with your PIN</li>
        </ol>
      </div>

      {/* Copy link option */}
      {qrData.upi_link && (
        <Button
          variant="outline"
          onClick={() => {
            navigator.clipboard.writeText(qrData.upi_link)
            alert('UPI link copied to clipboard!')
          }}
          className="w-full"
        >
          Copy UPI Link
        </Button>
      )}
    </div>
  )
}
```

---

## Dynamic QR Codes

### Generation (Per Invoice)

```typescript
// src/lib/payments/generateDynamicQR.ts

import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

/**
 * Generate dynamic QR code for specific invoice/order
 */
export async function generateDynamicInvoiceQR(
  invoiceId: string,
  amount: number, // in paise
  description: string
) {
  try {
    const qrCode = await razorpay.qrCode.create({
      upi_link: true,
      amount, // Fixed amount (in paise)
      description: description.substring(0, 60), // Max 60 chars
      reference_key: `invoice_${invoiceId}`, // Track which invoice
      single_use: true, // Can be paid only once
      notes: {
        invoice_id: invoiceId,
        type: 'dynamic_invoice',
      },
    })

    return {
      qr_code_id: qrCode.id,
      image_url: qrCode.image_url,
      upi_link: qrCode.upi_link,
      status: qrCode.status,
      amount,
      description,
    }
  } catch (error) {
    console.error('Dynamic QR generation error:', error)
    throw error
  }
}

/**
 * Store dynamic QR in database (linked to invoice)
 */
export async function storeDynamicQR(
  supabase: any,
  invoiceId: string,
  qrData: any
) {
  const { error } = await supabase.from('upi_qr_codes').insert({
    type: 'dynamic',
    invoice_id: invoiceId,
    razorpay_qr_id: qrData.qr_code_id,
    image_url: qrData.image_url,
    upi_link: qrData.upi_link,
    amount: qrData.amount,
    status: 'active',
    created_at: new Date(),
  })

  if (error) {
    throw new Error(`Failed to store dynamic QR: ${error.message}`)
  }

  return qrData
}

/**
 * Deactivate QR code when invoice is paid
 */
export async function deactivateInvoiceQR(
  razorpay: any,
  supabase: any,
  qrCodeId: string
) {
  try {
    await razorpay.qrCode.close(qrCodeId)
    await supabase
      .from('upi_qr_codes')
      .update({ status: 'closed' })
      .eq('razorpay_qr_id', qrCodeId)
  } catch (error) {
    console.error('QR deactivation error:', error)
  }
}
```

### Server Action: Create Invoice with QR

```typescript
// src/lib/payments/createInvoiceWithQR.ts

export async function createInvoiceWithQR(
  jobId: string,
  customerId: string
) {
  try {
    // 1. Calculate final amount (fetch from database)
    const { data: job } = await supabaseServer
      .from('jobs')
      .select('id, quote_id')
      .eq('id', jobId)
      .single()

    const { data: quote } = await supabaseServer
      .from('quotes')
      .select('total')
      .eq('id', job.quote_id)
      .single()

    const amount = quote.total * 100 // Convert to paise

    // 2. Create invoice record
    const { data: invoice, error: invoiceError } = await supabaseServer
      .from('invoices')
      .insert({
        job_id: jobId,
        customer_id: customerId,
        amount,
        status: 'issued',
        issued_at: new Date(),
      })
      .select('id')
      .single()

    if (invoiceError) {
      throw new Error(`Invoice creation failed: ${invoiceError.message}`)
    }

    // 3. Generate QR code
    const qrData = await generateDynamicInvoiceQR(
      invoice.id,
      amount,
      `Fixify Invoice #${invoice.id}`
    )

    // 4. Store QR in database
    await storeDynamicQR(supabaseServer, invoice.id, qrData)

    // 5. Store QR image in Supabase Storage
    const qrImageResponse = await fetch(qrData.image_url)
    const qrBlob = await qrImageResponse.blob()

    const { error: storageError } = await supabaseServer.storage
      .from('invoices')
      .upload(`${invoice.id}/qr-code.png`, qrBlob, {
        contentType: 'image/png',
        upsert: true,
      })

    if (storageError) {
      console.warn('QR image storage error:', storageError)
    }

    // 6. Generate invoice PDF/HTML with embedded QR
    const invoicePDF = await generateInvoicePDF(invoice.id, qrData.image_url)

    return {
      success: true,
      invoice_id: invoice.id,
      amount,
      qr_code: {
        id: qrData.qr_code_id,
        image_url: qrData.image_url,
        upi_link: qrData.upi_link,
      },
      invoice_url: invoicePDF,
    }
  } catch (error) {
    console.error('Create invoice with QR error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invoice creation failed',
    }
  }
}

async function generateInvoicePDF(invoiceId: string, qrImageUrl: string) {
  // Implementation: Use puppeteer/pdfkit to generate PDF with embedded QR
  return `https://invoices.fixify.in/${invoiceId}.pdf`
}
```

---

## QR Code Generation

### API Endpoint: Get QR Codes

```typescript
// src/app/api/payments/qr-codes/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const type = request.nextUrl.searchParams.get('type') || 'all'
    const invoiceId = request.nextUrl.searchParams.get('invoice_id')

    let query = supabaseServer
      .from('upi_qr_codes')
      .select('*')

    if (type === 'static') {
      query = query.eq('type', 'static').eq('status', 'active').limit(1)
    } else if (type === 'dynamic') {
      query = query.eq('type', 'dynamic')
      if (invoiceId) {
        query = query.eq('invoice_id', invoiceId)
      }
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, qr_codes: data })
  } catch (error) {
    console.error('QR fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch QR codes' },
      { status: 500 }
    )
  }
}
```

---

## Display & Rendering

### QR Code Display Component

```typescript
// src/components/payments/QRCodeDisplay.tsx

'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface QRCodeDisplayProps {
  qrData: {
    image_url: string
    upi_link: string
    amount?: number
    description?: string
  }
  size?: 'small' | 'medium' | 'large'
  showDownload?: boolean
}

export function QRCodeDisplay({
  qrData,
  size = 'medium',
  showDownload = true,
}: QRCodeDisplayProps) {
  const [downloading, setDownloading] = useState(false)

  const sizes = {
    small: 150,
    medium: 250,
    large: 400,
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const response = await fetch(qrData.image_url)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `fixify-qr-${Date.now()}.png`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* QR Code */}
      <div className="bg-white p-4 border rounded flex justify-center">
        <Image
          src={qrData.image_url}
          alt="Payment QR Code"
          width={sizes[size]}
          height={sizes[size]}
          quality={95}
          priority
        />
      </div>

      {/* Amount if dynamic */}
      {qrData.amount && (
        <div className="text-center">
          <p className="text-2xl font-bold">
            ₹{(qrData.amount / 100).toLocaleString('en-IN')}
          </p>
          {qrData.description && (
            <p className="text-gray-600 text-sm">{qrData.description}</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2">
        {/* Copy UPI Link */}
        <Button
          variant="outline"
          onClick={() => {
            navigator.clipboard.writeText(qrData.upi_link)
            alert('UPI link copied!')
          }}
          className="w-full"
        >
          Copy UPI Link
        </Button>

        {/* Download QR */}
        {showDownload && (
          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={downloading}
            className="w-full"
          >
            {downloading ? 'Downloading...' : 'Download QR Code'}
          </Button>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 p-3 rounded text-sm">
        <p className="font-medium mb-2">How to pay:</p>
        <ol className="list-decimal list-inside space-y-1 text-blue-900">
          <li>Open your UPI app</li>
          <li>Select "Scan & Pay"</li>
          <li>Scan this QR code</li>
          <li>Verify amount and complete</li>
        </ol>
      </div>
    </div>
  )
}
```

### Email Invoice with QR

```typescript
// src/lib/notifications/sendInvoiceEmail.ts

export async function sendInvoiceEmail(
  invoiceId: string,
  customerEmail: string,
  qrImageUrl: string
) {
  const emailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background-color: #2563eb; color: white; padding: 20px; }
        .content { padding: 20px; }
        .qr-section { text-align: center; margin: 30px 0; }
        .qr-image { max-width: 300px; }
        .footer { background-color: #f3f4f6; padding: 20px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Payment Invoice - Fixify</h1>
        </div>
        
        <div class="content">
          <p>Dear Customer,</p>
          <p>Your service has been completed. Please find your invoice and payment details below.</p>
          
          <div class="qr-section">
            <h3>Pay via QR Code</h3>
            <img src="${qrImageUrl}" alt="Payment QR Code" class="qr-image" />
            <p style="margin-top: 10px; font-size: 14px;">
              Open your UPI app and scan this code to pay instantly
            </p>
          </div>
          
          <hr />
          
          <p>If you have any questions, please contact our support team.</p>
        </div>
        
        <div class="footer">
          <p>&copy; 2026 Fixify. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  // Send via email service (SendGrid, etc.)
  await emailService.send({
    to: customerEmail,
    subject: `Your Fixify Invoice #${invoiceId}`,
    html: emailHTML,
  })
}
```

---

## Webhook Handling

### QR Code Payment Webhook

```typescript
// src/lib/payments/handleQRPaymentWebhook.ts

export async function handleQRCodePayment(
  razorpayPayment: any,
  razorpayQRCode: string
) {
  try {
    // 1. Find invoice by QR code
    const { data: qrRecord } = await supabaseServer
      .from('upi_qr_codes')
      .select('invoice_id')
      .eq('razorpay_qr_id', razorpayQRCode)
      .single()

    if (!qrRecord) {
      throw new Error('QR code not found')
    }

    // 2. Update invoice status
    const { error: updateError } = await supabaseServer
      .from('invoices')
      .update({
        status: 'paid',
        paid_at: new Date(),
        razorpay_payment_id: razorpayPayment.id,
      })
      .eq('id', qrRecord.invoice_id)

    if (updateError) {
      throw updateError
    }

    // 3. Deactivate QR code
    await deactivateInvoiceQR(razorpay, supabaseServer, razorpayQRCode)

    // 4. Send payment confirmation
    await sendPaymentConfirmationEmail(qrRecord.invoice_id)

    // 5. Create audit log
    await supabaseServer.from('audit_logs').insert({
      action: 'qr_payment_received',
      entity_type: 'invoice',
      entity_id: qrRecord.invoice_id,
      metadata: {
        qr_code_id: razorpayQRCode,
        payment_id: razorpayPayment.id,
        amount: razorpayPayment.amount,
      },
    })

    return { success: true }
  } catch (error) {
    console.error('QR payment webhook error:', error)
    throw error
  }
}
```

---

## Use Cases

### 1. Invoice Email

```
┌─────────────────────────────────────┐
│ Invoice #INV-2026-001234            │
│ Job: Plumbing Repair                │
│ Amount: ₹5,000                      │
├─────────────────────────────────────┤
│  [QR CODE IMAGE 250x250]            │
│                                     │
│  Pay instantly with any UPI app     │
├─────────────────────────────────────┤
│ Due: October 10, 2026               │
└─────────────────────────────────────┘
```

### 2. SMS Notification

```
Fixify: Your invoice INV-001234 for ₹5,000 is ready.
Pay now via UPI: https://qr.razorpay.com/upi/...
```

### 3. Property Receipt

```
After completion, generate receipt with:
- Invoice details
- Service performed
- QR code for future reference
- Payment confirmation
```

### 4. Marketing Materials

```
Fixify - Pay Now via UPI
[Static QR Code - Merchant VPA]
Scan and enter amount
```

---

## Security & Compliance

### QR Code Expiration

```typescript
// src/lib/payments/qrExpiration.ts

/**
 * Close expired QR codes (30 days for dynamic, keep static active)
 */
export async function closeExpiredQRCodes() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const { data: expiredQRs } = await supabaseServer
    .from('upi_qr_codes')
    .select('razorpay_qr_id')
    .eq('type', 'dynamic')
    .eq('status', 'active')
    .lt('created_at', thirtyDaysAgo)

  for (const qr of expiredQRs || []) {
    try {
      await razorpay.qrCode.close(qr.razorpay_qr_id)
      await supabaseServer
        .from('upi_qr_codes')
        .update({ status: 'expired' })
        .eq('razorpay_qr_id', qr.razorpay_qr_id)
    } catch (error) {
      console.error(`Failed to close QR ${qr.razorpay_qr_id}:`, error)
    }
  }
}
```

### Database Schema

```sql
-- UPI QR Codes table
CREATE TABLE upi_qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- QR metadata
  type TEXT CHECK(type IN ('static', 'dynamic')), -- static or dynamic
  razorpay_qr_id TEXT NOT NULL UNIQUE,
  image_url TEXT NOT NULL,
  upi_link TEXT NOT NULL,
  
  -- Links to other entities
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  merchant_id TEXT, -- For static QRs
  
  -- Payment tracking
  amount INT, -- in paise (NULL for static)
  description TEXT,
  status TEXT DEFAULT 'active', -- active, closed, expired, paid
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP,
  paid_at TIMESTAMP,
  
  -- Indexes
  CONSTRAINT qr_dynamic_needs_invoice 
    CHECK((type = 'static') OR (type = 'dynamic' AND invoice_id IS NOT NULL))
);

-- Enable RLS
ALTER TABLE upi_qr_codes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY qr_customer_read ON upi_qr_codes
  FOR SELECT
  USING (
    invoice_id IN (
      SELECT id FROM invoices 
      WHERE customer_id = auth.uid()
    )
    OR merchant_id IS NOT NULL -- Allow merchants to read their static QR
  );

-- Indexes
CREATE INDEX idx_upi_qr_razorpay_id ON upi_qr_codes(razorpay_qr_id);
CREATE INDEX idx_upi_qr_invoice_id ON upi_qr_codes(invoice_id);
CREATE INDEX idx_upi_qr_status ON upi_qr_codes(status);
```

### Privacy & Security

- **Never log QR code data** in debug logs
- **Verify QR ownership** before returning to user
- **Mask sensitive fields** in customer responses
- **Rotate static QR codes** if compromised
- **Track QR usage** for fraud detection

---

## Next Steps

1. **Database migration** for `upi_qr_codes` table
2. **Implement dynamic QR generation** for invoices
3. **Create email templates** with embedded QRs
4. **Test QR payment flow** end-to-end
5. **Monitor QR success rates** via analytics
6. **Add QR code download** functionality
7. **Implement QR expiration** background job

---

**Document Version**: 1.0  
**Last Updated**: October 1, 2026  
**Status**: Ready for implementation
