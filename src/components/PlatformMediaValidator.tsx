import React from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import { MediaFile, PlatformAccount } from '../types/platform';
import { validateMediaForPlatform, PLATFORM_LIMITS } from '../utils/mediaUtils';

interface PlatformMediaValidatorProps {
  media: MediaFile[];
  selectedPlatforms: PlatformAccount[];
}

export const PlatformMediaValidator: React.FC<PlatformMediaValidatorProps> = ({
  media,
  selectedPlatforms
}) => {
  if (media.length === 0 || selectedPlatforms.length === 0) {
    return null;
  }

  const validationResults = selectedPlatforms.map(account => ({
    account,
    errors: validateMediaForPlatform(media, account.platformId),
    limits: PLATFORM_LIMITS[account.platformId]
  }));

  const hasErrors = validationResults.some(result => result.errors.length > 0);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <Info size={16} />
        Platform Compatibility Check
      </h4>

      <div className="space-y-2">
        {validationResults.map(({ account, errors, limits }) => (
          <div
            key={account.id}
            className={`p-3 rounded-lg border ${
              errors.length > 0
                ? 'border-red-200 bg-red-50'
                : 'border-green-200 bg-green-50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {account.platformId === 'facebook' && '📘'}
                  {account.platformId === 'instagram' && '📷'}
                  {account.platformId === 'youtube' && '📺'}
                  {account.platformId === 'twitter' && '🐦'}
                  {account.platformId === 'linkedin' && '💼'}
                  {account.platformId === 'tiktok' && '🎵'}
                </span>
                <div>
                  <span className="font-medium text-gray-900">{account.accountName}</span>
                  <div className="text-xs text-gray-500">{account.platformName}</div>
                </div>
                {errors.length === 0 ? (
                  <CheckCircle className="text-green-500" size={16} />
                ) : (
                  <AlertCircle className="text-red-500" size={16} />
                )}
              </div>
            </div>

            {errors.length > 0 ? (
              <div className="space-y-1">
                {errors.map((error, index) => (
                  <p key={index} className="text-sm text-red-600 flex items-start gap-1">
                    <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                    {error}
                  </p>
                ))}
              </div>
            ) : (
              <div className="text-sm text-green-600">
                ✓ All media files are compatible with {account.accountName}
              </div>
            )}

            {/* Platform Limits Info */}
            {limits && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>Max Images: {limits.maxImages}</div>
                  <div>Max Videos: {limits.maxVideos}</div>
                  <div>Max Image Size: {limits.maxImageSize}MB</div>
                  <div>Max Video Size: {limits.maxVideoSize}MB</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {hasErrors && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={16} />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Media Compatibility Issues</p>
              <p>
                Some of your media files don't meet the requirements for certain accounts. 
                You can still post, but those accounts will be skipped.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};