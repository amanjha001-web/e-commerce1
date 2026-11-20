import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { User } from '../../src/models/User.model.js';
import { Vendor } from '../../src/models/Vendor.model.js';
import { VendorRequest } from '../../src/models/VendorRequest.model.js';
import { VendorEarnings } from '../../src/models/VendorEarnings.model.js';
import { notificationService } from '../../src/services/common/notification.service.js';
import { generateAccessToken } from '../../src/utils/token.utils.js';
import { ROLES } from '../../src/constants/roles.constant.js';
import { VENDOR_STATUS } from '../../src/constants/vendorStatus.constant.js';

const createQueryMock = (result) => {
  const query = {
    populate: vi.fn(() => query),
    select: vi.fn(() => query),
    sort: vi.fn(() => query),
    skip: vi.fn(() => query),
    limit: vi.fn(() => query),
    lean: vi.fn(() => query),
    exec: vi.fn(() => Promise.resolve(result)),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  };
  return query;
};

describe('Admin Vendor Requests Service & Routes Integration Tests', () => {
  const adminId = '507f1f77bcf86cd799439012';
  const customerId = '507f1f77bcf86cd799439011';
  const applicantUserId = '507f1f77bcf86cd799439013';
  const requestId = '507f1f77bcf86cd799439066';
  const vendorId = '507f1f77bcf86cd799439077';

  const adminToken = generateAccessToken({ id: adminId, role: ROLES.ADMIN });
  const customerToken = generateAccessToken({ id: customerId, role: ROLES.USER });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockAuth = (role = ROLES.ADMIN) => {
    vi.spyOn(User, 'findById').mockReturnValueOnce({
      populate: vi.fn().mockResolvedValue({
        _id: role === ROLES.ADMIN ? adminId : customerId,
        fullName: role === ROLES.ADMIN ? 'Admin User' : 'Customer User',
        email: role === ROLES.ADMIN ? 'admin@shopsphere.com' : 'cust@example.com',
        role,
        isActive: true,
      }),
    });
  };

  it('rejects unauthenticated (401) and non-admin (403) requests on /api/v1/admin/vendor-requests', async () => {
    const unauth = await request(app).get('/api/v1/admin/vendor-requests');
    expect(unauth.status).toBe(401);

    mockAuth(ROLES.USER);
    const forbidden = await request(app)
      .get('/api/v1/admin/vendor-requests')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(forbidden.status).toBe(403);
  });

  it('GET /api/v1/admin/vendor-requests maps applicant name, user verification, taxId, documentStatus, and summary', async () => {
    mockAuth(ROLES.ADMIN);

    const docs = [
      {
        _id: requestId,
        userId: {
          _id: applicantUserId,
          fullName: 'Rohan Sharma',
          name: 'Rohan Sharma',
          email: 'rohan@tridev.com',
          phone: '9876500000',
          isEmailVerified: true,
          isActive: true,
          role: ROLES.USER,
        },
        storeName: 'tridev',
        email: 'rohan@tridev.com',
        phone: '9876500000',
        taxId: '27TRIDEV1234F1Z5',
        businessType: 'retail',
        bankDetails: { accountNumber: '123456789', ifscCode: 'HDFC0001234' },
        status: VENDOR_STATUS.PENDING,
        isDeleted: false,
      },
    ];

    vi.spyOn(VendorRequest, 'find').mockReturnValueOnce(createQueryMock(docs));
    vi.spyOn(VendorRequest, 'countDocuments')
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1);

    const res = await request(app)
      .get('/api/v1/admin/vendor-requests')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.summary).toEqual({
      total: 5,
      pending: 2,
      underReview: 1,
      approved: 1,
      rejected: 1,
    });
    expect(res.body.data.requests[0]).toMatchObject({
      applicant: 'Rohan Sharma',
      ownerName: 'Rohan Sharma',
      business: 'tridev',
      gstNumber: '27TRIDEV1234F1Z5',
      documentStatus: 'Submitted',
      isUserVerified: true,
      userVerificationStatus: 'verified',
    });
  });

  it('PATCH /api/v1/admin/vendor-requests/:requestId/approve creates Vendor with businessDetails/taxId and initializes earnings', async () => {
    mockAuth(ROLES.ADMIN);

    const requestDoc = {
      _id: requestId,
      userId: applicantUserId,
      storeName: 'Tridev Electronics',
      email: 'rohan@tridev.com',
      phone: '9876500000',
      description: 'Electronics and gadgets',
      website: 'https://tridev.in',
      businessType: 'retail',
      taxId: '27TRIDEV1234F1Z5',
      businessAddress: { street: 'Main St', city: 'Pune', state: 'MH', postalCode: '411001', country: 'India' },
      bankDetails: { accountHolderName: 'Rohan', accountNumber: '123456', bankName: 'HDFC', ifscCode: 'HDFC0001' },
      status: VENDOR_STATUS.PENDING,
      rejectionReason: 'Old reason',
      save: vi.fn().mockResolvedValue(true),
    };

    const hydratedDoc = {
      ...requestDoc,
      status: VENDOR_STATUS.APPROVED,
      rejectionReason: '',
      userId: { _id: applicantUserId, name: 'Rohan Sharma', email: 'rohan@tridev.com', isEmailVerified: true, isActive: true },
    };

    vi.spyOn(VendorRequest, 'findById')
      .mockResolvedValueOnce(requestDoc)
      .mockReturnValueOnce(createQueryMock(hydratedDoc));
    vi.spyOn(Vendor, 'findOne').mockResolvedValue(null);
    const vendorCreateSpy = vi.spyOn(Vendor, 'create').mockResolvedValueOnce({
      _id: vendorId,
      userId: applicantUserId,
      storeName: 'Tridev Electronics',
      status: VENDOR_STATUS.APPROVED,
    });
    const earningsSpy = vi.spyOn(VendorEarnings, 'findOneAndUpdate').mockResolvedValue({});
    const userUpdateSpy = vi.spyOn(User, 'findByIdAndUpdate').mockResolvedValue({});
    vi.spyOn(notificationService, 'createNotification').mockResolvedValue({});

    const res = await request(app)
      .patch(`/api/v1/admin/vendor-requests/${requestId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(requestDoc.status).toBe(VENDOR_STATUS.APPROVED);
    expect(requestDoc.rejectionReason).toBe('');
    expect(vendorCreateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        storeName: 'Tridev Electronics',
        website: 'https://tridev.in',
        businessType: 'retail',
        businessDetails: expect.objectContaining({ taxNumber: '27TRIDEV1234F1Z5' }),
      })
    );
    expect(earningsSpy).toHaveBeenCalledTimes(1);
    expect(userUpdateSpy).toHaveBeenCalledWith(applicantUserId, {
      role: ROLES.VENDOR,
      vendorId,
    });
  });

  it('PATCH /review, /reject, and DELETE /api/v1/admin/vendor-requests/:requestId handle review/rejection/soft-delete cleanly', async () => {
    mockAuth(ROLES.ADMIN);

    const requestDoc = {
      _id: requestId,
      userId: applicantUserId,
      storeName: 'Googles Store',
      email: 'seller@googles.in',
      status: VENDOR_STATUS.PENDING,
      reviewNotes: '',
      rejectionReason: '',
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(VendorRequest, 'findById')
      .mockResolvedValueOnce(requestDoc)
      .mockReturnValueOnce(createQueryMock({ ...requestDoc, status: VENDOR_STATUS.UNDER_REVIEW, reviewNotes: 'Checking GST' }))
      .mockResolvedValueOnce(requestDoc)
      .mockReturnValueOnce(createQueryMock({ ...requestDoc, status: VENDOR_STATUS.REJECTED, rejectionReason: 'Invalid GST' }));

    vi.spyOn(notificationService, 'createNotification').mockResolvedValue({});
    const vendorUpdateSpy = vi.spyOn(Vendor, 'updateOne').mockResolvedValue({ modifiedCount: 1 });
    const userResetSpy = vi.spyOn(User, 'updateOne').mockResolvedValue({ modifiedCount: 1 });

    const reviewRes = await request(app)
      .patch(`/api/v1/admin/vendor-requests/${requestId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ notes: 'Checking GST' });

    expect(reviewRes.status).toBe(200);
    expect(requestDoc.status).toBe(VENDOR_STATUS.UNDER_REVIEW);
    expect(requestDoc.reviewNotes).toBe('Checking GST');

    mockAuth(ROLES.ADMIN);
    const rejectRes = await request(app)
      .patch(`/api/v1/admin/vendor-requests/${requestId}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Invalid GST' });

    expect(rejectRes.status).toBe(200);
    expect(requestDoc.status).toBe(VENDOR_STATUS.REJECTED);
    expect(requestDoc.rejectionReason).toBe('Invalid GST');
    expect(vendorUpdateSpy).toHaveBeenCalledWith(
      { userId: applicantUserId },
      { status: VENDOR_STATUS.REJECTED, isActive: false, rejectionReason: 'Invalid GST' }
    );
    expect(userResetSpy).toHaveBeenCalled();

    mockAuth(ROLES.ADMIN);
    vi.spyOn(VendorRequest, 'findByIdAndUpdate').mockResolvedValueOnce({ _id: requestId, isDeleted: true });
    const deleteRes = await request(app)
      .delete(`/api/v1/admin/vendor-requests/${requestId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.data.deletedRequestId).toBe(requestId);
  });
});
