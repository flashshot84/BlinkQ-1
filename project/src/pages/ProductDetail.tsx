import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Heart, ShoppingCart, Minus, Plus, Share2, Truck, Shield, RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useCart } from '../contexts/CartContext';
import { useAuthContext } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuthContext();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchReviews();
      checkWishlist();
    }
  }, [id, user]);

  const fetchProduct = async () => {
    try {
      if (!supabase) {
        // Mock product data
        const mockProduct = {
          id: '1',
          name: 'Premium Wireless Headphones',
          description: 'Experience superior sound quality with these premium wireless headphones featuring active noise cancellation, 30-hour battery life, and premium comfort padding.',
          price: 2999,
          compare_price: 3999,
          images: [
            { url: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=800' },
            { url: 'https://images.pexels.com/photos/3394651/pexels-photo-3394651.jpeg?auto=compress&cs=tinysrgb&w=800' }
          ],
          category: { name: 'Electronics' },
          quantity: 50,
          rating: 4.5,
          reviews_count: 128,
          brand: 'AudioTech',
          sku: 'AT-WH-001'
        };
        setProduct(mockProduct);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(name, slug)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Product not found');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      if (!supabase) return;

      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          user:users(full_name, avatar_url)
        `)
        .eq('product_id', id)
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const checkWishlist = async () => {
    if (!user || !supabase) return;

    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', id)
        .maybeSingle();

      if (error) {
        console.error('Error checking wishlist:', error);
        return;
      }

      if (data === null) {
        // No rows found - item is not in wishlist
        setIsWishlisted(false);
      } else {
        // Row found - item is in wishlist
        setIsWishlisted(true);
      }
    } catch (error) {
      console.error('Error checking wishlist:', error);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.images?.[0]?.url || product.image_url,
        stock: product.quantity,
      });
    }
    
    toast.success(`Added ${quantity} item(s) to cart`);
  };

  const toggleWishlist = async () => {
    if (!user) {
      toast.error('Please login to add to wishlist');
      return;
    }

    if (!supabase) return;

    try {
      if (isWishlisted) {
        await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', id);
        
        setIsWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        await supabase
          .from('wishlist')
          .insert({
            user_id: user.id,
            product_id: id
          });
        
        setIsWishlisted(true);
        toast.success('Added to wishlist');
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
      toast.error('Failed to update wishlist');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-96"></div>
              <div className="space-y-4">
                <div className="bg-gray-200 dark:bg-gray-700 rounded h-8 w-3/4"></div>
                <div className="bg-gray-200 dark:bg-gray-700 rounded h-6 w-1/2"></div>
                <div className="bg-gray-200 dark:bg-gray-700 rounded h-20 w-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Product not found</h1>
            <Link to="/products">
              <Button className="mt-4">Back to Products</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const images = product.images || [{ url: product.image_url }];
  const discount = product.compare_price ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li><Link to="/" className="hover:text-blue-600">Home</Link></li>
            <li>/</li>
            <li><Link to="/products" className="hover:text-blue-600">Products</Link></li>
            <li>/</li>
            <li className="text-gray-900 dark:text-white">{product.name}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-lg overflow-hidden">
              <img
                src={images[selectedImage]?.url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      selectedImage === index ? 'border-blue-500' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {product.name}
              </h1>
              
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={20}
                      className={i < product.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                    />
                  ))}
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    ({product.reviews_count} reviews)
                  </span>
                </div>
                
                {product.brand && (
                  <span className="text-gray-600 dark:text-gray-400">
                    Brand: {product.brand}
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-4 mb-4">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  ₹{product.price.toLocaleString()}
                </span>
                
                {product.compare_price && (
                  <>
                    <span className="text-xl text-gray-500 line-through">
                      ₹{product.compare_price.toLocaleString()}
                    </span>
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">
                      {discount}% OFF
                    </span>
                  </>
                )}
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {product.description}
              </p>
            </div>

            {/* Quantity and Actions */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <span className="text-gray-700 dark:text-gray-300">Quantity:</span>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="px-4 py-2 font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <span className="text-sm text-gray-500">
                  {product.quantity} in stock
                </span>
              </div>

              <div className="flex space-x-4">
                <Button
                  onClick={handleAddToCart}
                  disabled={product.quantity === 0}
                  className="flex-1 flex items-center justify-center space-x-2"
                  size="lg"
                >
                  <ShoppingCart size={20} />
                  <span>Add to Cart</span>
                </Button>
                
                <Button
                  onClick={toggleWishlist}
                  variant="outline"
                  className="p-3"
                >
                  <Heart
                    size={20}
                    className={isWishlisted ? 'fill-current text-red-500' : ''}
                  />
                </Button>
                
                <Button variant="outline" className="p-3">
                  <Share2 size={20} />
                </Button>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <Truck className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Free Delivery</span>
              </div>
              <div className="flex items-center space-x-2">
                <RotateCcw className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Easy Returns</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-purple-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Warranty</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Customer Reviews
          </h2>
          
          {reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 dark:border-gray-700 pb-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                        {review.user?.full_name?.charAt(0) || 'U'}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {review.user?.full_name || 'Anonymous'}
                        </span>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={16}
                              className={i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                            />
                          ))}
                        </div>
                      </div>
                      {review.title && (
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                          {review.title}
                        </h4>
                      )}
                      <p className="text-gray-600 dark:text-gray-400">
                        {review.comment}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              No reviews yet. Be the first to review this product!
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}