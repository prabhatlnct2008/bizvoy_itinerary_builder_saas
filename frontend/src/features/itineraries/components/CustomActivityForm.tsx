import React, { useState } from 'react';
import { ItineraryDayActivityCreate } from '../../../types';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import {
  MapPin,
  Clock,
  DollarSign,
  FileText,
  Plus,
  Camera,
  Compass,
  Mountain,
  Waves,
  Utensils,
  ShoppingBag,
  Music,
  Landmark,
  Bike,
  Palmtree,
} from 'lucide-react';

interface CustomActivityFormProps {
  onAddActivity: (activity: ItineraryDayActivityCreate) => void;
  displayOrder: number;
  onClose?: () => void;
}

const ACTIVITY_ICONS = [
  { value: 'compass', label: 'Explore', icon: Compass },
  { value: 'mountain', label: 'Adventure', icon: Mountain },
  { value: 'waves', label: 'Beach/Water', icon: Waves },
  { value: 'landmark', label: 'Sightseeing', icon: Landmark },
  { value: 'camera', label: 'Photography', icon: Camera },
  { value: 'utensils', label: 'Food & Dining', icon: Utensils },
  { value: 'shopping', label: 'Shopping', icon: ShoppingBag },
  { value: 'music', label: 'Entertainment', icon: Music },
  { value: 'bike', label: 'Sports', icon: Bike },
  { value: 'palmtree', label: 'Relaxation', icon: Palmtree },
];

const CustomActivityForm: React.FC<CustomActivityFormProps> = ({
  onAddActivity,
  displayOrder,
  onClose,
}) => {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('compass');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [price, setPrice] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      return;
    }

    const newActivity: ItineraryDayActivityCreate = {
      activity_id: null, // No library activity
      item_type: 'CUSTOM_ACTIVITY',
      custom_title: title.trim(),
      custom_icon: icon || null,
      custom_payload: {
        location: location || null,
        description: description || null,
      },
      display_order: displayOrder,
      time_slot: null,
      custom_notes: description || null,
      custom_price: price ? parseFloat(price) : null,
      start_time: startTime || null,
      end_time: endTime || null,
      is_locked_by_agency: false,
    };

    onAddActivity(newActivity);

    // Reset form
    setTitle('');
    setLocation('');
    setDescription('');
    setIcon('compass');
    setStartTime('');
    setEndTime('');
    setPrice('');

    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Compass className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h4 className="font-medium text-green-800">Custom Activity</h4>
            <p className="text-sm text-green-600 mt-1">
              Add a one-off activity that's unique to this itinerary.
              Unlike library activities, custom activities won't be saved for reuse.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Activity Name"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Private Cooking Class, Local Market Tour"
          required
        />

        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-muted flex-shrink-0" />
          <Input
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Old Town, Beach Resort"
            className="flex-1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary mb-2">Activity Type</label>
          <div className="grid grid-cols-5 gap-2">
            {ACTIVITY_ICONS.map((opt) => {
              const IconComp = opt.icon;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setIcon(opt.value)}
                  className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                    icon === opt.value
                      ? 'border-green-500 bg-green-50'
                      : 'border-border hover:border-green-300'
                  }`}
                  title={opt.label}
                >
                  <IconComp className={`w-5 h-5 ${icon === opt.value ? 'text-green-600' : 'text-gray-500'}`} />
                  <span className="text-xs truncate w-full text-center">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted flex-shrink-0" />
            <Input
              label="Start Time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted flex-shrink-0" />
            <Input
              label="End Time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-muted flex-shrink-0" />
          <Input
            label="Price (optional)"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            className="flex-1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary mb-1">
            <FileText className="w-4 h-4 inline mr-1" />
            Description / Details
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors text-sm"
            placeholder="Describe the activity, what's included, meeting point, etc."
          />
        </div>

        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={!title.trim()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Custom Activity
        </Button>
      </form>
    </div>
  );
};

export default CustomActivityForm;
