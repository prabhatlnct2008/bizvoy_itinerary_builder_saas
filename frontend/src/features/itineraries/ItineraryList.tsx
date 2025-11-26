import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Chip from '../../components/ui/Chip';
import Input from '../../components/ui/Input';
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
      <div className="p-6 text-center text-muted">
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
      header: 'Trip Name',
      width: '25%',
    },
    {
      key: 'client_name',
      header: 'Client',
    },
    {
      key: 'destination',
      header: 'Destination',
    },
    {
      key: 'start_date',
      header: 'Dates',
      render: (itin: Itinerary) => (
        <span className="text-muted text-sm">
          {new Date(itin.start_date).toLocaleDateString()} -{' '}
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
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/itineraries/${itin.id}`);
            }}
            className="text-primary-600 hover:text-primary-500 text-sm font-medium"
          >
            Edit
          </button>
          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(itin);
              }}
              className="text-error hover:text-red-600 text-sm font-medium"
            >
              Delete
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="px-4 py-6 md:px-6 md:py-6 bg-background min-h-screen">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">Itineraries</h1>
            <p className="text-text-muted mt-1">Manage client itineraries</p>
          </div>
          {canCreate && (
            <Button onClick={() => navigate('/itineraries/new')} className="self-start md:self-auto">
              Create Itinerary
            </Button>
          )}
        </div>

        <div className="bg-white border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search itineraries by trip, client, destination..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 md:w-1/3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
          <Table
            data={filteredItineraries}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No itineraries found. Create your first itinerary to get started."
            onRowClick={(itin) => navigate(`/itineraries/${itin.id}`)}
          />
        </div>
      </div>
    </div>
  );
};

export default ItineraryList;
