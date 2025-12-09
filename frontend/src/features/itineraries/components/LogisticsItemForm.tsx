import React, { useState } from 'react';
import { ItineraryDayActivityCreate, ItemType } from '../../../types';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import {
  Hotel,
  Car,
  Plane,
  FileText,
  Coffee,
  Utensils,
  Ship,
  Train,
  Bus,
  Plus,
  StickyNote
} from 'lucide-react';

interface LogisticsItemFormProps {
  onAddItem: (item: ItineraryDayActivityCreate) => void;
  displayOrder: number;
}

const ICON_OPTIONS = [
  { value: 'hotel', label: 'Hotel', icon: Hotel },
  { value: 'taxi', label: 'Taxi / Car', icon: Car },
  { value: 'plane', label: 'Flight', icon: Plane },
  { value: 'train', label: 'Train', icon: Train },
  { value: 'bus', label: 'Bus / Transfer', icon: Bus },
  { value: 'ship', label: 'Ship / Cruise', icon: Ship },
  { value: 'meal', label: 'Meal / Dining', icon: Utensils },
  { value: 'coffee', label: 'Coffee / Break', icon: Coffee },
  { value: 'note', label: 'Note', icon: FileText },
];

const QUICK_ADD_ITEMS = [
  { title: 'Hotel Check-in', icon: 'hotel', type: 'LOGISTICS' as ItemType },
  { title: 'Hotel Check-out', icon: 'hotel', type: 'LOGISTICS' as ItemType },
  { title: 'Airport Transfer', icon: 'taxi', type: 'LOGISTICS' as ItemType },
  { title: 'Flight', icon: 'plane', type: 'LOGISTICS' as ItemType },
  { title: 'Breakfast', icon: 'meal', type: 'LOGISTICS' as ItemType },
  { title: 'Lunch', icon: 'meal', type: 'LOGISTICS' as ItemType },
  { title: 'Dinner', icon: 'meal', type: 'LOGISTICS' as ItemType },
  { title: 'Free Time', icon: 'coffee', type: 'NOTE' as ItemType },
];

const LogisticsItemForm: React.FC<LogisticsItemFormProps> = ({
  onAddItem,
  displayOrder,
}) => {
  const [itemType, setItemType] = useState<ItemType>('LOGISTICS');
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      return;
    }

    const newItem: ItineraryDayActivityCreate = {
      activity_id: null, // No library activity
      item_type: itemType,
      custom_title: title.trim(),
      custom_icon: icon || null,
      display_order: displayOrder,
      time_slot: null,
      custom_notes: notes || null,
      start_time: startTime || null,
      end_time: endTime || null,
      custom_price: null,
      is_locked_by_agency: false,
    };

    onAddItem(newItem);

    // Reset form
    setTitle('');
    setIcon('');
    setStartTime('');
    setEndTime('');
    setNotes('');
  };

  const handleQuickAdd = (item: typeof QUICK_ADD_ITEMS[0]) => {
    const newItem: ItineraryDayActivityCreate = {
      activity_id: null,
      item_type: item.type,
      custom_title: item.title,
      custom_icon: item.icon,
      display_order: displayOrder,
      time_slot: null,
      custom_notes: null,
      start_time: null,
      end_time: null,
      custom_price: null,
      is_locked_by_agency: false,
    };

    onAddItem(newItem);
  };

  return (
    <div className="space-y-6">
      {/* Quick Add Buttons */}
      <div>
        <h4 className="text-sm font-medium text-secondary mb-3">Quick Add</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {QUICK_ADD_ITEMS.map((item) => {
            const IconComponent = ICON_OPTIONS.find(opt => opt.value === item.icon)?.icon || FileText;
            return (
              <button
                key={item.title}
                onClick={() => handleQuickAdd(item)}
                className="flex items-center gap-2 p-3 text-left text-sm bg-white border border-border rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all group"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  item.type === 'LOGISTICS' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                } group-hover:scale-110 transition-transform`}>
                  <IconComponent className="w-4 h-4" />
                </div>
                <span className="truncate">{item.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h4 className="text-sm font-medium text-secondary mb-3">Custom Item</h4>

        {/* Item Type Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setItemType('LOGISTICS')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              itemType === 'LOGISTICS'
                ? 'bg-amber-100 text-amber-700 border-2 border-amber-300'
                : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Car className="w-4 h-4" />
              Logistics
            </div>
            <p className="text-xs mt-1 opacity-75">Transfers, check-ins, meals</p>
          </button>
          <button
            type="button"
            onClick={() => setItemType('NOTE')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              itemType === 'NOTE'
                ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <StickyNote className="w-4 h-4" />
              Note
            </div>
            <p className="text-xs mt-1 opacity-75">Free time, reminders, tips</p>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={itemType === 'LOGISTICS' ? 'e.g., Airport Pickup' : 'e.g., Free time to explore'}
            required
          />

          <div>
            <label className="block text-sm font-medium text-secondary mb-2">Icon</label>
            <div className="grid grid-cols-5 gap-2">
              {ICON_OPTIONS.map((opt) => {
                const IconComp = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setIcon(icon === opt.value ? '' : opt.value)}
                    className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                      icon === opt.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-border hover:border-primary-300'
                    }`}
                    title={opt.label}
                  >
                    <IconComp className="w-5 h-5" />
                    <span className="text-xs truncate w-full text-center">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
            <Input
              label="End Time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-1">
              Notes / Details
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors text-sm"
              placeholder="Optional details..."
            />
          </div>

          <Button type="submit" className="w-full" disabled={!title.trim()}>
            <Plus className="w-4 h-4 mr-2" />
            Add {itemType === 'LOGISTICS' ? 'Logistics Item' : 'Note'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default LogisticsItemForm;
