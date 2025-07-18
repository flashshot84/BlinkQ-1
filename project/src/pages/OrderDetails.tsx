import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Truck, CheckCircle, Download, MapPin, CreditCard, X } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import { formatDate, formatPrice } from '../lib/utils';
import toast from 'react-hot-toast';

export function OrderDetails() {
  const { id } = useParams();
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancellingOrder, setCancellingOrder] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (id) {
      fetchOrderDetails();
    }
  }, [id, user, navigate]);

  const fetchOrderDetails = async () => {
    if (!supabase || !user || !id) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*)
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching order:', error);
        toast.error('Order not found');
        navigate('/orders');
        return;
      }

      setOrder(data);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to load order details');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async () => {
    if (!supabase || !user || !order) {
      toast.error('Unable to cancel order. Please try again.');
      return;
    }

    if (!confirm(`Are you sure you want to cancel order #${order.order_number}?`)) {
      return;
    }

    setCancellingOrder(true);

    try {
      // Re-fetch current order status from database
      const { data: currentOrderData, error: fetchError } = await supabase
        .from('orders')
        .select('status')
        .eq('id', order.id)
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        console.error('Error fetching current order status:', fetchError);
        throw new Error('Failed to verify order status');
      }

      // Check if order can still be cancelled based on current database status
      if (!['pending', 'confirmed', 'processing'].includes(currentOrderData.status)) {
        const statusMessage = currentOrderData.status === 'cancelled' 
          ? 'This order has already been cancelled'
          : `This order cannot be cancelled as it is currently ${currentOrderData.status}`;
        
        toast.error(statusMessage);
        
        // Update local state with current database status
        setOrder(prev => prev ? { ...prev, status: currentOrderData.status } : null);
        return;
      }

      // Update order status in database
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', order.id)
        .eq('user_id', user.id)
        .select();

      if (error) {
        console.error('Database error:', error);
        throw new Error('Failed to update order status');
      }

      if (!data || data.length === 0) {
        throw new Error('Order not found or you do not have permission to cancel this order');
      }

      // Update local state with the returned data
      setOrder(data[0]);
      
      toast.success('Order cancelled successfully');

    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Failed to cancel order. Please try again.');
    } finally {
      setCancellingOrder(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'confirmed':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'shipped':
        return <Truck className="w-5 h-5 text-blue-500" />;
      case 'processing':
        return <Package className="w-5 h-5 text-yellow-500" />;
      case 'cancelled':
        return <X className="w-5 h-5 text-red-500" />;
      default:
        return <Package className="w-5 h-5 text-gray-500" />;
    }
  };

  const canCancelOrder = (status: string) => {
    return ['pending', 'confirmed', 'processing'].includes(status);
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-8"></div>
            <div className="space-y-6">
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Order Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The order you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Link to="/orders">
              <Button>Back to Orders</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link
            to="/orders"
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mr-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Orders
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Order #{order.order_number}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Placed on {formatDate(order.created_at)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Order Status
                </h2>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(order.status)}
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Order Placed</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                </div>

                {order.status === 'cancelled' && order.cancelled_at && (
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <X className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Order Cancelled</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(order.cancelled_at)}
                      </p>
                    </div>
                  </div>
                )}

                {order.status !== 'pending' && order.status !== 'cancelled' && (
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Order Confirmed</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Your order has been confirmed
                      </p>
                    </div>
                  </div>
                )}

                {order.shipped_at && (
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Truck className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Order Shipped</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(order.shipped_at)}
                      </p>
                    </div>
                  </div>
                )}

                {order.delivered_at && (
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Order Delivered</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(order.delivered_at)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Order Items */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Order Items ({order.order_items?.length || 0} items)
              </h2>
              
              <div className="space-y-4">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <img
                      src={item.product_image || '/placeholder-product.jpg'}
                      alt={item.product_name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {item.product_name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        SKU: {item.product_sku}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatPrice(item.total_price)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatPrice(item.unit_price)} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Shipping Address */}
            {order.shipping_address && (
              <Card className="p-6">
                <div className="flex items-center mb-4">
                  <MapPin className="w-5 h-5 text-blue-500 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Shipping Address
                  </h2>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {order.shipping_address.first_name} {order.shipping_address.last_name}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    {order.shipping_address.address_line_1}
                  </p>
                  {order.shipping_address.address_line_2 && (
                    <p className="text-gray-600 dark:text-gray-400">
                      {order.shipping_address.address_line_2}
                    </p>
                  )}
                  <p className="text-gray-600 dark:text-gray-400">
                    {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Phone: {order.shipping_address.phone}
                  </p>
                </div>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            {/* Payment & Order Info */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Order Summary
              </h2>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Order Number:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    #{order.order_number}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Payment Method:</span>
                  <span className="font-medium text-gray-900 dark:text-white uppercase">
                    {order.payment_method}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Payment Status:</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                    {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                  </span>
                </div>

                {order.coupon_code && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Coupon Used:</span>
                    <span className="font-medium text-green-600">
                      {order.coupon_code}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* Price Breakdown */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Price Details
              </h2>
              
              <div className="space-y-3">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal:</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Shipping:</span>
                  <span>
                    {order.shipping_amount === 0 ? 'FREE' : formatPrice(order.shipping_amount)}
                  </span>
                </div>
                
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Tax:</span>
                  <span>{formatPrice(order.tax_amount)}</span>
                </div>

                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-{formatPrice(order.discount_amount)}</span>
                  </div>
                )}
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                    <span>Total:</span>
                    <span>{formatPrice(order.total_amount)}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Actions */}
            <Card className="p-6">
              <div className="space-y-3">
                {canCancelOrder(order.status) && (
                  <Button 
                    variant="outline" 
                    className="w-full text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                    onClick={cancelOrder}
                    disabled={cancellingOrder}
                  >
                    <X className="w-4 h-4 mr-2" />
                    {cancellingOrder ? 'Cancelling Order...' : 'Cancel Order'}
                  </Button>
                )}
                
                {order.status === 'delivered' && (
                  <Button className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Download Invoice
                  </Button>
                )}
                
                {order.status === 'delivered' && (
                  <Button variant="outline" className="w-full">
                    Return/Exchange
                  </Button>
                )}

                <Button variant="outline" className="w-full">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Reorder Items
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}