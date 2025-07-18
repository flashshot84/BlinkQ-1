// src/components/RazorpayPayment.tsx
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL!,
  process.env.REACT_APP_SUPABASE_ANON_KEY!
);

declare global {
  interface Window {
    Razorpay: any;
  }
}

const RazorpayPayment: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpayScript = () => {
      if (window.Razorpay) {
        setRazorpayLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => setRazorpayLoaded(true);
      script.onerror = () => console.error('Failed to load Razorpay script');
      document.body.appendChild(script);
    };

    loadRazorpayScript();
  }, []);

  const handlePayment = async () => {
    if (!amount || !razorpayLoaded) {
      toast.error('Please enter amount and wait for Razorpay to load');
      return;
    }

    setLoading(true);

    try {
      // Call your Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: {
          amount: parseFloat(amount) * 100, // Convert to paise
          currency: 'INR',
          receipt_id: `receipt_${Date.now()}`,
          user_email: 'customer@example.com',
          user_full_name: 'Customer Name',
          phone_number: '9876543210',
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error);
      }

      // Configure Razorpay checkout
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID!,
        amount: data.amount,
        currency: data.currency,
        name: 'Your Company Name',
        description: 'Payment for Product/Service',
        order_id: data.orderId,
        handler: async function (response: any) {
          try {
            console.log('Payment successful:', response);
            
            // Update your database with payment details
            const { error: updateError } = await supabase
              .from('payments')
              .insert({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                amount: data.amount,
                status: 'completed',
              });

            if (updateError) {
              console.error('Error updating payment:', updateError);
            }

            toast.success('Payment successful!');
          } catch (error) {
            console.error('Payment processing error:', error);
            toast.error('Payment succeeded but confirmation failed');
          }
        },
        prefill: {
          name: 'Customer Name',
          email: 'customer@example.com',
          contact: '9876543210',
        },
        theme: {
          color: '#3B82F6',
        },
        modal: {
          ondismiss: function() {
            toast.error('Payment cancelled');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        toast.error(`Payment failed: ${response.error.description}`);
      });

      rzp.open();

    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment initialization failed');
    } finally {
      setLoading(false);
    }
  };

  // ✅ THIS IS THE MISSING PART - RETURN JSX
  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Razorpay Payment</h2>
      
      <div className="mb-4">
        <input
          type="number"
          placeholder="Enter Amount (₹)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-3 border rounded-lg"
        />
      </div>

      <button
        onClick={handlePayment}
        disabled={loading || !razorpayLoaded}
        className="w-full bg-blue-500 text-white py-3 rounded-lg disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Pay with Razorpay'}
      </button>
    </div>
  );
};

export default RazorpayPayment;
