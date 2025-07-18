import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Filter, Eye } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { supabase } from '../../lib/supabase';
import { formatPrice } from '../../lib/utils';
import toast from 'react-hot-toast';

export function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    short_description: '',
    price: '',
    compare_price: '',
    sku: '',
    category_id: '',
    brand: '',
    quantity: '',
    is_featured: false,
    is_active: true,
    image_url: '',
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [searchQuery, selectedCategory]);

  const fetchProducts = async () => {
    if (!supabase) return;

    try {
      setLoading(true);
      
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(name)
        `)
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      const { data, error } = await query;
      if (error) throw error;

      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!supabase) return;

    try {
      // Destructure image_url from productForm to exclude it from database operation
      const { image_url, ...formDataWithoutImageUrl } = productForm;
      
      const productData = {
        ...formDataWithoutImageUrl,
        price: parseFloat(productForm.price),
        compare_price: productForm.compare_price ? parseFloat(productForm.compare_price) : null,
        quantity: parseInt(productForm.quantity),
        images: image_url ? [{ url: image_url }] : [],
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast.success('Product updated successfully');
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData);

        if (error) throw error;
        toast.success('Product created successfully');
      }

      setShowProductModal(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!supabase || !confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const openProductModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        description: product.description,
        short_description: product.short_description || '',
        price: product.price.toString(),
        compare_price: product.compare_price?.toString() || '',
        sku: product.sku,
        category_id: product.category_id || '',
        brand: product.brand || '',
        quantity: product.quantity.toString(),
        is_featured: product.is_featured,
        is_active: product.is_active,
        image_url: product.images?.[0]?.url || '',
      });
    } else {
      setEditingProduct(null);
      resetForm();
    }
    setShowProductModal(true);
  };

  const resetForm = () => {
    setProductForm({
      name: '',
      description: '',
      short_description: '',
      price: '',
      compare_price: '',
      sku: '',
      category_id: '',
      brand: '',
      quantity: '',
      is_featured: false,
      is_active: true,
      image_url: '',
    });
  };


  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Products Management
        </h1>
        <Button onClick={() => openProductModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Products Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 lg:px-6 py-4">
                      <div className="animate-pulse flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-200 rounded"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <div className="flex space-x-2">
                        <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : products.length > 0 ? (
                products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-4 lg:px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={product.images?.[0]?.url || '/placeholder-product.jpg'}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {product.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            SKU: {product.sku}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {product.category?.name || 'Uncategorized'}
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {formatPrice(product.price)}
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {product.quantity}
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </span>
                        {product.is_featured && (
                          <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Featured
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openProductModal(product)}
                        >
                          <Edit2 size={14} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 lg:px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Product Modal */}
      <Modal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        size="xl"
      >
        <form onSubmit={handleSaveProduct} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Product Name"
              value={productForm.name}
              onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
              required
            />
            <Input
              label="SKU"
              value={productForm.sku}
              onChange={(e) => setProductForm(prev => ({ ...prev, sku: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Price"
              type="number"
              step="0.01"
              value={productForm.price}
              onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
              required
            />
            <Input
              label="Compare Price (Optional)"
              type="number"
              step="0.01"
              value={productForm.compare_price}
              onChange={(e) => setProductForm(prev => ({ ...prev, compare_price: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                value={productForm.category_id}
                onChange={(e) => setProductForm(prev => ({ ...prev, category_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Brand (Optional)"
              value={productForm.brand}
              onChange={(e) => setProductForm(prev => ({ ...prev, brand: e.target.value }))}
            />
          </div>

          <Input
            label="Quantity"
            type="number"
            value={productForm.quantity}
            onChange={(e) => setProductForm(prev => ({ ...prev, quantity: e.target.value }))}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Short Description
            </label>
            <textarea
              value={productForm.short_description}
              onChange={(e) => setProductForm(prev => ({ ...prev, short_description: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={productForm.description}
              onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>

          {/* Product Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Product Image URL
            </label>
            <Input
              placeholder="Enter image URL"
              value={productForm.image_url}
              onChange={(e) => setProductForm(prev => ({ ...prev, image_url: e.target.value }))}
            />
          </div>

          <div className="flex items-center space-x-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={productForm.is_featured}
                onChange={(e) => setProductForm(prev => ({ ...prev, is_featured: e.target.checked }))}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Featured Product</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={productForm.is_active}
                onChange={(e) => setProductForm(prev => ({ ...prev, is_active: e.target.checked }))}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button type="submit" className="flex-1">
              {editingProduct ? 'Update Product' : 'Create Product'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowProductModal(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}