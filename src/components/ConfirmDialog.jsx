import Modal from './Modal';

export default function ConfirmDialog({ message, onConfirm, onCancel }) {
    return (
        <Modal
            title="Confirm Action"
            onClose={onCancel}
            footer={
                <>
                    <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
                    <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
                </>
            }
        >
            <div className="confirm-body">
                <p>{message}</p>
                <p className="confirm-warning">This action cannot be undone.</p>
            </div>
        </Modal>
    );
}
