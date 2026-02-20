import React, { useEffect, useState } from 'react';
import Modal from '../Modal';
import ActivityLog from './ActivityLog';
import { useAIContentGeneration } from '../../hooks/useAIContentGeneration';

interface BatchGenerateModalProps {
  campaigns: any[];
  currentWorkspace: any;
  onClose: () => void;
  onComplete: (summary: { mastersCount: number; variantsCount: number }) => void;
}

const BatchGenerateModal: React.FC<BatchGenerateModalProps> = ({ campaigns, currentWorkspace, onClose, onComplete }) => {
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('Vietnamese');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [numMasters, setNumMasters] = useState(3);
  const [showActivityLog, setShowActivityLog] = useState(false);

  const { isLoading, events, error, generatedContent, startBatchGeneratingPosts, reset } = useAIContentGeneration();

  const allPlatforms = ['facebook', 'instagram', 'linkedin', 'twitter', 'tiktok', 'youtube', 'blog', 'email'];

  useEffect(() => {
    if (generatedContent?.type === 'done') {
      onComplete({
        mastersCount: generatedContent.mastersCount || 0,
        variantsCount: generatedContent.variantsCount || 0,
      });
    }
  }, [generatedContent, onComplete]);

  const handleTogglePlatform = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
    );
  };

  const handleGenerate = async () => {
    if (!selectedCampaign) {
      alert('Please select a campaign');
      return;
    }
    if (selectedPlatforms.length === 0) {
      alert('Please select at least one platform');
      return;
    }

    setShowActivityLog(true);
    await startBatchGeneratingPosts(
      selectedCampaign,
      selectedPlatforms,
      numMasters,
      currentWorkspace.id,
      selectedLanguage
    );
  };

  return (
    <Modal
      title="Batch Generate Posts"
      onClose={() => {
        reset();
        onClose();
      }}
      footer={
        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Cancel
          </button>
          {!showActivityLog && (
            <button
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              onClick={handleGenerate}
            >
              Generate
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {showActivityLog ? (
          <div className="space-y-4">
            <ActivityLog events={events} isLoading={isLoading} />

            {generatedContent && !isLoading && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4 space-y-2 text-sm">
                <p className="text-green-800 font-medium">Batch generation completed.</p>
                <p className="text-green-700">Master posts: {generatedContent.mastersCount || 0}</p>
                <p className="text-green-700">Variants: {generatedContent.variantsCount || 0}</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-800"><strong>Error:</strong> {error}</p>
                <button
                  className="mt-3 px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50"
                  onClick={() => {
                    reset();
                    setShowActivityLog(false);
                  }}
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campaign</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={selectedCampaign}
                onChange={e => setSelectedCampaign(e.target.value)}
              >
                <option value="">Select a Campaign</option>
                {campaigns.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={selectedLanguage}
                onChange={e => setSelectedLanguage(e.target.value)}
              >
                <option value="Vietnamese">Vietnamese</option>
                <option value="English">English</option>
                <option value="Chinese">Chinese</option>
                <option value="Spanish">Spanish</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Number of Master Posts</label>
              <input
                type="number"
                min={1}
                max={10}
                value={numMasters}
                onChange={e => setNumMasters(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Platforms</label>
              <div className="grid grid-cols-2 gap-3">
                {allPlatforms.map(platform => (
                  <label key={platform} className="flex items-center gap-2 p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-blue-50">
                    <input
                      type="checkbox"
                      checked={selectedPlatforms.includes(platform)}
                      onChange={() => handleTogglePlatform(platform)}
                      className="rounded"
                    />
                    <span className="capitalize text-sm text-gray-700">{platform}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default BatchGenerateModal;
