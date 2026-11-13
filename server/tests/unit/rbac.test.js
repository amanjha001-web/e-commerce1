import { describe, it, expect, vi } from 'vitest';
import { authorize } from '../../src/middlewares/role.middleware.js';
import { requirePermission } from '../../src/middlewares/permission.middleware.js';
import { ROLES } from '../../src/constants/roles.constant.js';
import { PERMISSIONS } from '../../src/constants/permissions.constant.js';

describe('Role-Based Access Control (RBAC) Unit Tests', () => {
  it('should allow user with matching role', () => {
    const req = { user: { role: ROLES.ADMIN } };
    const res = {};
    const next = vi.fn();

    authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN)(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('should block customer from accessing admin role routes', () => {
    const req = { user: { role: ROLES.USER } };
    const res = {};
    const next = vi.fn();

    authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN)(req, res, next);
    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.statusCode).toBe(403);
  });

  it('should block admin from accessing super_admin routes', () => {
    const req = { user: { role: ROLES.ADMIN } };
    const res = {};
    const next = vi.fn();

    authorize(ROLES.SUPER_ADMIN)(req, res, next);
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.statusCode).toBe(403);
  });

  it('should grant Super Admin all permissions automatically', () => {
    const req = { user: { role: ROLES.SUPER_ADMIN } };
    const res = {};
    const next = vi.fn();

    requirePermission(PERMISSIONS.MANAGE_SYSTEM_SETTINGS)(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('should grant Admin configured admin permissions', () => {
    const req = { user: { role: ROLES.ADMIN } };
    const res = {};
    const next = vi.fn();

    requirePermission(PERMISSIONS.MODERATE_PRODUCTS)(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('should block Vendor from performing Admin moderation', () => {
    const req = { user: { role: ROLES.VENDOR } };
    const res = {};
    const next = vi.fn();

    requirePermission(PERMISSIONS.MODERATE_PRODUCTS)(req, res, next);
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.statusCode).toBe(403);
  });
});
