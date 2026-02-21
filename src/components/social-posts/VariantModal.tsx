import React, { useState } from 'react';
import Modal from '../Modal';
import ActivityLog from './ActivityLog';
import { useAIContentGeneration } from '../../hooks/useAIContentGeneration';

interface VariantModalProps {
  form: any;
  currentWorkspace: any;
  masterContentId?: string;
}

const VariantModal: React.FC<VariantModalProps> = ({ form, currentWorkspace, masterContentId }) => {
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('Vietnamese');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [showPlatformSelection, setShowPlatformSelection] = useState(false);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  
  const { isLoading, events, error, generatedContent, startGeneratingVariants, reset } = useAIContentGeneration();

  const allPlatforms = ['facebook', 'instagram', 'linkedin', 'twitter', 'tiktok', 'youtube', 'blog', 'email'];
  
  // Determine if we're creating a new variant or editing an existing one
  const isCreatingNew = form.variantModal === 'create';
  const isEditingExisting = form.variantModal === 'edit' && form.variantForm.platform;

  const handleGenerateAI = async () => {
    // For new variants, use selected platforms; for existing, use just the current platform
    const platformsToGenerate = isEditingExisting 
      ? [form.variantForm.platform]
      : selectedPlatforms.length > 0 
        ? selectedPlatforms 
        : [form.variantForm.platform];

    if (!masterContentId) {
      alert('No master content ID available. Please close and try again.');
      return;
    }

    if (platformsToGenerate.length === 0) {
      alert('Please select at least one platform');
      return;
    }

    setShowActivityLog(true);
    await startGeneratingVariants(masterContentId, platformsToGenerate, currentWorkspace.id, selectedLanguage);
  };

  const handleUseGeneratedContent = () => {
    if (generatedContent?.variants && generatedContent.variants.length > 0) {
      const selectedVariant = generatedContent.variants[selectedVariantIndex];
      
      if (selectedVariant) {
        form.setVariantForm({
          ...form.variantForm,
          platform: selectedVariant.platform || form.variantForm.platform,
          adapted_copy: selectedVariant.adaptedCopy || form.variantForm.adapted_copy,
          hashtags: Array.isArray(selectedVariant.hashtags) 
            ? selectedVariant.hashtags.join(' ') 
            : selectedVariant.hashtags || '',
          call_to_action: selectedVariant.callToAction || '',
          summary: selectedVariant.summary || '',
          character_count: selectedVariant.characterCount || 0,
          platform_tips: selectedVariant.platformTips || '',
          confidence_score: selectedVariant.confidenceScore || 0,
          optimization_notes: selectedVariant.optimizationNotes || '',
          seo_title: selectedVariant.seoTitle || '',
          seo_description: selectedVariant.seoDescription || '',
          seo_keywords: Array.isArray(selectedVariant.seoKeywords)
            ? selectedVariant.seoKeywords.join(', ')
            : selectedVariant.seoKeywords || '',
        });
        setShowActivityLog(false);
        reset();
      }
    }
  };

  const handleTogglePlatform = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  return (
    <Modal
      title={form.variantModal === 'create' ? 'Add Platform Variant' : 'Edit Platform Variant'}
      onClose={() => form.setVariantModal(null)}
      footer={
        <div className="flex justify-end gap-3">
          <button 
            className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors" 
            onClick={() => form.setVariantModal(null)}
          >
            Cancel
          </button>
          <button 
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600/80 rounded-lg hover:bg-blue-500 shadow-lg transition-colors" 
            onClick={() => form.handleSaveVariant(currentWorkspace.id)}
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
                  <h4 className="text-sm font-semibold text-blue-300 mb-3">Generated Variants Preview</h4>
                  
                  {/* Platform Tabs */}
                  {generatedContent.variants && generatedContent.variants.length > 0 && (
                    <>
                      <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                        {generatedContent.variants.map((variant: any, idx: number) => (
                          <button
                            key={idx}
                            className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                              selectedVariantIndex === idx
                                ? 'bg-blue-600/80 text-white'
                                : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
                            }`}
                            onClick={() => setSelectedVariantIndex(idx)}
                          >
                            {variant.platform?.toUpperCase() || `Variant ${idx + 1}`}
                          </button>
                        ))}
                      </div>
                      
                      {/* Selected Variant Details */}
                      {generatedContent.variants[selectedVariantIndex] && (
                        <div className="bg-black/20 p-4 rounded-xl border border-glass-border text-sm text-gray-300 max-h-96 overflow-y-auto space-y-3">
                          <div>
                            <p className="font-medium text-blue-400 mb-2">
                              {generatedContent.variants[selectedVariantIndex].platform?.toUpperCase()}
                            </p>
                          </div>
                          
                          <div>
                            <p className="font-semibold text-gray-400 mb-1">Adapted Copy:</p>
                            <p className="whitespace-pre-wrap bg-white/5 p-2 rounded">
                              {generatedContent.variants[selectedVariantIndex].adaptedCopy}
                            </p>
                          </div>
                          
                          {generatedContent.variants[selectedVariantIndex].hashtags && (
                            <div>
                              <p className="font-semibold text-gray-400 mb-1">Hashtags:</p>
                              <p className="text-blue-600">
                                {Array.isArray(generatedContent.variants[selectedVariantIndex].hashtags)
                                  ? generatedContent.variants[selectedVariantIndex].hashtags.join(' ')
                                  : generatedContent.variants[selectedVariantIndex].hashtags}
                              </p>
                            </div>
                          )}
                          
                          {generatedContent.variants[selectedVariantIndex].callToAction && (
                            <div>
                              <p className="font-semibold text-gray-400 mb-1">Call to Action:</p>
                              <p className="text-purple-400">
                                {generatedContent.variants[selectedVariantIndex].callToAction}
                              </p>
                            </div>
                          )}
                          
                          {generatedContent.variants[selectedVariantIndex].summary && (
                            <div>
                              <p className="font-semibold text-gray-400 mb-1">Summary:</p>
                              <p className="text-gray-400">
                                {generatedContent.variants[selectedVariantIndex].summary}
                              </p>
                            </div>
                          )}
                          
                          {generatedContent.variants[selectedVariantIndex].characterCount && (
                            <div>
                              <p className="font-semibold text-gray-400 mb-1">Character Count:</p>
                              <p className="text-gray-400">
                                {generatedContent.variants[selectedVariantIndex].characterCount}
                              </p>
                            </div>
                          )}
                          
                          {generatedContent.variants[selectedVariantIndex].platformTips && (
                            <div>
                              <p className="font-semibold text-gray-400 mb-1">Platform Tips:</p>
                              <p className="text-gray-400 italic">
                                {generatedContent.variants[selectedVariantIndex].platformTips}
                              </p>
                            </div>
                          )}
                          
                          {generatedContent.variants[selectedVariantIndex].confidenceScore && (
                            <div className="pt-2 border-t border-glass-border">
                              <p className="text-xs text-gray-500">
                                Confidence: {generatedContent.variants[selectedVariantIndex].confidenceScore}/5.0
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600/80 rounded-md hover:bg-blue-500"
                    onClick={handleUseGeneratedContent}
                  >
                    Use This Variant
                  </button>
                  <button
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                    onClick={() => {
                      reset();
                      setShowActivityLog(false);
                      setSelectedVariantIndex(0);
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
        ) : showPlatformSelection && isCreatingNew ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Select Platforms to Generate</label>
              <div className="grid grid-cols-2 gap-3">
                {allPlatforms.map(platform => (
                  <label key={platform} className="flex items-center gap-2 p-3 border border-glass-border rounded-lg bg-black/20 cursor-pointer hover:bg-white/5 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedPlatforms.includes(platform)}
                      onChange={() => handleTogglePlatform(platform)}
                      className="rounded"
                    />
                    <span className="text-sm font-medium">{platform.charAt(0).toUpperCase() + platform.slice(1)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Language</label>
              <select
                className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500 transition-colors [&>option]:bg-gray-800"
                value={selectedLanguage}
                onChange={e => setSelectedLanguage(e.target.value)}
              >
                <option value="Vietnamese">Vietnamese</option>
                <option value="English">English</option>
                <option value="Chinese">Chinese</option>
                <option value="Spanish">Spanish</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50"
                onClick={handleGenerateAI}
                disabled={selectedPlatforms.length === 0 || isLoading}
              >
                {isLoading ? 'Generating...' : '✨ Generate Variants'}
              </button>
              <button
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                onClick={() => setShowPlatformSelection(false)}
              >
                Back
              </button>
            </div>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Platform</label>
              <select
                className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500 transition-colors [&>option]:bg-gray-800"
                value={form.variantForm.platform}
                onChange={e => form.setVariantForm({ ...form.variantForm, platform: e.target.value })}
              >
                <option value="">Select a Platform</option>
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="linkedin">LinkedIn</option>
                <option value="twitter">Twitter</option>
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube</option>
                <option value="blog">Blog</option>
                <option value="email">Email</option>
              </select>
            </div>

            {isCreatingNew && (
              <div>
                <button
                  className="w-full px-4 py-2 text-sm font-medium text-purple-400 border border-purple-500/30 rounded-md hover:bg-purple-500/20 text-purple-300 flex items-center justify-center gap-2"
                  onClick={() => setShowPlatformSelection(true)}
                >
                  <span>✨</span> Generate Multiple via AI
                </button>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300">Adapted Copy</label>
                {(form.variantForm.platform || isEditingExisting) && (
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
                {(form.variantForm.platform || isEditingExisting) && (
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
                  className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500 transition-colors [&>option]:bg-gray-800 h-40"
                  value={form.variantForm.adapted_copy}
                  onChange={e => form.setVariantForm({ ...form.variantForm, adapted_copy: e.target.value })}
                  placeholder="Write the platform-specific content here..."
                />
                <p className="text-xs text-gray-400">
                  Tailor the core message for this specific platform. Consider character limits and audience expectations.
                </p>
              </div>
            </div>

            {/* Metadata Section */}
            <div className="border-t border-glass-border pt-4">
              <h3 className="text-sm font-semibold text-white mb-3">Metadata</h3>
              
              <div className="space-y-3">
                {/* Hashtags */}
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Hashtags</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500 transition-colors [&>option]:bg-gray-800"
                    value={form.variantForm.hashtags || ''}
                    onChange={e => form.setVariantForm({ ...form.variantForm, hashtags: e.target.value })}
                    placeholder="#example #hashtags"
                  />
                </div>

                {/* Call to Action */}
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Call to Action</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500 transition-colors [&>option]:bg-gray-800"
                    value={form.variantForm.call_to_action || ''}
                    onChange={e => form.setVariantForm({ ...form.variantForm, call_to_action: e.target.value })}
                    placeholder="e.g., Shop Now, Learn More"
                  />
                </div>

                {/* Summary */}
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Summary</label>
                  <textarea
                    className="w-full px-3 py-2 text-sm border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500 transition-colors [&>option]:bg-gray-800 h-20"
                    value={form.variantForm.summary || ''}
                    onChange={e => form.setVariantForm({ ...form.variantForm, summary: e.target.value })}
                    placeholder="Brief summary of the content..."
                  />
                </div>

                {/* Character Count & Confidence Score */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Character Count</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 text-sm border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500 transition-colors [&>option]:bg-gray-800"
                      value={form.variantForm.character_count || 0}
                      onChange={e => form.setVariantForm({ ...form.variantForm, character_count: parseInt(e.target.value) || 0 })}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Confidence Score</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      className="w-full px-3 py-2 text-sm border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500 transition-colors [&>option]:bg-gray-800"
                      value={form.variantForm.confidence_score || 0}
                      onChange={e => form.setVariantForm({ ...form.variantForm, confidence_score: parseFloat(e.target.value) || 0 })}
                      readOnly
                    />
                  </div>
                </div>

                {/* Platform Tips */}
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Platform Tips</label>
                  <textarea
                    className="w-full px-3 py-2 text-sm border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500 transition-colors [&>option]:bg-gray-800 h-16"
                    value={form.variantForm.platform_tips || ''}
                    onChange={e => form.setVariantForm({ ...form.variantForm, platform_tips: e.target.value })}
                    placeholder="Platform-specific posting tips..."
                  />
                </div>

                {/* Optimization Notes */}
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Optimization Notes</label>
                  <textarea
                    className="w-full px-3 py-2 text-sm border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500 transition-colors [&>option]:bg-gray-800 h-16"
                    value={form.variantForm.optimization_notes || ''}
                    onChange={e => form.setVariantForm({ ...form.variantForm, optimization_notes: e.target.value })}
                    placeholder="Notes about optimizations applied..."
                  />
                </div>

                {/* SEO Fields - Collapsible */}
                <details className="border border-glass-border rounded-md">
                  <summary className="px-3 py-2 text-xs font-medium text-gray-300 cursor-pointer hover:bg-white/5">
                    SEO Settings (Optional)
                  </summary>
                  <div className="px-3 pb-3 pt-2 space-y-3 bg-white/5">
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">SEO Title</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 text-sm border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500 transition-colors [&>option]:bg-gray-800"
                        value={form.variantForm.seo_title || ''}
                        onChange={e => form.setVariantForm({ ...form.variantForm, seo_title: e.target.value })}
                        placeholder="SEO-optimized title (max 60 chars)"
                        maxLength={60}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">SEO Description</label>
                      <textarea
                        className="w-full px-3 py-2 text-sm border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500 transition-colors [&>option]:bg-gray-800 h-16"
                        value={form.variantForm.seo_description || ''}
                        onChange={e => form.setVariantForm({ ...form.variantForm, seo_description: e.target.value })}
                        placeholder="SEO meta description (max 160 chars)"
                        maxLength={160}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">SEO Keywords</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 text-sm border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500 transition-colors [&>option]:bg-gray-800"
                        value={form.variantForm.seo_keywords || ''}
                        onChange={e => form.setVariantForm({ ...form.variantForm, seo_keywords: e.target.value })}
                        placeholder="keyword1, keyword2, keyword3"
                      />
                    </div>
                  </div>
                </details>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Publish Status</label>
              <select
                className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500 transition-colors [&>option]:bg-gray-800"
                value={form.variantForm.publish_status}
                onChange={e => form.setVariantForm({ ...form.variantForm, publish_status: e.target.value })}
              >
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Scheduled Date & Time</label>
              <input
                type="datetime-local"
                className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500 transition-colors [&>option]:bg-gray-800"
                value={form.variantForm.scheduled_at}
                onChange={e => form.setVariantForm({ ...form.variantForm, scheduled_at: e.target.value })}
              />
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default VariantModal;
