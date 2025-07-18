import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Eye, Download, RefreshCw } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import { formatDate } from '../lib/utils';
import toast from 'react-hot-toast';

export function Orders() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user, filter]);

  // Refresh orders when component mounts or becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        fetchOrders();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);
  const fetchOrders = async () => {
    if (!supabase || !user) return;

    try {
      setLoading(true);
      
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Don't show error to user, just log it
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
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

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Orders
          </h1>
          <Button onClick={fetchOrders} variant="outline">
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
          {[
            { key: 'all', label: 'All Orders' },
            { key: 'pending', label: 'Pending' },
            { key: 'processing', label: 'Processing' },
            { key: 'shipped', label: 'Shipped' },
            { key: 'delivered', label: 'Delivered' },
            { key: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-6">
                <div className="animate-pulse">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                    </div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  </div>
                  <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                  <div className="mb-4 lg:mb-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Order #{order.order_number}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Placed on {formatDate(order.created_at)}
                    </p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                        Payment: {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      ₹{order.total_amount.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {order.payment_method.toUpperCase()}
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-3 mb-6">
                  {order.order_items?.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {item.product_name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          SKU: {item.product_sku}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900 dark:text-white">
                          ₹{item.total_price.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          ₹{item.unit_price.toLocaleString()} each
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Subtotal</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        ₹{order.subtotal.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Shipping</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {order.shipping_amount === 0 ? 'FREE' : `₹${order.shipping_amount}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Tax</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        ₹{order.tax_amount.toLocaleString()}
                      </p>
                    </div>
                    {order.discount_amount > 0 && (
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Discount</p>
                        <p className="font-medium text-green-600">
                          -₹{order.discount_amount.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 mt-6">
                  <Link to={`/order/${order.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye size={16} className="mr-2" />
                      View Details
                    </Button>
                  </Link>
                  
                  {order.status === 'delivered' && (
                    <Button variant="outline" size="sm">
                      <Download size={16} className="mr-2" />
                      Download Invoice
                    </Button>
                  )}
                  
                  {order.status === 'delivered' && (
                    <Button variant="outline" size="sm">
                      Return/Exchange
                    </Button>
                  )}
                </div>

                {/* Shipping Address */}
                {order.shipping_address && (
                  <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Shipping Address
                    </h4>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p>First name = {order.shipping_address.first_name}, Last name = {order.shipping_address.last_name}</p>
                      <p>Address line 1 = {order.shipping_address.address_line_1}</p>
                      {order.shipping_address.address_line_2 && (
                        <p>Address line 2 = {order.shipping_address.address_line_2}</p>
                      )}
                      <p>
                        City = {order.shipping_address.city}, State = {order.shipping_address.state}, Postal code = {order.shipping_address.postal_code}
                      </p>
                      <p>Phone = {order.shipping_address.phone}</p>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No orders found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {filter === 'all' 
                ? "You haven't placed any orders yet."
                : `No orders with status "${filter}" found.`
              }
            </p>
            <Link to="/products">
              <Button>Start Shopping</Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}