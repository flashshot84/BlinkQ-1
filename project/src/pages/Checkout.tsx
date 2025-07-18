import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreditCard, MapPin, Package, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuthContext } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

// Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

const addressSchema = z.object({
  first_name: z.string().min(2, 'First name is required'),
  last_name: z.string().min(2, 'Last name is required'),
  address_line_1: z.string().min(5, 'Address is required'),
  address_line_2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  postal_code: z.string().min(6, 'Valid postal code is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
});

type AddressForm = z.infer<typeof addressSchema>;

export function Checkout() {
  const { cart, clearCart } = useCart();
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [razorpayError, setRazorpayError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
  });

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpayScript = async () => {
      if (window.Razorpay) {
        setRazorpayLoaded(true);
        return;
      }

      try {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        
        const loadPromise = new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });

        document.body.appendChild(script);
        await loadPromise;
        
        setRazorpayLoaded(true);
        setRazorpayError(null);
      } catch (error) {
        console.error('Failed to load Razorpay script:', error);
        setRazorpayError('Failed to load payment gateway. Please refresh the page.');
      }
    };

    loadRazorpayScript();
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (cart.items.length === 0) {
      navigate('/cart');
      return;
    }

    if (!supabase) {
      toast.error('Database connection unavailable. Please refresh the page.');
      return;
    }

    fetchAddresses();
  }, [user, cart.items.length, navigate]);

  const fetchAddresses = async () => {
    if (!supabase || !user) return;

    try {
      setAddressLoading(true);
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (error) throw error;
      
      setAddresses(data || []);
      
      if (data && data.length > 0) {
        setSelectedAddress(data.find(addr => addr.is_default) || data[0]);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast.error('Failed to fetch addresses');
    } finally {
      setAddressLoading(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setAppliedCoupon(null);
    setDiscount(0);
    toast.success('Coupon removed');
  };

  const applyCoupon = async () => {
    if (!couponCode.trim() || !supabase) {
      if (!supabase) {
        toast.error('Database connection unavailable');
      }
      return;
    }

    setCouponLoading(true);

    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching coupon:', error);
        toast.error('Failed to validate coupon');
        return;
      }

      if (!data) {
        toast.error('Invalid coupon code');
        return;
      }

      // Check if coupon is valid
      const now = new Date();
      if (data.starts_at && new Date(data.starts_at) > now) {
        toast.error('Coupon not yet active');
        return;
      }

      if (data.expires_at && new Date(data.expires_at) < now) {
        toast.error('Coupon has expired');
        return;
      }

      if (data.minimum_amount && cart.total < data.minimum_amount) {
        toast.error(`Minimum order amount ₹${data.minimum_amount} required`);
        return;
      }

      if (data.usage_limit && data.used_count >= data.usage_limit) {
        toast.error('Coupon usage limit exceeded');
        return;
      }

      // Calculate discount
      let discountAmount = 0;
      if (data.type === 'percentage') {
        discountAmount = (cart.total * data.value) / 100;
        if (data.maximum_discount) {
          discountAmount = Math.min(discountAmount, data.maximum_discount);
        }
      } else {
        discountAmount = data.value;
      }

      setDiscount(discountAmount);
      setAppliedCoupon(couponCode.toUpperCase());
      toast.success(`Coupon applied! You saved ₹${discountAmount.toLocaleString()}`);
    } catch (error) {
      console.error('Error applying coupon:', error);
      toast.error('Failed to apply coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const saveAddress = async (data: AddressForm) => {
    if (!supabase || !user) {
      toast.error('Unable to save address. Please try again.');
      return null;
    }

    try {
      const { data: newAddress, error } = await supabase
        .from('addresses')
        .insert({
          user_id: user.id,
          ...data,
          is_default: addresses.length === 0,
        })
        .select()
        .single();

      if (error) throw error;
      
      setAddresses(prev => [...prev, newAddress]);
      setSelectedAddress(newAddress);
      setShowNewAddress(false);
      reset();
      toast.success('Address saved successfully');
      
      return newAddress;
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save address');
      return null;
    }
  };

  const createOrder = async (shippingAddress: any) => {
    if (!supabase || !user) {
      throw new Error('Unable to create order. Please try again.');
    }

    const subtotal = cart.total;
    const shippingAmount = subtotal > 499 ? 0 : 49;
    const taxAmount = Math.round(subtotal * 0.18);
    const totalAmount = subtotal + shippingAmount + taxAmount - discount;

    try {
      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          order_number: `ORD-${Date.now()}`,
          subtotal,
          shipping_amount: shippingAmount,
          tax_amount: taxAmount,
          discount_amount: discount,
          total_amount: totalAmount,
          payment_method: paymentMethod,
          shipping_address: shippingAddress,
          coupon_code: appliedCoupon || null,
          payment_status: 'pending',
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      // Create order items
      const orderItems = cart.items.map(item => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        product_sku: `SKU-${item.id}`,
        product_image: item.image_url,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  const handleRazorpayPayment = async (order: any, shippingAddress: any) => {
    if (!razorpayLoaded) {
      toast.error('Payment gateway not loaded. Please try again.');
      return;
    }

    if (razorpayError) {
      toast.error(razorpayError);
      return;
    }

    if (!supabase) {
      toast.error('Database connection unavailable. Please refresh the page.');
      return;
    }

    try {
      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: {
          amount: order.total_amount * 100,
          currency: 'INR',
          receipt_id: order.id,
          order_id: order.id,
          user_email: user?.email,
          user_full_name: user?.user_metadata?.full_name || user?.email,
          phone_number: shippingAddress?.phone,
        },
      });

      if (error) {
        console.error('Edge Function Error:', error);
        throw new Error(error.message || 'Failed to create Razorpay order');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Failed to create Razorpay order');
      }

      const options = {
        // ✅ Fixed: Use import.meta.env instead of process.env
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_p2fWIx51hjOu7N',
        amount: data.amount,
        currency: data.currency,
        name: 'BlinkQ Store',
        description: `Order #${order.order_number}`,
        order_id: data.orderId,
        handler: async function (response: any) {
          try {
            if (!response.razorpay_payment_id) {
              throw new Error('Payment ID not received');
            }

            if (!supabase) {
              throw new Error('Database connection unavailable');
            }

            const { error: updateError } = await supabase
              .from('orders')
              .update({
                payment_status: 'paid',
                status: 'confirmed',
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
              })
              .eq('id', order.id);

            if (updateError) throw updateError;

            toast.success('Payment successful!');
            clearCart();
            navigate(`/order-confirmation/${order.id}`);
          } catch (error) {
            console.error('Error updating payment status:', error);
            toast.error('Payment succeeded, but confirmation failed. Please contact support.');
          }
        },
        prefill: {
          name: user?.user_metadata?.full_name || user?.email || '',
          email: user?.email || '',
          contact: shippingAddress?.phone || '',
        },
        theme: {
          color: '#3B82F6',
        },
        modal: {
          ondismiss: function() {
            toast.error('Payment cancelled');
            setLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', async function (response: any) {
        try {
          if (supabase) {
            await supabase
              .from('orders')
              .update({ 
                payment_status: 'failed',
                status: 'failed',
                razorpay_order_id: response.error.metadata?.order_id 
              })
              .eq('id', order.id);
          }
        } catch (error) {
          console.error('Error updating failed payment status:', error);
        }

        toast.error(`Payment failed: ${response.error.description}`);
        setLoading(false);
      });

      rzp.open();
    } catch (error) {
      console.error('Error in Razorpay payment:', error);
      toast.error('Payment initialization failed. Please try again.');
      setLoading(false);
    }
  };

  const handlePlaceOrder = async (addressData?: AddressForm) => {
    if (loading) return;
    
    if (!supabase) {
      toast.error('Database connection unavailable. Please refresh the page.');
      return;
    }

    if (paymentMethod === 'razorpay' && !razorpayLoaded) {
      toast.error('Payment gateway not loaded. Please try again.');
      return;
    }
    
    setLoading(true);

    try {
      let shippingAddress = selectedAddress;

      // Save new address if provided
      if (addressData) {
        shippingAddress = await saveAddress(addressData);
        if (!shippingAddress) {
          setLoading(false);
          return;
        }
      }

      // Validate shipping address
      if (!shippingAddress) {
        toast.error('Please select a shipping address');
        setLoading(false);
        return;
      }

      // Create order
      const order = await createOrder(shippingAddress);

      // Handle payment method
      if (paymentMethod === 'cod') {
        // For COD, order is already created with pending status
        await supabase
          .from('orders')
          .update({ status: 'confirmed' })
          .eq('id', order.id);

        clearCart();
        toast.success('Order placed successfully!');
        navigate(`/order-confirmation/${order.id}`);
        setLoading(false);
      } else {
        // Handle Razorpay payment - loading will be handled in payment callbacks
        await handleRazorpayPayment(order, shippingAddress);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order. Please try again.');
      setLoading(false);
    }
  };

  // Early returns for invalid states
  if (!user || cart.items.length === 0) {
    return null;
  }

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Database connection unavailable
          </p>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  const subtotal = cart.total;
  const shippingAmount = subtotal > 499 ? 0 : 49;
  const taxAmount = Math.round(subtotal * 0.18);
  const totalAmount = subtotal + shippingAmount + taxAmount - discount;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate('/cart')}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mr-4 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Cart
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Checkout
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address */}
            <Card className="p-6">
              <div className="flex items-center mb-4">
                <MapPin className="w-5 h-5 text-blue-500 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Shipping Address
                </h2>
              </div>

              {addressLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : addresses.length > 0 && !showNewAddress ? (
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedAddress?.id === address.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-200'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                      onClick={() => setSelectedAddress(address)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {address.first_name} {address.last_name}
                          </p>
                          <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {address.address_line_1}
                          </p>
                          {address.address_line_2 && (
                            <p className="text-gray-600 dark:text-gray-400">
                              {address.address_line_2}
                            </p>
                          )}
                          <p className="text-gray-600 dark:text-gray-400">
                            {address.city}, {address.state} {address.postal_code}
                          </p>
                          <p className="text-gray-600 dark:text-gray-400">
                            {address.phone}
                          </p>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          {address.is_default && (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                              Default
                            </span>
                          )}
                          {selectedAddress?.id === address.id && (
                            <CheckCircle className="w-5 h-5 text-blue-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    variant="outline"
                    onClick={() => setShowNewAddress(true)}
                    className="w-full"
                  >
                    Add New Address
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      {...register('first_name')}
                      error={errors.first_name?.message}
                    />
                    <Input
                      label="Last Name"
                      {...register('last_name')}
                      error={errors.last_name?.message}
                    />
                  </div>
                  
                  <Input
                    label="Address Line 1"
                    {...register('address_line_1')}
                    error={errors.address_line_1?.message}
                  />
                  
                  <Input
                    label="Address Line 2 (Optional)"
                    {...register('address_line_2')}
                    error={errors.address_line_2?.message}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="City"
                      {...register('city')}
                      error={errors.city?.message}
                    />
                    <Input
                      label="State"
                      {...register('state')}
                      error={errors.state?.message}
                    />
                    <Input
                      label="Postal Code"
                      {...register('postal_code')}
                      error={errors.postal_code?.message}
                    />
                  </div>
                  
                  <Input
                    label="Phone Number"
                    {...register('phone')}
                    error={errors.phone?.message}
                  />

                  {addresses.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowNewAddress(false)}
                    >
                      Use Existing Address
                    </Button>
                  )}
                </div>
              )}
            </Card>

            {/* Payment Method */}
            <Card className="p-6">
              <div className="flex items-center mb-4">
                <CreditCard className="w-5 h-5 text-blue-500 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Payment Method
                </h2>
              </div>

              <div className="space-y-3">
                <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                  paymentMethod === 'razorpay'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="razorpay"
                    checked={paymentMethod === 'razorpay'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 dark:text-white">
                        Online Payment (Razorpay)
                      </p>
                      {razorpayLoaded && <CheckCircle className="w-5 h-5 text-green-500" />}
                      {razorpayError && <AlertCircle className="w-5 h-5 text-red-500" />}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Pay securely with credit/debit card, UPI, or net banking
                    </p>
                    {razorpayError && (
                      <p className="text-sm text-red-600 mt-1">{razorpayError}</p>
                    )}
                  </div>
                </label>

                <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                  paymentMethod === 'cod'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-3"
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Cash on Delivery
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Pay when your order is delivered
                    </p>
                  </div>
                </label>
              </div>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="p-6 sticky top-4">
              <div className="flex items-center mb-4">
                <Package className="w-5 h-5 text-blue-500 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Order Summary
                </h2>
              </div>

              {/* Order Items */}
              <div className="space-y-3 mb-6">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {item.name}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Coupon Code */}
              <div className="mb-6">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-green-800 dark:text-green-400">
                        {appliedCoupon} applied
                      </span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-sm text-red-600 hover:text-red-800 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      onClick={applyCoupon} 
                      variant="outline"
                      loading={couponLoading}
                      disabled={!couponCode.trim() || couponLoading}
                    >
                      Apply
                    </Button>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal ({cart.items.length} items)</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Shipping</span>
                  <span>{shippingAmount === 0 ? 'FREE' : `₹${shippingAmount}`}</span>
                </div>
                
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Tax (18%)</span>
                  <span>₹{taxAmount.toLocaleString()}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-₹{discount.toLocaleString()}</span>
                  </div>
                )}
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                    <span>Total</span>
                    <span>₹{totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={showNewAddress ? handleSubmit(handlePlaceOrder) : () => handlePlaceOrder()}
                className="w-full mt-6"
                size="lg"
                loading={loading}
                disabled={loading || (!selectedAddress && !showNewAddress) || (paymentMethod === 'razorpay' && !razorpayLoaded)}
              >
                {loading ? 'Processing...' : 'Place Order'}
              </Button>

              {subtotal < 499 && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    💡 Add ₹{(499 - subtotal).toLocaleString()} more to get free shipping!
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
