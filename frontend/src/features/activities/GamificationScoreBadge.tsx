import React, { useState } from 'react';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface Activity {
  hero_image_url?: string;
  price?: number | null;
  short_description?: string;
  location_display?: string;
  vibe_tags?: string[];
  marketing_badge?: string | null;
  optimal_time_of_day?: string | null;
  review_count?: number;
}

interface GamificationScoreBadgeProps {
  activity: Activity;
  showTooltip?: boolean;
}

const GamificationScoreBadge: React.FC<GamificationScoreBadgeProps> = ({
  activity,
  showTooltip = true,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Calculate score
  const calculateScore = (): number => {
    let score = 0;

    // Required fields (higher weight)
    if (activity.hero_image_url) score += 20;
    if (activity.price !== null && activity.price !== undefined) score += 15;
    if (activity.short_description) score += 15;
    if (activity.location_display) score += 10;

    // Gamification enhancements
    if (activity.vibe_tags && activity.vibe_tags.length > 0) score += 15;
    if (activity.marketing_badge) score += 10;
    if (activity.optimal_time_of_day) score += 10;

    // Additional quality indicators
    if (activity.review_count && activity.review_count > 0) score += 5;

    return Math.min(score, 100);
  };

  // Get issues list
  const getIssues = (): string[] => {
    const issues: string[] = [];

    if (!activity.hero_image_url) issues.push('Missing hero image');
    if (activity.price === null || activity.price === undefined)
      issues.push('Missing price');
    if (!activity.vibe_tags || activity.vibe_tags.length === 0)
      issues.push('Missing vibe tags');
    if (!activity.short_description) issues.push('Missing description');
    if (!activity.location_display) issues.push('Missing location');
    if (!activity.optimal_time_of_day) issues.push('Missing optimal time');

    return issues;
  };

  const score = calculateScore();
  const issues = getIssues();
  const isReady = score >= 70;
  const isPartial = score >= 40 && score < 70;
  const isNotReady = score < 40;

  // Color classes
  const getColorClasses = () => {
    if (isReady) return 'bg-green-100 text-green-700 border-green-300';
    if (isPartial) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    return 'bg-red-100 text-red-700 border-red-300';
  };

  const getIcon = () => {
    if (isReady) return <CheckCircle className="w-4 h-4" />;
    if (isPartial) return <AlertCircle className="w-4 h-4" />;
    return <XCircle className="w-4 h-4" />;
  };

  const getLabel = () => {
    if (isReady) return 'Game Ready';
    if (isPartial) return 'Partial';
    return 'Not Ready';
  };

  return (
    <div className="relative inline-block">
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border-2 ${getColorClasses()} cursor-pointer transition-all hover:shadow-md`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {getIcon()}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{score}%</span>
          <span className="text-xs font-medium">{getLabel()}</span>
        </div>
      </div>

      {/* Tooltip */}
      {showTooltip && isHovered && (
        <div className="absolute z-50 w-64 p-3 bg-white border border-border rounded-lg shadow-xl top-full mt-2 right-0">
          <div className="mb-2">
            <div className="text-sm font-semibold text-text-primary mb-1">
              Gamification Score: {score}%
            </div>
            <div className="text-xs text-text-secondary">
              Score 70%+ for optimal discovery engine performance
            </div>
          </div>

          {issues.length > 0 ? (
            <>
              <div className="text-xs font-medium text-text-primary mb-1 pt-2 border-t border-border">
                Issues to Fix:
              </div>
              <ul className="space-y-1">
                {issues.map((issue, index) => (
                  <li
                    key={index}
                    className="text-xs text-text-secondary flex items-start gap-1"
                  >
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="text-xs text-green-600 pt-2 border-t border-border">
              All requirements met!
            </div>
          )}

          {/* Score breakdown hint */}
          <div className="mt-2 pt-2 border-t border-border text-xs text-text-muted">
            <div className="font-medium mb-1">Score Breakdown:</div>
            <div className="space-y-0.5">
              <div>• Hero Image: 20pts</div>
              <div>• Price: 15pts</div>
              <div>• Description: 15pts</div>
              <div>• Vibe Tags: 15pts</div>
              <div>• Location: 10pts</div>
              <div>• Marketing Badge: 10pts</div>
              <div>• Optimal Time: 10pts</div>
              <div>• Reviews: 5pts</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamificationScoreBadge;
