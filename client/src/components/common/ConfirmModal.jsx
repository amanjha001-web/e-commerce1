import Modal from "./Modal";
import Button from "./Button";

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  loading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? () => {} : onClose}
      title={title}
      size="sm"
      closeOnOverlay={!loading}
      closeOnEscape={!loading}
    >
      <div className="space-y-5">
        <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">
          {message}
        </p>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>

          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
