import React, { useState, useEffect } from 'react';
import { Save, AlertCircle } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { toast } from 'react-toastify';
import { getPersonalizationSettings, updatePersonalizationSettings } from '../../api/gamification';

interface PersonalizationSettingsData {
  enabled: boolean;
  default_deck_size: number;
  policy: 'strict' | 'balanced' | 'aggressive';
  price_cap_per_traveler: number | null;
  price_cap_per_day: number | null;
  currency: string;
  excluded_activity_types: string[];
  show_readiness_warnings: boolean;
}

const PersonalizationSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PersonalizationSettingsData>({
    enabled: true,
    default_deck_size: 20,
    policy: 'balanced',
    price_cap_per_traveler: null,
    price_cap_per_day: null,
    currency: 'USD',
    excluded_activity_types: [],
    show_readiness_warnings: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getPersonalizationSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('Failed to load personalization settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updatePersonalizationSettings(settings);
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const policyDescriptions = {
    strict: 'Only add experiences to empty time slots',
    balanced: 'Can replace flexible items with better matches',
    aggressive: 'Maximize personalization, more swap suggestions',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-text-secondary">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          Personalization Settings
        </h1>
        <p className="text-text-secondary">
          Configure how the gamified discovery engine works for your agency
        </p>
      </div>

      <Card className="mb-6">
        <div className="space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between pb-6 border-b border-border">
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-1">
                Enable Personalization
              </h3>
              <p className="text-sm text-text-secondary">
                Allow travelers to personalize their itineraries through the discovery engine
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.enabled}
                onChange={(e) =>
                  setSettings({ ...settings, enabled: e.target.checked })
                }
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {/* Default Deck Size */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Default Deck Size
            </label>
            <select
              value={settings.default_deck_size}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  default_deck_size: parseInt(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={!settings.enabled}
            >
              <option value={15}>15 activities</option>
              <option value={20}>20 activities</option>
              <option value={25}>25 activities</option>
            </select>
            <p className="mt-1 text-sm text-text-muted">
              Number of activity cards to show in each personalization session
            </p>
          </div>

          {/* Policy Selector */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Personalization Policy
            </label>
            <div className="space-y-3">
              {(['strict', 'balanced', 'aggressive'] as const).map((policy) => (
                <label
                  key={policy}
                  className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                    settings.policy === policy
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-border hover:border-primary-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="policy"
                    value={policy}
                    checked={settings.policy === policy}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        policy: e.target.value as PersonalizationSettingsData['policy'],
                      })
                    }
                    className="mt-1 mr-3"
                    disabled={!settings.enabled}
                  />
                  <div>
                    <div className="font-medium text-text-primary capitalize">
                      {policy}
                    </div>
                    <div className="text-sm text-text-secondary">
                      {policyDescriptions[policy]}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Price Caps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Price Cap Per Traveler
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={settings.price_cap_per_traveler || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      price_cap_per_traveler: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  placeholder="No limit"
                  disabled={!settings.enabled}
                />
                <select
                  value={settings.currency}
                  onChange={(e) =>
                    setSettings({ ...settings, currency: e.target.value })
                  }
                  className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={!settings.enabled}
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Price Cap Per Day
              </label>
              <Input
                type="number"
                value={settings.price_cap_per_day || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    price_cap_per_day: e.target.value
                      ? parseFloat(e.target.value)
                      : null,
                  })
                }
                placeholder="No limit"
                disabled={!settings.enabled}
              />
            </div>
          </div>

          {/* Readiness Warnings */}
          <div className="flex items-start pt-6 border-t border-border">
            <input
              type="checkbox"
              id="readiness-warnings"
              checked={settings.show_readiness_warnings}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  show_readiness_warnings: e.target.checked,
                })
              }
              className="mt-1 mr-3"
              disabled={!settings.enabled}
            />
            <label htmlFor="readiness-warnings" className="flex-1 cursor-pointer">
              <div className="font-medium text-text-primary">
                Show Readiness Warnings
              </div>
              <div className="text-sm text-text-secondary">
                Display warnings when activities are not fully optimized for the discovery
                engine
              </div>
            </label>
          </div>

          {!settings.enabled && (
            <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                Personalization is currently disabled. Travelers will not see the
                discovery engine when viewing their itineraries.
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default PersonalizationSettings;
