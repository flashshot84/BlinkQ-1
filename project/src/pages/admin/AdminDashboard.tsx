import { useState, useEffect } from 'react';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  XCircle
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { formatPrice } from '../../lib/utils';
import React from 'react';

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  recentOrders: any[];
  topProducts: any[];
  userGrowth: number;
  revenueGrowth: number;
  cancelledOrders: number;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    recentOrders: [],
    topProducts: [],
    userGrowth: 0,
    revenueGrowth: 0,
    cancelledOrders: 0, // Ensure cancelledOrders is initialized
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    if (!supabase) return;

    try {
      setLoading(true);

      // Fetch total users
      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Fetch total products
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      // Fetch total orders and revenue
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('total_amount, created_at, status, payment_status');

      if (ordersError) throw ordersError;

      const totalOrders = orders?.length || 0;
      const paidOrders = orders?.filter(order => order.payment_status === 'paid') || [];
      const totalRevenue = paidOrders.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      
      // Calculate cancelled orders count
      const cancelledOrders = orders?.filter(order => order.status === 'cancelled').length || 0;

      // Fetch recent orders
      const { data: recentOrders, error: recentOrdersError } = await supabase
        .from('orders')
        .select(`
          id, order_number, total_amount, status,
          users(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentOrdersError) throw recentOrdersError;

      // Fetch top products
      const { data: topProducts, error: topProductsError } = await supabase
        .from('products')
        .select('name, price, rating, reviews_count')
        .order('reviews_count', { ascending: false })
        .limit(5);
      
      if (topProductsError) throw topProductsError;

      // Calculate growth (mock data - replace with actual logic if available)
      const userGrowth = 12.5; // Example value
      const revenueGrowth = 8.3; // Example value

      setStats({
        totalUsers: usersCount || 0,
        totalProducts: productsCount || 0,
        totalOrders,
        totalRevenue,
        recentOrders: recentOrders || [],
        topProducts: topProducts || [],
        userGrowth,
        revenueGrowth,
        cancelledOrders,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Optionally, set stats to default or error state to inform user
      setStats({
        totalUsers: 0, totalProducts: 0, totalOrders: 0, totalRevenue: 0,
        recentOrders: [], topProducts: [], userGrowth: 0, revenueGrowth: 0, cancelledOrders: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900', // Added dark mode color
      growth: stats.userGrowth,
    },
    {
      title: 'Total Products',
      value: stats.totalProducts.toLocaleString(),
      icon: Package,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders.toLocaleString(),
      icon: ShoppingCart,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
    },
    {
      title: 'Total Revenue',
      value: formatPrice(stats.totalRevenue),
      icon: DollarSign,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900',
      growth: stats.revenueGrowth,
    },
    {
      title: 'Cancelled Orders',
      value: stats.cancelledOrders.toLocaleString(), // Ensure it's never null for toLocaleString
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900',
    },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6"> {/* Added mb-6 for consistent spacing */}
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard Overview
        </h1>
        <Button onClick={fetchDashboardStats} className="flex items-center"> {/* Ensured button is flex for icon */}
          {/* Calendar icon removed, as it wasn't in original image context, use if needed */}
          Refresh Data
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8"> {/* Added mb-8 */}
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const growthColorClass = stat.growth && stat.growth > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
          const growthIcon = stat.growth && stat.growth > 0 ? TrendingUp : TrendingDown;

          return (
            <Card 
              key={stat.title} 
              className="p-4 lg:p-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200 ease-in-out"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400"> {/* Changed text-gray-600 to text-gray-500 for softer look */}
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1"> {/* Added mt-1 for slight spacing */}
                    {stat.value}
                  </p>
                  {stat.growth !== undefined && ( // Check for undefined to include 0% growth explicitly
                    <div className="flex items-center mt-2">
                      {React.createElement(growthIcon, { className: `w-4 h-4 ${growthColorClass} mr-1` })}
                      <span className={`text-sm ${growthColorClass}`}>
                        {Math.abs(stat.growth)}%
                      </span>
                    </div>
                  )}
                </div>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${stat.bgColor}`}> {/* Made icon background larger: w-10 h-10 */}
                  <Icon className={`w-5 h-5 ${stat.color}`} /> {/* Icon size adjusted to w-5 h-5 for balance */}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="p-4 lg:p-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Recent Orders
          </h2>
          <div className="space-y-4 divide-y divide-gray-200 dark:divide-gray-700"> {/* Added divide-y here */}
            {stats.recentOrders.length === 0 && !loading ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">No recent orders found.</p>
            ) : (
                stats.recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between py-3 lg:py-4"> {/* Adjusted vertical padding */}
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                                #{order.order_number}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {order.users?.full_name || order.user?.full_name || 'Guest'}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="font-medium text-gray-900 dark:text-white">
                                {formatPrice(order.total_amount)}
                            </p>
                            <span className={`inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-xs font-medium ${ // Changed to rounded-full for pill shape
                                order.status === 'delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                order.status === 'shipped' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                            }`}>
                                {order.status}
                            </span>
                        </div>
                    </div>
                ))
            )}
          </div>
        </Card>

        {/* Top Products */}
        <Card className="p-4 lg:p-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Top Products
          </h2>
          <div className="space-y-4 divide-y divide-gray-200 dark:divide-gray-700"> {/* Added divide-y here */}
            {stats.topProducts.length === 0 && !loading ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">No top products found.</p>
            ) : (
                stats.topProducts.map((product, index) => (
                    <div key={product.name} className="flex items-center justify-between py-3 lg:py-4"> {/* Adjusted vertical padding */}
                        <div className="flex items-center space-x-3">
                            <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 rounded-full text-xs font-medium">
                                {index + 1}
                            </span>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {product.name}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {product.reviews_count} reviews
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-medium text-gray-900 dark:text-white">
                                {formatPrice(product.price)}
                            </p>
                            <div className="flex items-center text-sm justify-end"> {/* Added justify-end for star alignment */}
                                <span className="text-yellow-400">★</span>
                                <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                                    {product.rating}
                                </span>
                            </div>
                        </div>
                    </div>
                ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}