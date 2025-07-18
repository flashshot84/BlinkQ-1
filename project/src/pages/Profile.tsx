import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, MapPin, Package, Heart, Settings, Edit2, Plus } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  phone: z.string().optional(),
});

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

type ProfileForm = z.infer<typeof profileSchema>;
type AddressForm = z.infer<typeof addressSchema>;

export function Profile() {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState('profile');
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.user_metadata?.full_name || '',
      phone: user?.user_metadata?.phone || '',
    },
  });

  const addressForm = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
  });

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  // Refresh data when switching to orders tab or when tab becomes visible
  useEffect(() => {
    if (user && (activeTab === 'orders' || activeTab === 'addresses')) {
      fetchUserData();
    }
  }, [activeTab, user]);

  const fetchUserData = async () => {
    if (!supabase || !user) return;

    try {
      // Fetch addresses
      const { data: addressData } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      setAddresses(addressData || []);

      // Fetch orders
      const { data: orderData } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setOrders(orderData || []);

      // Fetch wishlist
      const { data: wishlistData } = await supabase
        .from('wishlist')
        .select(`
          *,
          product:products(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setWishlist(wishlistData || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const updateProfile = async (data: ProfileForm) => {
    if (!supabase || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: data.full_name,
          phone: data.phone,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const saveAddress = async (data: AddressForm) => {
    if (!supabase || !user) return;

    setLoading(true);
    try {
      if (editingAddress) {
        const { error } = await supabase
          .from('addresses')
          .update(data)
          .eq('id', editingAddress.id);

        if (error) throw error;
        toast.success('Address updated successfully');
      } else {
        const { error } = await supabase
          .from('addresses')
          .insert({
            user_id: user.id,
            ...data,
            is_default: addresses.length === 0,
          });

        if (error) throw error;
        toast.success('Address added successfully');
      }

      setShowAddressModal(false);
      setEditingAddress(null);
      addressForm.reset();
      fetchUserData();
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save address');
    } finally {
      setLoading(false);
    }
  };

  const deleteAddress = async (addressId: string) => {
    if (!supabase || !confirm('Are you sure you want to delete this address?')) return;

    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addressId);

      if (error) throw error;

      toast.success('Address deleted successfully');
      fetchUserData();
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Failed to delete address');
    }
  };

  const setDefaultAddress = async (addressId: string) => {
    if (!supabase) return;

    try {
      // Remove default from all addresses
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);

      // Set new default
      const { error } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', addressId);

      if (error) throw error;

      toast.success('Default address updated');
      fetchUserData();
    } catch (error) {
      console.error('Error setting default address:', error);
      toast.error('Failed to update default address');
    }
  };

  const removeFromWishlist = async (itemId: string) => {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      toast.success('Removed from wishlist');
      fetchUserData();
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Failed to remove from wishlist');
    }
  };

  const openAddressModal = (address = null) => {
    setEditingAddress(address);
    if (address) {
      addressForm.reset(address);
    } else {
      addressForm.reset();
    }
    setShowAddressModal(true);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          My Account
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {user?.user_metadata?.full_name || 'User'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {user?.email}
                  </p>
                </div>
              </div>

              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon size={20} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </Card>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Profile Information
                  </h2>
                  <Settings className="w-5 h-5 text-gray-400" />
                </div>

                <form onSubmit={profileForm.handleSubmit(updateProfile)} className="space-y-6">
                  <Input
                    label="Full Name"
                    {...profileForm.register('full_name')}
                    error={profileForm.formState.errors.full_name?.message}
                  />

                  <Input
                    label="Email"
                    value={user?.email}
                    disabled
                    className="bg-gray-100 dark:bg-gray-700"
                  />

                  <Input
                    label="Phone Number"
                    {...profileForm.register('phone')}
                    error={profileForm.formState.errors.phone?.message}
                  />

                  <Button type="submit" loading={loading}>
                    Update Profile
                  </Button>
                </form>
              </Card>
            )}

            {activeTab === 'addresses' && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Saved Addresses
                  </h2>
                  <Button onClick={() => openAddressModal()}>
                    <Plus size={16} className="mr-2" />
                    Add Address
                  </Button>
                </div>

                {addresses.length > 0 ? (
                  <div className="space-y-4">
                    {addresses.map((address) => (
                      <div
                        key={address.id}
                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <p className="font-medium text-gray-900 dark:text-white">
                                First name = {address.first_name}, Last name = {address.last_name}
                              </p>
                              {address.is_default && (
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 dark:text-gray-400">
                              Address line 1 = {address.address_line_1}
                            </p>
                            {address.address_line_2 && (
                              <p className="text-gray-600 dark:text-gray-400">
                                Address line 2 = {address.address_line_2}
                              </p>
                            )}
                            <p className="text-gray-600 dark:text-gray-400">
                              City = {address.city}, State = {address.state}, Postal code = {address.postal_code}
                            </p>
                            <p className="text-gray-600 dark:text-gray-400">
                              Phone = {address.phone}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openAddressModal(address)}
                            >
                              <Edit2 size={14} />
                            </Button>
                            {!address.is_default && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDefaultAddress(address.id)}
                              >
                                Set Default
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteAddress(address.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No addresses saved yet
                    </p>
                  </div>
                )}
              </Card>
            )}

            {activeTab === 'orders' && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Order History
                </h2>

                {orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              Order #{order.order_number}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900 dark:text-white">
                              ₹{order.total_amount.toLocaleString()}
                            </p>
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {order.order_items?.length} item(s) • {order.payment_method.toUpperCase()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No orders yet
                    </p>
                  </div>
                )}
              </Card>
            )}

            {activeTab === 'wishlist' && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  My Wishlist
                </h2>

                {wishlist.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {wishlist.map((item) => (
                      <div
                        key={item.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                      >
                        <img
                          src={item.product?.image_url}
                          alt={item.product?.name}
                          className="w-full h-48 object-cover"
                        />
                        <div className="p-4">
                          <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                            {item.product?.name}
                          </h3>
                          <p className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                            ₹{item.product?.price.toLocaleString()}
                          </p>
                          <div className="flex space-x-2">
                            <Button size="sm" className="flex-1">
                              Add to Cart
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeFromWishlist(item.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Your wishlist is empty
                    </p>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>

        {/* Address Modal */}
        <Modal
          isOpen={showAddressModal}
          onClose={() => setShowAddressModal(false)}
          title={editingAddress ? 'Edit Address' : 'Add New Address'}
          size="lg"
        >
          <form onSubmit={addressForm.handleSubmit(saveAddress)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name"
                {...addressForm.register('first_name')}
                error={addressForm.formState.errors.first_name?.message}
              />
              <Input
                label="Last Name"
                {...addressForm.register('last_name')}
                error={addressForm.formState.errors.last_name?.message}
              />
            </div>
            
            <Input
              label="Address Line 1"
              {...addressForm.register('address_line_1')}
              error={addressForm.formState.errors.address_line_1?.message}
            />
            
            <Input
              label="Address Line 2 (Optional)"
              {...addressForm.register('address_line_2')}
              error={addressForm.formState.errors.address_line_2?.message}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="City"
                {...addressForm.register('city')}
                error={addressForm.formState.errors.city?.message}
              />
              <Input
                label="State"
                {...addressForm.register('state')}
                error={addressForm.formState.errors.state?.message}
              />
              <Input
                label="Postal Code"
                {...addressForm.register('postal_code')}
                error={addressForm.formState.errors.postal_code?.message}
              />
            </div>
            
            <Input
              label="Phone Number"
              {...addressForm.register('phone')}
              error={addressForm.formState.errors.phone?.message}
            />

            <div className="flex space-x-3 pt-4">
              <Button type="submit" loading={loading} className="flex-1">
                {editingAddress ? 'Update Address' : 'Save Address'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddressModal(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}