import React from 'react';
import Modal from '../Modal';

interface VariantModalProps {
  form: any;
  currentWorkspace: any;
}

const VariantModal: React.FC<VariantModalProps> = ({ form, currentWorkspace }) => (
  <Modal
    title={form.variantModal === 'create' ? 'Add Platform Variant' : 'Edit Platform Variant'}
    onClose={() => form.setVariantModal(null)}
    footer={
      <div className="flex justify-end gap-3">
        <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" onClick={() => form.setVariantModal(null)}>Cancel</button>
        <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700" onClick={() => form.handleSaveVariant(currentWorkspace.id)}>Save</button>
      </div>
    }
  >
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          value={form.variantForm.platform}
          onChange={e => form.setVariantForm({ ...form.variantForm, platform: e.target.value })}
        >
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
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Publish Status</label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date & Time</label>
        <input
          type="datetime-local"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          value={form.variantForm.scheduled_at}
          onChange={e => form.setVariantForm({ ...form.variantForm, scheduled_at: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Adapted Copy</label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 h-40"
          value={form.variantForm.adapted_copy}
          onChange={e => form.setVariantForm({ ...form.variantForm, adapted_copy: e.target.value })}
          placeholder="Write the platform-specific content here..."
        />
        <p className="mt-1 text-xs text-gray-400">
          Tailor the core message for this specific platform. Consider character limits and audience expectations.
        </p>
      </div>
    </div>
  </Modal>
);

export default VariantModal;
