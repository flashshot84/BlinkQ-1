import { useState, useEffect } from 'react';
import { Save, Upload, Globe, Mail, Phone, MapPin } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import toast from 'react-hot-toast';

export function AdminSettings() {
  const [settings, setSettings] = useState({
    siteName: 'BlinkQ',
    siteDescription: 'Your trusted online shopping destination',
    contactEmail: 'support@blinkq.com',
    contactPhone: '+91 9876543210',
    address: '123 Business Street, Mumbai, India',
    currency: 'INR',
    taxRate: '18',
    shippingFee: '49',
    freeShippingThreshold: '499',
    enableCOD: true,
    enableRazorpay: true,
    razorpayKeyId: '',
    razorpayKeySecret: '',
  });

  const [loading, setLoading] = useState(false);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // In a real app, you would save these to your database
      // For now, we'll just simulate saving to localStorage
      localStorage.setItem('adminSettings', JSON.stringify(settings));
      
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load settings from localStorage (in a real app, this would be from your database)
    const savedSettings = localStorage.getItem('adminSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* General Settings */}
        <Card className="p-4 lg:p-6 bg-white dark:bg-gray-800">
          <div className="flex items-center mb-6">
            <Globe className="w-5 h-5 text-blue-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              General Settings
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Site Name"
              value={settings.siteName}
              onChange={(e) => setSettings(prev => ({ ...prev, siteName: e.target.value }))}
              required
            />
            <Input
              label="Currency"
              value={settings.currency}
              onChange={(e) => setSettings(prev => ({ ...prev, currency: e.target.value }))}
              required
            />
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Site Description
            </label>
            <textarea
              value={settings.siteDescription}
              onChange={(e) => setSettings(prev => ({ ...prev, siteDescription: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
        </Card>

        {/* Contact Information */}
        <Card className="p-4 lg:p-6 bg-white dark:bg-gray-800">
          <div className="flex items-center mb-6">
            <Mail className="w-5 h-5 text-green-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Contact Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Contact Email"
              type="email"
              value={settings.contactEmail}
              onChange={(e) => setSettings(prev => ({ ...prev, contactEmail: e.target.value }))}
              required
            />
            <Input
              label="Contact Phone"
              value={settings.contactPhone}
              onChange={(e) => setSettings(prev => ({ ...prev, contactPhone: e.target.value }))}
              required
            />
          </div>

          <div className="mt-6">
            <Input
              label="Business Address"
              value={settings.address}
              onChange={(e) => setSettings(prev => ({ ...prev, address: e.target.value }))}
              required
            />
          </div>
        </Card>

        {/* Pricing & Shipping */}
        <Card className="p-4 lg:p-6 bg-white dark:bg-gray-800">
          <div className="flex items-center mb-6">
            <MapPin className="w-5 h-5 text-purple-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Pricing & Shipping
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Tax Rate (%)"
              type="number"
              step="0.01"
              value={settings.taxRate}
              onChange={(e) => setSettings(prev => ({ ...prev, taxRate: e.target.value }))}
              required
            />
            <Input
              label="Shipping Fee"
              type="number"
              step="0.01"
              value={settings.shippingFee}
              onChange={(e) => setSettings(prev => ({ ...prev, shippingFee: e.target.value }))}
              required
            />
          </div>

          <div className="mt-6">
            <Input
              label="Free Shipping Threshold"
              type="number"
              step="0.01"
              value={settings.freeShippingThreshold}
              onChange={(e) => setSettings(prev => ({ ...prev, freeShippingThreshold: e.target.value }))}
              required
            />
          </div>
        </Card>

        {/* Payment Settings */}
        <Card className="p-4 lg:p-6 bg-white dark:bg-gray-800">
          <div className="flex items-center mb-6">
            <Phone className="w-5 h-5 text-orange-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Payment Settings
            </h2>
          </div>

          <div className="space-y-6">
            <div className="flex items-center space-x-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.enableCOD}
                  onChange={(e) => setSettings(prev => ({ ...prev, enableCOD: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Enable Cash on Delivery</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.enableRazorpay}
                  onChange={(e) => setSettings(prev => ({ ...prev, enableRazorpay: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Enable Razorpay</span>
              </label>
            </div>

            {settings.enableRazorpay && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Razorpay Key ID"
                  value={settings.razorpayKeyId}
                  onChange={(e) => setSettings(prev => ({ ...prev, razorpayKeyId: e.target.value }))}
                  placeholder="rzp_test_..."
                />
                <Input
                  label="Razorpay Key Secret"
                  type="password"
                  value={settings.razorpayKeySecret}
                  onChange={(e) => setSettings(prev => ({ ...prev, razorpayKeySecret: e.target.value }))}
                  placeholder="Enter secret key"
                />
              </div>
            )}
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button type="submit" loading={loading} size="lg">
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
}