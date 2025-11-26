import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import shareApi from '../../api/share';
import { ShareLink, PDFExport } from '../../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  itineraryId: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, itineraryId }) => {
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  const [pdfExport, setPdfExport] = useState<PDFExport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [liveUpdatesEnabled, setLiveUpdatesEnabled] = useState(false);

  useEffect(() => {
    if (isOpen && itineraryId) {
      generateShareLink();
    }
  }, [isOpen, itineraryId]);

  const generateShareLink = async () => {
    try {
      setIsLoading(true);
      const link = await shareApi.createShareLink(itineraryId, {
        is_active: true,
        live_updates_enabled: false,
      });
      setShareLink(link);
      setLiveUpdatesEnabled(link.live_updates_enabled);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to generate share link');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLiveUpdates = async () => {
    if (!shareLink) return;

    try {
      const updated = await shareApi.updateShareLink(shareLink.id, {
        live_updates_enabled: !liveUpdatesEnabled,
      });
      setShareLink(updated);
      setLiveUpdatesEnabled(updated.live_updates_enabled);
      toast.success(
        updated.live_updates_enabled
          ? 'Live updates enabled'
          : 'Live updates disabled'
      );
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update settings');
    }
  };

  const copyShareLink = () => {
    if (!shareLink) return;

    const fullUrl = `${window.location.origin}/itinerary/${shareLink.token}`;

    navigator.clipboard.writeText(fullUrl);
    toast.success('Link copied to clipboard!');
  };

  const generatePDF = async () => {
    try {
      setIsGeneratingPDF(true);
      const pdf = await shareApi.exportPDF(itineraryId);
      setPdfExport(pdf);
      toast.success('PDF generated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to generate PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const downloadPDF = () => {
    if (!pdfExport) return;

    shareApi
      .downloadPDF(itineraryId, pdfExport.id)
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `itinerary_${itineraryId}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch((error: any) => {
        toast.error(error.response?.data?.detail || 'Failed to download PDF');
      });
  };

  const getShareUrl = () => {
    if (!shareLink) return '';
    return `${window.location.origin}/itinerary/${shareLink.token}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share & Export Itinerary"
      size="lg"
    >
      <div className="space-y-6">
        {/* Share Link Section */}
        <div>
          <h3 className="text-lg font-semibold text-primary mb-3">Shareable Link</h3>

          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            </div>
          ) : shareLink ? (
            <div className="space-y-3">
              {/* Share URL */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={getShareUrl()}
                  readOnly
                  className="flex-1 px-4 py-2 border border-border rounded-lg bg-gray-50 text-sm"
                />
                <Button onClick={copyShareLink}>Copy Link</Button>
              </div>

              {/* Share Link Stats */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-muted">Views</p>
                  <p className="text-lg font-semibold text-primary">{shareLink.view_count}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Last Viewed</p>
                  <p className="text-sm text-secondary">
                    {shareLink.last_viewed_at
                      ? new Date(shareLink.last_viewed_at).toLocaleString()
                      : 'Never'}
                  </p>
                </div>
              </div>

              {/* Live Updates Toggle */}
              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-primary">Live Updates</h4>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                        liveUpdatesEnabled
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {liveUpdatesEnabled ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <p className="text-sm text-secondary">
                    When enabled, clients see changes in real-time without refreshing
                  </p>
                </div>
                <button
                  onClick={toggleLiveUpdates}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    liveUpdatesEnabled ? 'bg-primary-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      liveUpdatesEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Expiry (Optional - future enhancement) */}
              {shareLink.expires_at && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-secondary">
                    <span className="font-medium">Expires:</span>{' '}
                    {new Date(shareLink.expires_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-muted">
              <p>Failed to generate share link</p>
              <Button onClick={generateShareLink} className="mt-3" size="sm">
                Retry
              </Button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-border"></div>

        {/* PDF Export Section */}
        <div>
          <h3 className="text-lg font-semibold text-primary mb-3">PDF Export</h3>

          <div className="space-y-3">
            <p className="text-sm text-secondary">
              Generate a PDF version of this itinerary for printing or offline viewing.
            </p>

            {pdfExport && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary mb-1">PDF Ready</p>
                    <p className="text-xs text-muted">
                      Generated {new Date(pdfExport.generated_at).toLocaleString()}
                    </p>
                  </div>
                  <Button onClick={downloadPDF} size="sm">
                    Download PDF
                  </Button>
                </div>
              </div>
            )}

            <Button
              onClick={generatePDF}
              isLoading={isGeneratingPDF}
              variant={pdfExport ? 'secondary' : 'primary'}
              className="w-full"
            >
              {pdfExport ? 'Regenerate PDF' : 'Generate PDF'}
            </Button>
          </div>
        </div>

        {/* Help Text */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-semibold text-primary mb-2">💡 Sharing Tips</h4>
          <ul className="text-sm text-secondary space-y-1 list-disc list-inside">
            <li>Share the link with your client via email or messaging app</li>
            <li>Enable "Live Updates" if you're making changes during a call</li>
            <li>PDF is great for clients who prefer offline access</li>
            <li>The share link is public - anyone with the link can view it</li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end pt-4 border-t border-border mt-6">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
};

export default ShareModal;
