import { useState, useEffect } from 'react';
import { ChevronRight, TrendingUp, Zap, Shield, Truck } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ProductCard } from '../components/products/ProductCard';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';

export function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      if (!supabase) {
        console.warn('Supabase not configured. Using mock data.');
        // Mock data for development when Supabase is not configured
        const mockProducts = [
          {
            id: '1',
            name: 'Premium Wireless Headphones',
            description: 'High-quality wireless headphones with noise cancellation',
            price: 2999,
            image_url: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=500',
            category: 'Electronics',
            stock: 50,
            is_featured: true,
            rating: 4.5,
            reviews_count: 128
          },
          {
            id: '2',
            name: 'Smart Fitness Watch',
            description: 'Track your fitness goals with this advanced smartwatch',
            price: 4999,
            image_url: 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=500',
            category: 'Electronics',
            stock: 30,
            is_featured: true,
            rating: 4.3,
            reviews_count: 89
          },
          {
            id: '3',
            name: 'Organic Cotton T-Shirt',
            description: 'Comfortable and sustainable organic cotton t-shirt',
            price: 899,
            image_url: 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=500',
            category: 'Clothing',
            stock: 100,
            is_featured: true,
            rating: 4.7,
            reviews_count: 203
          }
        ];
        setFeaturedProducts(mockProducts);
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_featured', true)
        .limit(8);

      if (error) {
        throw error;
      }
      setFeaturedProducts(data || []);
    } catch (error) {
      console.error('Error fetching featured products:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { name: 'Electronics', icon: '📱', color: 'bg-blue-100 text-blue-800' },
    { name: 'Fashion', icon: '👗', color: 'bg-pink-100 text-pink-800' },
    { name: 'Home', icon: '🏠', color: 'bg-green-100 text-green-800' },
    { name: 'Books', icon: '📚', color: 'bg-purple-100 text-purple-800' },
    { name: 'Sports', icon: '⚽', color: 'bg-orange-100 text-orange-800' },
    { name: 'Beauty', icon: '💄', color: 'bg-red-100 text-red-800' },
  ];

  const features = [
    {
      icon: <Zap className="w-8 h-8 text-yellow-500" />,
      title: 'Lightning Fast Delivery',
      description: 'Get your orders delivered within 24 hours in major cities'
    },
    {
      icon: <Shield className="w-8 h-8 text-green-500" />,
      title: 'Secure Shopping',
      description: 'Your data and payments are protected with bank-level security'
    },
    {
      icon: <Truck className="w-8 h-8 text-blue-500" />,
      title: 'Free Shipping',
      description: 'Free delivery on orders above ₹499 across India'
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-purple-500" />,
      title: 'Best Prices',
      description: 'Competitive prices with regular discounts and offers'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-6xl font-bold mb-6"
            >
              Shop Smart, Shop{' '}
              <span className="text-yellow-300">BlinkQ</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto"
            >
              Discover amazing products at unbeatable prices. From electronics to fashion, 
              we have everything you need.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link to="/products">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                  Shop Now
                  <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                Learn More
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Shop by Category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link
                  to={`/products?category=${category.name.toLowerCase()}`}
                  className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow text-center group"
                >
                  <div className="text-4xl mb-3">{category.icon}</div>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${category.color} dark:bg-gray-700 dark:text-gray-300`}>
                    {category.name}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Featured Products
            </h2>
            <Link to="/products">
              <Button variant="outline">
                View All
                <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg h-80 animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Why Choose BlinkQ?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-gray-100 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
              Stay Updated
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Subscribe to our newsletter for exclusive deals and new arrivals
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <Button>Subscribe</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}