import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Calendar, Percent, DollarSign } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { supabase } from '../../lib/supabase';
import { formatPrice, formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

export function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [couponForm, setCouponForm] = useState({
    code: '',
    name: '',
    description: '',
    type: 'percentage',
    value: '',
    minimum_amount: '',
    maximum_discount: '',
    usage_limit: '',
    user_limit: '',
    starts_at: '',
    expires_at: '',
    is_active: true,
  });

  useEffect(() => {
    fetchCoupons();
  }, [searchQuery]);

  const fetchCoupons = async () => {
    if (!supabase) return;

    try {
      setLoading(true);
      
      let query = supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.or(`code.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      setCoupons(data || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.error('Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    if (!supabase) return;

    try {
      const couponData = {
        ...couponForm,
        code: couponForm.code.toUpperCase(),
        value: parseFloat(couponForm.value),
        minimum_amount: couponForm.minimum_amount ? parseFloat(couponForm.minimum_amount) : null,
        maximum_discount: couponForm.maximum_discount ? parseFloat(couponForm.maximum_discount) : null,
        usage_limit: couponForm.usage_limit ? parseInt(couponForm.usage_limit) : null,
        user_limit: couponForm.user_limit ? parseInt(couponForm.user_limit) : null,
        starts_at: couponForm.starts_at || null,
        expires_at: couponForm.expires_at || null,
      };

      if (editingCoupon) {
        const { error } = await supabase
          .from('coupons')
          .update(couponData)
          .eq('id', editingCoupon.id);

        if (error) throw error;
        toast.success('Coupon updated successfully');
      } else {
        const { error } = await supabase
          .from('coupons')
          .insert(couponData);

        if (error) throw error;
        toast.success('Coupon created successfully');
      }

      setShowCouponModal(false);
      setEditingCoupon(null);
      resetForm();
      fetchCoupons();
    } catch (error) {
      console.error('Error saving coupon:', error);
      toast.error('Failed to save coupon');
    }
  };

  const handleDeleteCoupon = async (couponId) => {
    if (!supabase || !confirm('Are you sure you want to delete this coupon?')) return;

    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', couponId);

      if (error) throw error;
      toast.success('Coupon deleted successfully');
      fetchCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast.error('Failed to delete coupon');
    }
  };

  const openCouponModal = (coupon = null) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setCouponForm({
        code: coupon.code,
        name: coupon.name,
        description: coupon.description || '',
        type: coupon.type,
        value: coupon.value.toString(),
        minimum_amount: coupon.minimum_amount?.toString() || '',
        maximum_discount: coupon.maximum_discount?.toString() || '',
        usage_limit: coupon.usage_limit?.toString() || '',
        user_limit: coupon.user_limit?.toString() || '',
        starts_at: coupon.starts_at ? new Date(coupon.starts_at).toISOString().slice(0, 16) : '',
        expires_at: coupon.expires_at ? new Date(coupon.expires_at).toISOString().slice(0, 16) : '',
        is_active: coupon.is_active,
      });
    } else {
      setEditingCoupon(null);
      resetForm();
    }
    setShowCouponModal(true);
  };

  const resetForm = () => {
    setCouponForm({
      code: '',
      name: '',
      description: '',
      type: 'percentage',
      value: '',
      minimum_amount: '',
      maximum_discount: '',
      usage_limit: '',
      user_limit: '',
      starts_at: '',
      expires_at: '',
      is_active: true,
    });
  };

  const getCouponStatus = (coupon) => {
    if (!coupon.is_active) return { label: 'Inactive', color: 'bg-gray-100 text-gray-800' };
    
    const now = new Date();
    const startsAt = coupon.starts_at ? new Date(coupon.starts_at) : null;
    const expiresAt = coupon.expires_at ? new Date(coupon.expires_at) : null;

    if (startsAt && startsAt > now) return { label: 'Scheduled', color: 'bg-blue-100 text-blue-800' };
    if (expiresAt && expiresAt < now) return { label: 'Expired', color: 'bg-red-100 text-red-800' };
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) return { label: 'Used Up', color: 'bg-orange-100 text-orange-800' };
    
    return { label: 'Active', color: 'bg-green-100 text-green-800' };
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Coupons Management
        </h1>
        <Button onClick={() => openCouponModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Coupon
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4 lg:p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            type="text"
            placeholder="Search coupons by code or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Coupons Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Coupon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Discount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Validity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-32"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : coupons.length > 0 ? (
                coupons.map((coupon) => {
                  const status = getCouponStatus(coupon);
                  return (
                    <tr key={coupon.id}>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {coupon.code}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {coupon.name}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {coupon.type === 'percentage' ? (
                            <Percent className="w-4 h-4 text-green-500 mr-1" />
                          ) : (
                            <DollarSign className="w-4 h-4 text-blue-500 mr-1" />
                          )}
                          <span className="font-medium text-gray-900 dark:text-white">
                            {coupon.type === 'percentage' ? `${coupon.value}%` : formatPrice(coupon.value)}
                          </span>
                        </div>
                        {coupon.minimum_amount && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Min: {formatPrice(coupon.minimum_amount)}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {coupon.used_count || 0}
                        {coupon.usage_limit && ` / ${coupon.usage_limit}`}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {coupon.expires_at ? (
                          <div>
                            <p>Until {formatDate(coupon.expires_at)}</p>
                            {coupon.starts_at && (
                              <p className="text-xs text-gray-500">
                                From {formatDate(coupon.starts_at)}
                              </p>
                            )}
                          </div>
                        ) : (
                          'No expiry'
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openCouponModal(coupon)}
                          >
                            <Edit2 size={14} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCoupon(coupon.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No coupons found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Coupon Modal */}
      <Modal
        isOpen={showCouponModal}
        onClose={() => setShowCouponModal(false)}
        title={editingCoupon ? 'Edit Coupon' : 'Add New Coupon'}
        size="lg"
      >
        <form onSubmit={handleSaveCoupon} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Coupon Code"
              value={couponForm.code}
              onChange={(e) => setCouponForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
              placeholder="e.g., SAVE20"
              required
            />
            <Input
              label="Coupon Name"
              value={couponForm.name}
              onChange={(e) => setCouponForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., 20% Off Sale"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={couponForm.description}
              onChange={(e) => setCouponForm(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Optional description for the coupon"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Discount Type
              </label>
              <select
                value={couponForm.type}
                onChange={(e) => setCouponForm(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            <Input
              label={`Discount ${couponForm.type === 'percentage' ? 'Percentage' : 'Amount'}`}
              type="number"
              step={couponForm.type === 'percentage' ? '1' : '0.01'}
              value={couponForm.value}
              onChange={(e) => setCouponForm(prev => ({ ...prev, value: e.target.value }))}
              placeholder={couponForm.type === 'percentage' ? '20' : '100'}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Minimum Order Amount (Optional)"
              type="number"
              step="0.01"
              value={couponForm.minimum_amount}
              onChange={(e) => setCouponForm(prev => ({ ...prev, minimum_amount: e.target.value }))}
              placeholder="500"
            />
            {couponForm.type === 'percentage' && (
              <Input
                label="Maximum Discount (Optional)"
                type="number"
                step="0.01"
                value={couponForm.maximum_discount}
                onChange={(e) => setCouponForm(prev => ({ ...prev, maximum_discount: e.target.value }))}
                placeholder="1000"
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Total Usage Limit (Optional)"
              type="number"
              value={couponForm.usage_limit}
              onChange={(e) => setCouponForm(prev => ({ ...prev, usage_limit: e.target.value }))}
              placeholder="100"
            />
            <Input
              label="Per User Limit (Optional)"
              type="number"
              value={couponForm.user_limit}
              onChange={(e) => setCouponForm(prev => ({ ...prev, user_limit: e.target.value }))}
              placeholder="1"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date (Optional)
              </label>
              <input
                type="datetime-local"
                value={couponForm.starts_at}
                onChange={(e) => setCouponForm(prev => ({ ...prev, starts_at: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Expiry Date (Optional)
              </label>
              <input
                type="datetime-local"
                value={couponForm.expires_at}
                onChange={(e) => setCouponForm(prev => ({ ...prev, expires_at: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={couponForm.is_active}
                onChange={(e) => setCouponForm(prev => ({ ...prev, is_active: e.target.checked }))}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button type="submit" className="flex-1">
              {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCouponModal(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}