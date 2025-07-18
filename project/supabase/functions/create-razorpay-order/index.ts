// supabase/functions/create-razorpay-order/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.0';

// --- Environment Variables (Secrets) ---
const RAZORPAY_KEY_ID = Deno.env.get('rzp_test_p2fWIx51hjOu7N');
const RAZORPAY_KEY_SECRET = Deno.env.get('fcxeXbAG1Y9p7rovA1ETOOiE');
const SUPABASE_URL = Deno.env.get('https://htdpenrntnnvwodjbolk.supabase.co');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0ZHBlbnJudG5udndvZGpib2xrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQ4ODI0MiwiZXhwIjoyMDY4MDY0MjQyfQ.nlD7JiJhTcZxpzIYCpCLMG_XkeSMKQRgVF-n4JRoEzY');


serve(async (req) => {
  // Initialize Supabase client
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase URL or Service Role Key are not set as environment variables.');
      return new Response(JSON.stringify({ error: 'Server configuration error: Supabase keys missing.' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 500,
      });
  }
  const supabaseClient = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
  );

  // --- Handle CORS Preflight Request (IMPORTANT for cross-origin POST/PUT/DELETE) ---
  // Browsers send an OPTIONS request before the actual POST request for CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204, // No Content
      headers: {
        'Access-Control-Allow-Origin': '*', // IMPORTANT: In production, change '*' to your frontend's specific origin (e.g., 'http://localhost:5174' or 'https://yourdomain.com')
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
      },
    });
  }

  // --- Main Logic for POST Request ---
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Always add for successful responses
      },
      status: 405,
    });
  }

  try {
    const { amount, currency, receipt_id, order_id, user_email, user_full_name, phone_number } = await req.json();

    // Input Validation
    if (!amount || !currency || !receipt_id || !order_id) {
      return new Response(JSON.stringify({ error: 'Missing required parameters (amount, currency, receipt_id, order_id)' }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        status: 400,
      });
    }
    if (typeof amount !== 'number' || amount <= 0) {
        return new Response(JSON.stringify({ error: 'Invalid amount provided' }), {
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            status: 400,
        });
    }
    if (currency !== 'INR') {
        return new Response(JSON.stringify({ error: 'Unsupported currency' }), {
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            status: 400,
        });
    }

    // Razorpay API Key Validation
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      console.error('Razorpay API keys are not set as environment variables.');
      return new Response(JSON.stringify({ error: 'Server configuration error: Razorpay keys missing.' }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        status: 500,
      });
    }

    // Call Razorpay API to Create Order
    const razorpayOrderApiUrl = 'https://api.razorpay.com/v1/orders';
    const authHeader = `Basic ${btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)}`;

    const razorpayResponse = await fetch(razorpayOrderApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({
        amount: amount,
        currency: currency,
        receipt: receipt_id,
        notes: {
          supabase_order_id: order_id,
          user_email: user_email || 'N/A',
          user_full_name: user_full_name || 'N/A',
          phone_number: phone_number || 'N/A',
        },
      }),
    });

    const razorpayData = await razorpayResponse.json();

    if (!razorpayResponse.ok) {
      console.error('Razorpay API Error Response:', razorpayResponse.status, razorpayData);
      return new Response(JSON.stringify({ error: razorpayData.error?.description || 'Failed to create Razorpay order' }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        status: razorpayResponse.status,
      });
    }

    // Update Supabase Order with Razorpay Order ID (Optional but Recommended)
    const { error: updateOrderError } = await supabaseClient
      .from('orders')
      .update({ razorpay_order_id: razorpayData.id })
      .eq('id', order_id);

    if (updateOrderError) {
      console.error('Error updating Supabase order with Razorpay Order ID:', updateOrderError);
    }

    // Return Razorpay Order Details to Frontend
    return new Response(JSON.stringify({
      orderId: razorpayData.id,
      amount: razorpayData.amount,
      currency: razorpayData.currency,
      receipt: razorpayData.receipt,
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Always include this header
      },
      status: 200,
    });

  } catch (error) {
    console.error('Edge Function Execution Error:', error.message);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      status: 500,
    });
  }
});