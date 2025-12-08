import React, { useState, useEffect } from 'react';
import { X, Trash2, Save } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { toast } from 'react-toastify';
import { createVibe, updateVibe, deleteVibe } from '../../api/gamification';

interface Vibe {
  id: string;
  key: string;
  display_name: string;
  emoji: string;
  color: string;
  enabled: boolean;
  is_custom: boolean;
  order: number;
}

interface VibeEditorProps {
  vibe: Vibe | null;
  onClose: () => void;
}

const COMMON_EMOJIS = [
  '🏖️', '🎨', '🍽️', '🎭', '⛰️', '🏛️', '🌊', '🍷',
  '🎵', '🏰', '🌃', '☀️', '🌙', '❄️', '🌸', '🔥',
  '⚡', '✨', '🎪', '🎡', '🎢', '🏕️', '🚁', '🛥️',
];

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e',
];

const VibeEditor: React.FC<VibeEditorProps> = ({ vibe, onClose }) => {
  const [formData, setFormData] = useState({
    key: '',
    display_name: '',
    emoji: '🏖️',
    color: '#3b82f6',
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (vibe) {
      setFormData({
        key: vibe.key,
        display_name: vibe.display_name,
        emoji: vibe.emoji,
        color: vibe.color,
      });
    }
  }, [vibe]);

  const handleSubmit = async () => {
    // Validation
    if (!formData.key.trim()) {
      toast.error('Vibe key is required');
      return;
    }
    if (!formData.display_name.trim()) {
      toast.error('Display name is required');
      return;
    }
    if (!/^[a-z_]+$/.test(formData.key)) {
      toast.error('Vibe key must be lowercase letters and underscores only');
      return;
    }

    try {
      setSaving(true);
      if (vibe) {
        await updateVibe(vibe.id, formData);
        toast.success('Vibe updated successfully');
      } else {
        await createVibe(formData);
        toast.success('Vibe created successfully');
      }
      onClose();
    } catch (error: any) {
      console.error('Failed to save vibe:', error);
      toast.error(error.response?.data?.detail || 'Failed to save vibe');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!vibe) return;

    try {
      setDeleting(true);
      await deleteVibe(vibe.id);
      toast.success('Vibe deleted successfully');
      onClose();
    } catch (error: any) {
      console.error('Failed to delete vibe:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete vibe');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} maxWidth="max-w-2xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text-primary">
            {vibe ? 'Edit Vibe' : 'Create Custom Vibe'}
          </h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Preview */}
          <div className="flex items-center justify-center gap-4 p-6 bg-gray-50 rounded-lg">
            <div className="text-6xl">{formData.emoji}</div>
            <div
              className="w-16 h-16 rounded-full border-4 border-white shadow-lg"
              style={{ backgroundColor: formData.color }}
            />
            <div className="text-2xl font-semibold text-text-primary">
              {formData.display_name || 'Vibe Name'}
            </div>
          </div>

          {/* Key */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Vibe Key *
            </label>
            <Input
              value={formData.key}
              onChange={(e) =>
                setFormData({ ...formData, key: e.target.value.toLowerCase() })
              }
              placeholder="e.g., adventure, relaxation"
              disabled={!!vibe} // Don't allow editing key for existing vibes
            />
            <p className="mt-1 text-sm text-text-muted">
              Lowercase letters and underscores only. Cannot be changed after creation.
            </p>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Display Name *
            </label>
            <Input
              value={formData.display_name}
              onChange={(e) =>
                setFormData({ ...formData, display_name: e.target.value })
              }
              placeholder="e.g., Adventure, Relaxation"
            />
          </div>

          {/* Emoji Picker */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Emoji
            </label>
            <div className="grid grid-cols-8 gap-2">
              {COMMON_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setFormData({ ...formData, emoji })}
                  className={`text-3xl p-2 rounded-lg hover:bg-gray-100 transition-colors ${
                    formData.emoji === emoji ? 'bg-primary-100 ring-2 ring-primary-500' : ''
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div className="mt-2">
              <Input
                value={formData.emoji}
                onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                placeholder="Or enter any emoji"
                maxLength={2}
              />
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Color
            </label>
            <div className="grid grid-cols-9 gap-2 mb-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-10 h-10 rounded-lg transition-transform hover:scale-110 ${
                    formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <Input
              type="text"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              placeholder="#3b82f6"
              pattern="^#[0-9A-Fa-f]{6}$"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <div>
            {vibe && vibe.is_custom && (
              <>
                {showDeleteConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text-secondary">Are you sure?</span>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={handleDelete}
                      disabled={deleting}
                    >
                      {deleting ? 'Deleting...' : 'Yes, Delete'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="danger"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Vibe
                  </Button>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
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
                  {vibe ? 'Save Changes' : 'Create Vibe'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default VibeEditor;
