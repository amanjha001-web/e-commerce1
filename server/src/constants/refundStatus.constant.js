export const REFUND_STATUS = {
  REQUESTED: 'requested',
  PENDING: 'pending',
  APPROVED: 'approved',
  PROCESSED: 'processed',
  REJECTED: 'rejected',
  FAILED: 'failed',
};

export const REFUND_STATUS_LIST = Object.values(REFUND_STATUS);

export default REFUND_STATUS;
