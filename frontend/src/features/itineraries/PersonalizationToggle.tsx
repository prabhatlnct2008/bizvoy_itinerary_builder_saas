import React from 'react';
import { Info } from 'lucide-react';
import Card from '../../components/ui/Card';

interface PersonalizationSettings {
  enabled: boolean;
  policy_override: 'inherit' | 'strict' | 'balanced' | 'aggressive';
  lock_policy: 'strict' | 'relaxed';
}

interface PersonalizationToggleProps {
  value: PersonalizationSettings;
  onChange: (settings: PersonalizationSettings) => void;
  agencyEnabled?: boolean;
}

const PersonalizationToggle: React.FC<PersonalizationToggleProps> = ({
  value,
  onChange,
  agencyEnabled = true,
}) => {
  const handleChange = (field: keyof PersonalizationSettings, val: any) => {
    onChange({ ...value, [field]: val });
  };

  const policyDescriptions = {
    inherit: 'Use agency default settings',
    strict: 'Only add experiences to empty time slots',
    balanced: 'Can replace flexible items with better matches',
    aggressive: 'Maximize personalization, more swap suggestions',
  };

  const lockPolicyDescriptions = {
    strict: "Can't replace any existing activities",
    relaxed: 'Flexible items can be replaced with better matches',
  };

  return (
    <Card>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-1">
            Personalization Controls
          </h3>
          <p className="text-sm text-text-secondary">
            Configure how travelers can personalize this itinerary
          </p>
        </div>

        {/* Enable/Disable for this itinerary */}
        <div className="flex items-center justify-between pb-6 border-b border-border">
          <div className="flex-1">
            <div className="font-medium text-text-primary mb-1">
              Enable Personalization
            </div>
            <div className="text-sm text-text-secondary">
              Allow travelers to customize this itinerary through the discovery engine
            </div>
            {!agencyEnabled && (
              <div className="mt-2 flex items-start gap-2 text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  Personalization is disabled at the agency level. Enable it in agency
                  settings first.
                </span>
              </div>
            )}
          </div>
          <label className="relative inline-flex items-center cursor-pointer ml-4">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={value.enabled}
              onChange={(e) => handleChange('enabled', e.target.checked)}
              disabled={!agencyEnabled}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50"></div>
          </label>
        </div>

        {/* Policy Override */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Personalization Policy
          </label>
          <div className="space-y-2">
            {(['inherit', 'strict', 'balanced', 'aggressive'] as const).map((policy) => (
              <label
                key={policy}
                className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                  value.policy_override === policy
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-border hover:border-primary-300'
                } ${!value.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="policy_override"
                  value={policy}
                  checked={value.policy_override === policy}
                  onChange={(e) =>
                    handleChange(
                      'policy_override',
                      e.target.value as PersonalizationSettings['policy_override']
                    )
                  }
                  className="mt-1 mr-3"
                  disabled={!value.enabled}
                />
                <div className="flex-1">
                  <div className="font-medium text-text-primary capitalize">
                    {policy === 'inherit' ? 'Inherit from Agency' : policy}
                  </div>
                  <div className="text-sm text-text-secondary">
                    {policyDescriptions[policy]}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Lock Policy */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Lock Policy
          </label>
          <div className="space-y-2">
            {(['strict', 'relaxed'] as const).map((lockPolicy) => (
              <label
                key={lockPolicy}
                className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                  value.lock_policy === lockPolicy
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-border hover:border-primary-300'
                } ${!value.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="lock_policy"
                  value={lockPolicy}
                  checked={value.lock_policy === lockPolicy}
                  onChange={(e) =>
                    handleChange(
                      'lock_policy',
                      e.target.value as PersonalizationSettings['lock_policy']
                    )
                  }
                  className="mt-1 mr-3"
                  disabled={!value.enabled}
                />
                <div className="flex-1">
                  <div className="font-medium text-text-primary capitalize">
                    {lockPolicy}
                  </div>
                  <div className="text-sm text-text-secondary">
                    {lockPolicyDescriptions[lockPolicy]}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PersonalizationToggle;
