import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { User } from '../../src/models/User.model.js';
import { Vendor } from '../../src/models/Vendor.model.js';
import { Product } from '../../src/models/Product.model.js';
import { Order } from '../../src/models/Order.model.js';
import { VendorEarnings } from '../../src/models/VendorEarnings.model.js';
import { VendorPayout } from '../../src/models/VendorPayout.model.js';
import { generateAccessToken } from '../../src/utils/token.utils.js';
import { ROLES } from '../../src/constants/roles.constant.js';

const createQueryMock = (result) => {
  const query = {
    populate: vi.fn(() => query),
    select: vi.fn(() => query),
    sort: vi.fn(() => query),
    skip: vi.fn(() => query),
    limit: vi.fn(() => query),
    lean: vi.fn(() => query),
    distinct: vi.fn(() => Promise.resolve(result)),
    exec: vi.fn(() => Promise.resolve(result)),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  };
  return query;
};

describe('Vendor Earnings & Payouts Service & Routes Integration Tests', () => {
  const vendorUserId = '507f1f77bcf86cd799439101';
  const vendorStoreId = '507f1f77bcf86cd799439102';
  const customerId = '507f1f77bcf86cd799439011';

  const vendorToken = generateAccessToken({ id: vendorUserId, role: ROLES.VENDOR });
  const customerToken = generateAccessToken({ id: customerId, role: ROLES.USER });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockAuthUser = (role = ROLES.VENDOR) => {
    const isVendor = role === ROLES.VENDOR;
    vi.spyOn(User, 'findById').mockReturnValue({
      populate: vi.fn().mockResolvedValue({
        _id: isVendor ? vendorUserId : customerId,
        fullName: isVendor ? 'Vendor Seller' : 'Customer',
        role,
        isActive: true,
      }),
    });
  };

  it('enforces auth (401) and vendor role (403) on /api/v1/vendor/earnings and /api/v1/vendor/payouts', async () => {
    const unauth = await request(app).get('/api/v1/vendor/earnings');
    expect(unauth.status).toBe(401);

    mockAuthUser(ROLES.USER);
    const forbidden = await request(app)
      .get('/api/v1/vendor/payouts')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(forbidden.status).toBe(403);
  });

  it('GET /api/v1/vendor/earnings reconciles historical paid order revenue and masks bank details cleanly', async () => {
    mockAuthUser(ROLES.VENDOR);
    vi.spyOn(Vendor, 'findOne').mockResolvedValueOnce({
      _id: vendorStoreId,
      userId: vendorUserId,
      commissionRate: 10,
      businessDetails: {
        bankAccount: {
          accountHolderName: 'Vendor Seller',
          accountNumber: '12345678904321',
          bankName: 'HDFC Bank',
          ifscCode: 'HDFC0001234',
        },
      },
    });

    const earningsDoc = {
      _id: 'earn1',
      vendorId: vendorStoreId,
      totalRevenue: 0,
      totalCommission: 0,
      netEarnings: 0,
      availableBalance: 0,
      pendingBalance: 0,
      totalWithdrawn: 0,
      save: vi.fn().mockResolvedValue(true),
      toObject() {
        return {
          _id: this._id,
          vendorId: this.vendorId,
          totalRevenue: this.totalRevenue,
          totalCommission: this.totalCommission,
          netEarnings: this.netEarnings,
          availableBalance: this.availableBalance,
          pendingBalance: this.pendingBalance,
          totalWithdrawn: this.totalWithdrawn,
        };
      },
    };
    vi.spyOn(VendorEarnings, 'findOne').mockResolvedValueOnce(earningsDoc);
    vi.spyOn(Product, 'find').mockReturnValueOnce(createQueryMock([]));
    vi.spyOn(Order, 'aggregate').mockResolvedValueOnce([
      { grossRevenue: 6000, earnedRevenue: 5000, earnedOrdersCount: 3 },
    ]);
    vi.spyOn(VendorPayout, 'aggregate').mockResolvedValueOnce([
      { _id: 'PAID', total: 1000, count: 1 },
    ]);

    const res = await request(app)
      .get('/api/v1/vendor/earnings')
      .set('Authorization', `Bearer ${vendorToken}`);

    expect(res.status).toBe(200);
    const data = res.body.data;
    expect(earningsDoc.save).toHaveBeenCalledTimes(1);
    expect(data.totalRevenue).toBe(5000);
    expect(data.totalCommission).toBe(500);
    expect(data.netEarnings).toBe(4500);
    expect(data.totalWithdrawn).toBe(1000);
    expect(data.availableBalance).toBe(3500);
    expect(data.pendingOrderRevenue).toBe(1000);
    expect(data.earnedOrdersCount).toBe(3);
    expect(data.bankDetails.configured).toBe(true);
    expect(data.bankDetails.accountNumberMasked).toBe('••••4321');
  });

  it('GET /api/v1/vendor/payouts supports status filter, search, and pagination', async () => {
    mockAuthUser(ROLES.VENDOR);
    vi.spyOn(Vendor, 'findOne').mockResolvedValueOnce({
      _id: vendorStoreId,
      userId: vendorUserId,
    });

    const findSpy = vi.spyOn(VendorPayout, 'find').mockReturnValueOnce(
      createQueryMock([
        {
          _id: '507f1f77bcf86cd799439111',
          amount: 1500,
          status: 'PAID',
          paymentMethod: 'BANK_TRANSFER',
          transactionReference: 'UTR9988',
        },
      ])
    );
    vi.spyOn(VendorPayout, 'countDocuments').mockResolvedValueOnce(12);

    const res = await request(app)
      .get('/api/v1/vendor/payouts?page=2&limit=5&status=paid&search=UTR9988')
      .set('Authorization', `Bearer ${vendorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.payouts).toHaveLength(1);
    expect(res.body.data.pagination).toEqual({
      total: 12,
      page: 2,
      limit: 5,
      totalPages: 3,
    });
    expect(findSpy.mock.calls[0][0].status).toBe('PAID');
    expect(findSpy.mock.calls[0][0].$or).toBeDefined();
  });

  it('POST /api/v1/vendor/payouts validates availableBalance and creates pending payout while shifting balances', async () => {
    mockAuthUser(ROLES.VENDOR);
    vi.spyOn(Vendor, 'findOne').mockResolvedValue({
      _id: vendorStoreId,
      userId: vendorUserId,
      commissionRate: 10,
      businessDetails: {
        bankAccount: {
          accountHolderName: 'Vendor Seller',
          accountNumber: '12345678904321',
          bankName: 'HDFC Bank',
          ifscCode: 'HDFC0001234',
        },
      },
    });
    vi.spyOn(Product, 'find').mockReturnValue(createQueryMock([]));
    vi.spyOn(Order, 'aggregate').mockResolvedValue([]);
    vi.spyOn(VendorPayout, 'aggregate').mockResolvedValue([]);

    const earningsDoc = {
      _id: 'earn1',
      vendorId: vendorStoreId,
      totalRevenue: 5000,
      totalCommission: 500,
      netEarnings: 4500,
      availableBalance: 2000,
      pendingBalance: 500,
      totalWithdrawn: 2000,
      save: vi.fn().mockResolvedValue(true),
    };
    vi.spyOn(VendorEarnings, 'findOne').mockResolvedValue(earningsDoc);

    // Reject exceeding balance
    const overRes = await request(app)
      .post('/api/v1/vendor/payouts')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ amount: 3000 });
    expect(overRes.status).toBe(400);

    // Succeed within balance
    const payoutCreateSpy = vi.spyOn(VendorPayout, 'create').mockResolvedValueOnce({
      _id: 'pay1',
      vendorId: vendorStoreId,
      amount: 1200,
      status: 'PENDING',
      paymentMethod: 'UPI',
    });

    const okRes = await request(app)
      .post('/api/v1/vendor/payouts')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ amount: 1200, paymentMethod: 'UPI', notes: 'Monthly settlement' });

    expect(okRes.status).toBe(201);
    expect(payoutCreateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        vendorId: vendorStoreId,
        amount: 1200,
        status: 'PENDING',
        paymentMethod: 'UPI',
        notes: 'Monthly settlement',
      })
    );
    expect(earningsDoc.availableBalance).toBe(800);
    expect(earningsDoc.pendingBalance).toBe(1700);
    expect(earningsDoc.save).toHaveBeenCalledTimes(1);
  });
});
