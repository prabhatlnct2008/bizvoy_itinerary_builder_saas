import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Template } from '../../../types';
import Button from '../../../components/ui/Button';
import Chip from '../../../components/ui/Chip';

interface TemplateCardProps {
  template: Template;
  onPublish?: (template: Template) => void;
  onDelete?: (template: Template) => void;
  canDelete?: boolean;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onPublish,
  onDelete,
  canDelete = false,
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
      {/* Card Header */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-primary">{template.name}</h3>
          <Chip
            label={template.status}
            variant={template.status === 'published' ? 'success' : 'warning'}
            size="sm"
          />
        </div>

        <p className="text-sm text-secondary mb-2">{template.destination}</p>

        <div className="flex items-center gap-4 text-sm text-muted mb-4">
          <span>
            {template.duration_nights}N / {template.duration_days}D
          </span>
          {template.approximate_price && <span>${template.approximate_price}</span>}
        </div>

        {template.description && (
          <p className="text-sm text-muted line-clamp-2 mb-4">{template.description}</p>
        )}
      </div>

      {/* Card Actions */}
      <div className="border-t border-border px-6 py-3 bg-gray-50 flex justify-between">
        <Button size="sm" variant="secondary" onClick={() => navigate(`/templates/${template.id}`)}>
          Edit Template
        </Button>

        <div className="flex gap-2">
          {template.status === 'draft' && onPublish && (
            <button
              onClick={() => onPublish(template)}
              className="text-sm text-secondary-500 hover:text-secondary-600 font-medium"
            >
              Publish
            </button>
          )}
          {canDelete && onDelete && (
            <button
              onClick={() => onDelete(template)}
              className="text-sm text-error hover:text-red-600 font-medium"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateCard;
