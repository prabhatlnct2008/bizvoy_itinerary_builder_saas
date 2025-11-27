import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import templatesApi from '../../api/templates';
import { TemplateListItem, TemplateStatus } from '../../types';
import {
  Search,
  Plus,
  MoreVertical,
  Eye,
  Copy,
  FileText,
  Archive,
  RotateCcw,
  Trash2,
} from 'lucide-react';

type StatusFilter = 'all' | 'draft' | 'published' | 'archived';

const TemplateList: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { hasPermission } = usePermissions();

  const canView = hasPermission('templates.view');
  const canCreate = hasPermission('templates.create');
  const canEdit = hasPermission('templates.edit');
  const canDelete = hasPermission('templates.delete');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: { status?: string; search?: string } = {};

      // For "all" filter, we don't pass status (backend excludes archived by default)
      // To see all including archived, we'd need a different approach
      // Let's treat "all" as showing draft + published (non-archived)
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }

      if (debouncedSearch) {
        params.search = debouncedSearch;
      }

      const data = await templatesApi.getTemplates(params);
      setTemplates(data);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus, debouncedSearch]);

  useEffect(() => {
    if (canView) {
      fetchTemplates();
    }
  }, [canView, fetchTemplates]);

  const handleArchive = async (template: TemplateListItem) => {
    const activityCount = 0; // We don't have this info in list, could be enhanced
    if (
      !window.confirm(
        `Archive template "${template.name}"?\n\nIt won't be available for new itineraries, but existing itineraries are unaffected.`
      )
    ) {
      return;
    }

    try {
      await templatesApi.archiveTemplate(template.id);
      toast.success('Template archived successfully');
      fetchTemplates();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to archive template');
    }
    setOpenMenuId(null);
  };

  const handleUnarchive = async (template: TemplateListItem) => {
    try {
      await templatesApi.unarchiveTemplate(template.id);
      toast.success('Template restored successfully');
      fetchTemplates();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to restore template');
    }
    setOpenMenuId(null);
  };

  const handleCopy = async (template: TemplateListItem) => {
    try {
      setIsCopying(template.id);
      const newTemplate = await templatesApi.copyTemplate(template.id);
      toast.success(`Template copied as "${newTemplate.name}"`);
      navigate(`/templates/${newTemplate.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to copy template');
    } finally {
      setIsCopying(null);
    }
    setOpenMenuId(null);
  };

  const handleCreateItinerary = (template: TemplateListItem) => {
    navigate(`/itineraries/new?templateId=${template.id}`);
    setOpenMenuId(null);
  };

  const handlePublish = async (template: TemplateListItem) => {
    try {
      await templatesApi.publishTemplate(template.id);
      toast.success('Template published successfully');
      fetchTemplates();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to publish template');
    }
    setOpenMenuId(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: TemplateStatus) => {
    const styles = {
      draft: 'bg-slate-100 text-slate-700',
      published: 'bg-emerald-100 text-emerald-700',
      archived: 'bg-amber-100 text-amber-700',
    };
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (!canView) {
    return (
      <div className="max-w-6xl mx-auto px-5 py-6 text-center text-slate-500">
        You don't have permission to view templates.
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
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg font-medium inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Template
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by template name or destination..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Status Filter */}
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-xs">
          {(['all', 'draft', 'published', 'archived'] as StatusFilter[]).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                filterStatus === status
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <p className="text-sm text-slate-500">
            {debouncedSearch
              ? 'No templates match your search.'
              : filterStatus === 'archived'
              ? 'No archived templates.'
              : 'No templates found. Create your first template to get started.'}
          </p>
        </div>
      ) : (
        /* Table */
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                    Template Name
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                    Destination
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                    Duration
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                    Last Updated
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                    Used In
                  </th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {templates.map((template) => (
                  <tr key={template.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/templates/${template.id}`)}
                        className="text-sm font-medium text-slate-900 hover:text-blue-600 text-left"
                      >
                        {template.name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{template.destination}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {template.duration_days} days / {template.duration_nights} nights
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(template.status)}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {formatDate(template.updated_at)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {template.usage_count} {template.usage_count === 1 ? 'itinerary' : 'itineraries'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-block" ref={openMenuId === template.id ? menuRef : null}>
                        <button
                          onClick={() => setOpenMenuId(openMenuId === template.id ? null : template.id)}
                          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>

                        {openMenuId === template.id && (
                          <div className="absolute right-0 mt-1 w-52 bg-white border border-slate-200 rounded-lg shadow-lg z-10 py-1">
                            <button
                              onClick={() => {
                                navigate(`/templates/${template.id}`);
                                setOpenMenuId(null);
                              }}
                              className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                            >
                              <Eye className="w-5 h-5" />
                              View / Edit
                            </button>

                            {canCreate && (
                              <button
                                onClick={() => handleCopy(template)}
                                disabled={isCopying === template.id}
                                className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 disabled:opacity-50"
                              >
                                <Copy className="w-5 h-5" />
                                {isCopying === template.id ? 'Copying...' : 'Copy'}
                              </button>
                            )}

                            {template.status === 'published' && (
                              <button
                                onClick={() => handleCreateItinerary(template)}
                                className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                              >
                                <FileText className="w-5 h-5" />
                                Create Itinerary
                              </button>
                            )}

                            {template.status === 'draft' && canEdit && (
                              <button
                                onClick={() => handlePublish(template)}
                                className="w-full px-4 py-2.5 text-left text-sm text-emerald-600 hover:bg-slate-50 flex items-center gap-3"
                              >
                                <FileText className="w-5 h-5" />
                                Publish
                              </button>
                            )}

                            <hr className="my-1 border-slate-100" />

                            {template.status === 'archived' ? (
                              canEdit && (
                                <button
                                  onClick={() => handleUnarchive(template)}
                                  className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                                >
                                  <RotateCcw className="w-5 h-5" />
                                  Restore
                                </button>
                              )
                            ) : (
                              canDelete && (
                                <button
                                  onClick={() => handleArchive(template)}
                                  className="w-full px-4 py-2.5 text-left text-sm text-amber-600 hover:bg-slate-50 flex items-center gap-3"
                                >
                                  <Archive className="w-5 h-5" />
                                  Archive
                                </button>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateList;
