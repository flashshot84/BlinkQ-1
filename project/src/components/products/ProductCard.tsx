import { Link } from 'react-router-dom';
import { Star, ShoppingCart, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useCart } from '../../contexts/CartContext';
import { useAuthContext } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { useState } from 'react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  images?: { url: string }[];
  category: string;
  stock: number;
  rating: number;
  reviews_count: number;
}

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
}

export function ProductCard({ product, viewMode = 'grid' }: ProductCardProps) {
  const { addItem } = useCart();
  const { user } = useAuthContext();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.images?.[0]?.url || product.image_url,
      stock: product.stock,
    });
    toast.success('Added to cart!');
  };

  const toggleWishlist = async () => {
    if (!user) {
      toast.error('Please login to add to wishlist');
      return;
    }

    if (!supabase) return;

    setWishlistLoading(true);
    try {
      if (isWishlisted) {
        await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', product.id);
        
        setIsWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        await supabase
          .from('wishlist')
          .insert({
            user_id: user.id,
            product_id: product.id
          });
        
        setIsWishlisted(true);
        toast.success('Added to wishlist');
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
      toast.error('Failed to update wishlist');
    } finally {
      setWishlistLoading(false);
    }
  };

  const imageUrl = product.images?.[0]?.url || product.image_url;

  if (viewMode === 'list') {
    return (
      <Card hover className="overflow-hidden">
        <div className="flex">
          <div className="relative w-48 h-48 flex-shrink-0">
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <button 
              onClick={toggleWishlist}
              disabled={wishlistLoading}
              className="absolute top-2 right-2 p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Heart 
                size={16} 
                className={`${isWishlisted ? 'fill-current text-red-500' : 'text-gray-600 dark:text-gray-400'}`} 
              />
            </button>
            {product.stock === 0 && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <span className="text-white font-semibold">Out of Stock</span>
              </div>
            )}
          </div>

          <div className="flex-1 p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <Link to={`/product/${product.id}`}>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 hover:text-blue-600 dark:hover:text-blue-400">
                    {product.name}
                  </h3>
                </Link>
                
                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                  {product.description}
                </p>

                <div className="flex items-center mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={i < product.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                    ({product.reviews_count})
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    ₹{product.price.toLocaleString()}
                  </span>
                  <Button
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                    className="flex items-center space-x-2"
                  >
                    <ShoppingCart size={16} />
                    <span>Add to Cart</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }
  return (
    <Card hover className="overflow-hidden">
      <div className="relative">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-48 object-cover"
        />
        <button 
          onClick={toggleWishlist}
          disabled={wishlistLoading}
          className="absolute top-2 right-2 p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <Heart 
            size={16} 
            className={`${isWishlisted ? 'fill-current text-red-500' : 'text-gray-600 dark:text-gray-400'}`} 
          />
        </button>
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-semibold">Out of Stock</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <Link to={`/product/${product.id}`}>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1 hover:text-blue-600 dark:hover:text-blue-400">
            {product.name}
          </h3>
        </Link>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
          {product.description}
        </p>

        <div className="flex items-center mb-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={14}
                className={i < product.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
              />
            ))}
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
            ({product.reviews_count})
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            ₹{product.price.toLocaleString()}
          </span>
          <Button
            size="sm"
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="flex items-center space-x-1"
            size="sm"
          >
            <ShoppingCart size={16} />
            <span>Add to Cart</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}