import React, { useState } from 'react';
import Modal from '../Modal';
import ActivityLog from './ActivityLog';
import { useAIContentGeneration } from '../../hooks/useAIContentGeneration';

interface MasterContentModalProps {
  form: any;
  campaigns: any[];
  currentWorkspace: any;
}

const MasterContentModal: React.FC<MasterContentModalProps> = ({ form, campaigns, currentWorkspace }) => {
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('Vietnamese');
  const [selectedVersion, setSelectedVersion] = useState<'core' | 'extended'>('core');
  const { isLoading, events, error, generatedContent, startGeneratingMasterContent, reset } = useAIContentGeneration();

  const handleGenerateAI = async () => {
    if (!form.mcForm.campaign_id) {
      alert('Please select a campaign first');
      return;
    }

    setShowActivityLog(true);
    await startGeneratingMasterContent(form.mcForm.campaign_id, currentWorkspace.id, selectedLanguage);
  };

  const handleUseGeneratedContent = () => {
    if (generatedContent?.masterContent) {
      const selectedMessage = selectedVersion === 'core' 
        ? generatedContent.masterContent.core_message 
        : generatedContent.masterContent.extended_message || generatedContent.masterContent.core_message;
      
      form.setMcForm({
        ...form.mcForm,
        core_message: selectedMessage || '',
      });
      setShowActivityLog(false);
      reset();
    }
  };

  return (
    <Modal
      title={form.mcModal === 'create' ? 'Create Content' : 'Edit Content'}
      onClose={() => form.setMcModal(null)}
      footer={
        <div className="flex justify-end gap-3">
          <button 
            className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors" 
            onClick={() => form.setMcModal(null)}
          >
            Cancel
          </button>
          <button 
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600/80 rounded-lg hover:bg-blue-500 shadow-lg transition-colors" 
            onClick={() => form.handleSaveMc(currentWorkspace.id)}
          >
            Save
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {showActivityLog ? (
          <div className="space-y-4">
            <ActivityLog events={events} isLoading={isLoading} />
            
            {generatedContent && !isLoading && (
              <div className="glass-panel border-blue-500/30 rounded-md p-4 space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-blue-300 mb-3">Generated Content Preview</h4>
                  
                  {/* Version Toggle */}
                  <div className="flex gap-2 mb-3">
                    <button
                      className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        selectedVersion === 'core'
                          ? 'bg-blue-600/80 text-white'
                          : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
                      }`}
                      onClick={() => setSelectedVersion('core')}
                    >
                      Core Message
                    </button>
                    <button
                      className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        selectedVersion === 'extended'
                          ? 'bg-blue-600/80 text-white'
                          : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
                      }`}
                      onClick={() => setSelectedVersion('extended')}
                      disabled={!generatedContent.masterContent?.extended_message}
                    >
                      Extended Message
                    </button>
                  </div>
                  
                  {/* Content Preview */}
                  <div className="bg-black/20 p-3 rounded-xl border border-glass-border text-sm text-gray-300 max-h-64 overflow-y-auto">
                    <p className="font-medium mb-2 text-blue-400">
                      {selectedVersion === 'core' ? 'Core Message:' : 'Extended Message:'}
                    </p>
                    <p className="whitespace-pre-wrap">
                      {selectedVersion === 'core'
                        ? generatedContent.masterContent?.core_message
                        : generatedContent.masterContent?.extended_message || 'No extended message available'}
                    </p>
                    
                    {/* Additional Metadata */}
                    {generatedContent.masterContent?.suggested_hashtags && (
                      <div className="mt-4 pt-3 border-t border-glass-border">
                        <p className="font-medium mb-1 text-gray-400">Suggested Hashtags:</p>
                        <p className="text-blue-600">{generatedContent.masterContent.suggested_hashtags.join(' ')}</p>
                      </div>
                    )}
                    {generatedContent.masterContent?.call_to_action && (
                      <div className="mt-2">
                        <p className="font-medium mb-1 text-gray-400">Call to Action:</p>
                        <p className="text-purple-400">{generatedContent.masterContent.call_to_action}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600/80 rounded-md hover:bg-blue-500"
                    onClick={handleUseGeneratedContent}
                  >
                    Use This Content
                  </button>
                  <button
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                    onClick={() => {
                      reset();
                      setShowActivityLog(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-900/40 border border-red-500/30 backdrop-blur-sm rounded-md p-4">
                <p className="text-sm text-red-200"><strong>Error:</strong> {error}</p>
                <button
                  className="mt-3 px-4 py-2 text-sm font-medium text-gray-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
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
              <label className="block text-sm font-medium text-gray-300 mb-1">Campaign</label>
              <select
                className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500 transition-colors [&>option]:bg-gray-800"
                value={form.mcForm.campaign_id || ''}
                onChange={e => form.setMcForm({ ...form.mcForm, campaign_id: e.target.value })}
              >
                <option value="">Select a Campaign (Required for AI generation)</option>
                {campaigns.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300">Core Message</label>
                {form.mcForm.campaign_id && (
                  <button
                    className="text-sm px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition-colors flex items-center gap-2"
                    onClick={handleGenerateAI}
                    disabled={isLoading}
                  >
                    <span>✨</span> Generate via AI
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {form.mcForm.campaign_id && (
                  <select
                    className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500 transition-colors [&>option]:bg-gray-800 text-sm"
                    value={selectedLanguage}
                    onChange={e => setSelectedLanguage(e.target.value)}
                  >
                    <option value="Vietnamese">Vietnamese</option>
                    <option value="English">English</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Spanish">Spanish</option>
                  </select>
                )}
                <textarea
                  className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500 transition-colors [&>option]:bg-gray-800 h-32"
                  value={form.mcForm.core_message}
                  onChange={e => form.setMcForm({ ...form.mcForm, core_message: e.target.value })}
                  placeholder="The key message for this piece of content..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Approval Status</label>
              <select
                className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500 transition-colors [&>option]:bg-gray-800"
                value={form.mcForm.approval_status}
                onChange={e => form.setMcForm({ ...form.mcForm, approval_status: e.target.value })}
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="revision_needed">Revision Needed</option>
              </select>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default MasterContentModal;
