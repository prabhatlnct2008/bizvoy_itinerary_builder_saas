import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import templatesApi from '../../api/templates';
import { Template } from '../../types';

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
      <div className="max-w-6xl mx-auto px-5 py-6 text-center text-slate-500">
        You don't have permission to view templates.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-5 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Templates</h1>
        {canCreate && (
          <button
            onClick={() => navigate('/templates/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg font-medium"
          >
            Create template
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="inline-flex rounded-full bg-slate-100 p-1 text-xs">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-3 py-1 rounded-full transition-colors ${
            filterStatus === 'all'
              ? 'bg-white shadow border border-slate-200 text-slate-900'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterStatus('draft')}
          className={`px-3 py-1 rounded-full transition-colors ${
            filterStatus === 'draft'
              ? 'bg-white shadow border border-slate-200 text-slate-900'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Drafts
        </button>
        <button
          onClick={() => setFilterStatus('published')}
          className={`px-3 py-1 rounded-full transition-colors ${
            filterStatus === 'published'
              ? 'bg-white shadow border border-slate-200 text-slate-900'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Published
        </button>
      </div>

      {/* Cards */}
      {templates.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <p className="text-sm text-slate-500">No templates found. Create your first template to get started.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {templates.map((template) => (
            <article
              key={template.id}
              className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between"
            >
              <div>
                <h2 className="text-sm font-semibold text-slate-900">{template.name}</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {template.destination} &bull; {template.duration_nights}N / {template.duration_days}D
                </p>
                {template.description && (
                  <p className="mt-2 text-xs text-slate-500 line-clamp-2">{template.description}</p>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                    template.status === 'published'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {template.status.charAt(0).toUpperCase() + template.status.slice(1)}
                </span>
                <div className="flex items-center gap-3">
                  {template.status === 'draft' && (
                    <button
                      onClick={() => handlePublish(template)}
                      className="text-xs text-slate-500 hover:text-emerald-600"
                    >
                      Publish
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/templates/${template.id}`)}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Edit
                  </button>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(template)}
                      className="text-xs text-slate-500 hover:text-red-600"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default TemplateList;
