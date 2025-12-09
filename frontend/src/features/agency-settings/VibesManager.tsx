import React, { useState, useEffect } from 'react';
import { GripVertical, Plus, Edit2, Power } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { toast } from 'react-toastify';
import { getAgencyVibes, updateVibe, reorderVibes } from '../../api/gamification';
import VibeEditor from './VibeEditor';

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

const VibesManager: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [vibes, setVibes] = useState<Vibe[]>([]);
  const [editingVibe, setEditingVibe] = useState<Vibe | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  useEffect(() => {
    loadVibes();
  }, []);

  const loadVibes = async () => {
    try {
      setLoading(true);
      const data = await getAgencyVibes();
      setVibes(data);
    } catch (error) {
      console.error('Failed to load vibes:', error);
      toast.error('Failed to load vibes');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnabled = async (vibe: Vibe) => {
    try {
      await updateVibe(vibe.id, { ...vibe, enabled: !vibe.enabled });
      setVibes(
        vibes.map((v) =>
          v.id === vibe.id ? { ...v, enabled: !v.enabled } : v
        )
      );
      toast.success(`${vibe.display_name} ${!vibe.enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Failed to update vibe:', error);
      toast.error('Failed to update vibe');
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
    setDropTargetIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    // Only track the drop target visually - don't reorder yet
    if (draggedIndex !== null && draggedIndex !== index) {
      setDropTargetIndex(index);
    }
  };

  const handleDragEnd = async () => {
    // Perform the reorder only when drag ends
    if (draggedIndex !== null && dropTargetIndex !== null && draggedIndex !== dropTargetIndex) {
      const newVibes = [...vibes];
      const draggedVibe = newVibes[draggedIndex];
      newVibes.splice(draggedIndex, 1);
      newVibes.splice(dropTargetIndex, 0, draggedVibe);

      setVibes(newVibes);

      try {
        const vibeIds = newVibes.map((v) => v.id);
        await reorderVibes(vibeIds);
        toast.success('Vibe order updated');
      } catch (error) {
        console.error('Failed to reorder vibes:', error);
        toast.error('Failed to reorder vibes');
        loadVibes(); // Reload to reset order
      }
    }
    setDraggedIndex(null);
    setDropTargetIndex(null);
  };

  const handleAddVibe = () => {
    setEditingVibe(null);
    setShowEditor(true);
  };

  const handleEditVibe = (vibe: Vibe) => {
    setEditingVibe(vibe);
    setShowEditor(true);
  };

  const handleEditorClose = () => {
    setShowEditor(false);
    setEditingVibe(null);
    loadVibes();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-text-secondary">Loading vibes...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Manage Vibes
          </h1>
          <p className="text-text-secondary">
            Customize the vibe tags used in your discovery engine
          </p>
        </div>
        <Button onClick={handleAddVibe} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Custom Vibe
        </Button>
      </div>

      <Card>
        <div className="space-y-2">
          {vibes.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              No vibes configured yet
            </div>
          ) : (
            vibes.map((vibe, index) => (
              <div
                key={vibe.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors ${
                  draggedIndex === index ? 'opacity-50' : ''
                } ${
                  dropTargetIndex === index ? 'ring-2 ring-primary-400 ring-offset-2' : ''
                }`}
              >
                {/* Drag Handle */}
                <div className="cursor-move text-text-muted">
                  <GripVertical className="w-5 h-5" />
                </div>

                {/* Emoji and Color */}
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{vibe.emoji}</div>
                  <div
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: vibe.color }}
                  />
                </div>

                {/* Name and Key */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-text-primary">
                      {vibe.display_name}
                    </div>
                    {vibe.is_custom && (
                      <Badge variant="primary" size="sm">
                        Custom
                      </Badge>
                    )}
                    {!vibe.enabled && (
                      <Badge variant="default" size="sm">
                        Disabled
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-text-muted">{vibe.key}</div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleEnabled(vibe)}
                    className={`p-2 rounded-lg transition-colors ${
                      vibe.enabled
                        ? 'text-green-600 hover:bg-green-50'
                        : 'text-gray-400 hover:bg-gray-200'
                    }`}
                    title={vibe.enabled ? 'Disable' : 'Enable'}
                  >
                    <Power className="w-5 h-5" />
                  </button>

                  {vibe.is_custom && (
                    <button
                      onClick={() => handleEditVibe(vibe)}
                      className="p-2 text-text-secondary hover:bg-gray-200 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-sm text-blue-800">
          <strong>Tip:</strong> Drag vibes to reorder them. The order determines how
          they appear in the discovery engine. Disabled vibes won't be shown to
          travelers but can be re-enabled later.
        </div>
      </div>

      {showEditor && (
        <VibeEditor vibe={editingVibe} onClose={handleEditorClose} />
      )}
    </div>
  );
};

export default VibesManager;
