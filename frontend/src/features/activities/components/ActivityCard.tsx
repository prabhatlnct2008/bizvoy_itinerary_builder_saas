import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import { ActivityListItem } from '../../../types/activity';

interface ActivityCardProps {
  activity: ActivityListItem;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ activity }) => {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const handleClick = () => {
    navigate(`/activities/${activity.id}`);
  };

  return (
    <div onClick={handleClick}>
      <Card
        padding={false}
        className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
      >
      {/* Hero Image */}
      <div className="relative h-48 bg-gray-200">
        {activity.hero_image_url ? (
          <img
            src={`${API_URL}${activity.hero_image_url}`}
            alt={activity.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg
              className="w-16 h-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          <Badge variant={activity.is_active ? 'success' : 'default'}>
            {activity.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Activity Type */}
        {activity.activity_type_name && (
          <div className="mb-2">
            <Badge variant="primary" size="sm">
              {activity.activity_type_name}
            </Badge>
          </div>
        )}

        {/* Name */}
        <h3 className="text-lg font-semibold text-text-primary mb-2 line-clamp-1">
          {activity.name}
        </h3>

        {/* Category & Location */}
        <div className="space-y-1 mb-3">
          {activity.category_label && (
            <div className="flex items-center text-sm text-text-secondary">
              <Clock className="w-4 h-4 mr-1" />
              <span className="line-clamp-1">{activity.category_label}</span>
            </div>
          )}
          {activity.location_display && (
            <div className="flex items-center text-sm text-text-secondary">
              <MapPin className="w-4 h-4 mr-1" />
              <span className="line-clamp-1">{activity.location_display}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {activity.short_description && (
          <p className="text-sm text-text-secondary line-clamp-2 mb-3">
            {activity.short_description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <span className="text-xs text-text-muted">
            Updated {new Date(activity.updated_at).toLocaleDateString()}
          </span>
        </div>
      </div>
      </Card>
    </div>
  );
};

export default ActivityCard;
