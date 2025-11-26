import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Table from '../../components/ui/Table';
import Chip from '../../components/ui/Chip';
import { usePermissions } from '../../hooks/usePermissions';
import itinerariesApi from '../../api/itineraries';
import { Itinerary } from '../../types';

const ItineraryList: React.FC = () => {
  const navigate = useNavigate();
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const { hasPermission } = usePermissions();

  const canView = hasPermission('itineraries.view');
  const canCreate = hasPermission('itineraries.create');
  const canDelete = hasPermission('itineraries.delete');

  useEffect(() => {
    if (canView) {
      fetchItineraries();
    }
  }, [canView, filterStatus]);

  const fetchItineraries = async () => {
    try {
      setIsLoading(true);
      const params = filterStatus ? { status: filterStatus } : undefined;
      const data = await itinerariesApi.getItineraries(params);
      setItineraries(data);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to load itineraries');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (itinerary: Itinerary) => {
    if (!window.confirm(`Delete itinerary "${itinerary.trip_name}"?`)) {
      return;
    }

    try {
      await itinerariesApi.deleteItinerary(itinerary.id);
      toast.success('Itinerary deleted successfully');
      fetchItineraries();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete itinerary');
    }
  };

  if (!canView) {
    return (
      <div className="max-w-6xl mx-auto px-5 py-6 text-center text-slate-500">
        You don't have permission to view itineraries.
      </div>
    );
  }

  const getStatusVariant = (
    status: string
  ): 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'sent':
        return 'primary';
      case 'confirmed':
        return 'success';
      case 'completed':
        return 'info';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const filteredItineraries = itineraries.filter(
    (itin) =>
      itin.trip_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      itin.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      itin.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      key: 'trip_name',
      header: 'Trip name',
      width: '25%',
      render: (itin: Itinerary) => (
        <span className="font-medium text-slate-900">{itin.trip_name}</span>
      ),
    },
    {
      key: 'client_name',
      header: 'Client',
      render: (itin: Itinerary) => (
        <span className="text-slate-700">{itin.client_name}</span>
      ),
    },
    {
      key: 'destination',
      header: 'Destination',
      render: (itin: Itinerary) => (
        <span className="text-slate-700">{itin.destination}</span>
      ),
    },
    {
      key: 'start_date',
      header: 'Dates',
      render: (itin: Itinerary) => (
        <span className="text-slate-700">
          {new Date(itin.start_date).toLocaleDateString()} –{' '}
          {new Date(itin.end_date).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (itin: Itinerary) => (
        <Chip
          label={itin.status.charAt(0).toUpperCase() + itin.status.slice(1)}
          variant={getStatusVariant(itin.status)}
          size="sm"
        />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (itin: Itinerary) => (
        <div className="flex gap-3 justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/itineraries/${itin.id}`);
            }}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            Edit
          </button>
          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(itin);
              }}
              className="text-xs text-slate-500 hover:text-red-600"
            >
              Delete
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-5 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Itineraries</h1>
          <p className="text-sm text-slate-500">Manage client itineraries.</p>
        </div>
        {canCreate && (
          <button
            onClick={() => navigate('/itineraries/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg font-medium"
          >
            Create itinerary
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-3 flex flex-wrap gap-3 items-center">
        <input
          className="flex-1 min-w-[200px] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Search by trip name, client, or destination..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <Table
          data={filteredItineraries}
          columns={columns}
          isLoading={isLoading}
          emptyMessage="No itineraries found. Create your first itinerary to get started."
          onRowClick={(itin) => navigate(`/itineraries/${itin.id}`)}
        />
      </div>
    </div>
  );
};

export default ItineraryList;
