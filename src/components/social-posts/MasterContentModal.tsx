import React from 'react';
import Modal from '../Modal';

interface MasterContentModalProps {
  form: any;
  campaigns: any[];
  currentWorkspace: any;
}

const MasterContentModal: React.FC<MasterContentModalProps> = ({ form, campaigns, currentWorkspace }) => (
  <Modal
    title={form.mcModal === 'create' ? 'Create Content' : 'Edit Content'}
    onClose={() => form.setMcModal(null)}
    footer={
      <div className="flex justify-end gap-3">
        <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" onClick={() => form.setMcModal(null)}>Cancel</button>
        <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700" onClick={() => form.handleSaveMc(currentWorkspace.id)}>Save</button>
      </div>
    }
  >
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Core Message</label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 h-32"
          value={form.mcForm.core_message}
          onChange={e => form.setMcForm({ ...form.mcForm, core_message: e.target.value })}
          placeholder="The key message for this piece of content..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Campaign</label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          value={form.mcForm.campaign_id || ''}
          onChange={e => form.setMcForm({ ...form.mcForm, campaign_id: e.target.value })}
        >
          <option value="">No Campaign</option>
          {campaigns.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Approval Status</label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          value={form.mcForm.approval_status}
          onChange={e => form.setMcForm({ ...form.mcForm, approval_status: e.target.value })}
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="revision_needed">Revision Needed</option>
        </select>
      </div>
    </div>
  </Modal>
);

export default MasterContentModal;
