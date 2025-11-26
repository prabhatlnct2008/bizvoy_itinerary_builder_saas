import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { usePermissions } from '../../hooks/usePermissions';
import templatesApi from '../../api/templates';
import { Template } from '../../types';
import TemplateCard from './components/TemplateCard';

const TemplateList: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'published'>('all');
  const { hasPermission } = usePermissions();

  const canView = hasPermission('templates.view');
  const canCreate = hasPermission('templates.create');
  const canDelete = hasPermission('templates.delete');

  useEffect(() => {
    if (canView) {
      fetchTemplates();
    }
  }, [canView, filterStatus]);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const params = filterStatus !== 'all' ? { status: filterStatus } : undefined;
      const data = await templatesApi.getTemplates(params);
      setTemplates(data);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (template: Template) => {
    if (!window.confirm(`Delete template "${template.name}"?`)) {
      return;
    }

    try {
      await templatesApi.deleteTemplate(template.id);
      toast.success('Template deleted successfully');
      fetchTemplates();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete template');
    }
  };

  const handlePublish = async (template: Template) => {
    try {
      await templatesApi.publishTemplate(template.id);
      toast.success('Template published successfully');
      fetchTemplates();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to publish template');
    }
  };

  if (!canView) {
    return (
      <div className="p-6 text-center text-muted">
        You don't have permission to view templates.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const filteredTemplates = templates;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Templates</h1>
          <p className="text-secondary mt-1">Reusable itinerary templates</p>
        </div>
        {canCreate && (
          <Button onClick={() => navigate('/templates/new')}>Create Template</Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filterStatus === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-primary border border-border hover:bg-gray-50'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterStatus('draft')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filterStatus === 'draft'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-primary border border-border hover:bg-gray-50'
          }`}
        >
          Drafts
        </button>
        <button
          onClick={() => setFilterStatus('published')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filterStatus === 'published'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-primary border border-border hover:bg-gray-50'
          }`}
        >
          Published
        </button>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-muted">No templates found. Create your first template to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onPublish={handlePublish}
              onDelete={handleDelete}
              canDelete={canDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TemplateList;
