import { Tax } from '../../models/Tax.model.js';
import { ApiError } from '../../utils/apiError.js';

export class SuperAdminTaxService {
  async getAll(params = {}) {
    return Tax.find();
  }

  async getById(taxId) {
    const tax = await Tax.findById(taxId);
    if (!tax) throw ApiError.notFound('Tax rule not found');
    return tax;
  }

  async create(taxData) {
    return Tax.create(taxData);
  }

  async update(taxId, taxData) {
    const tax = await Tax.findByIdAndUpdate(taxId, taxData, { new: true });
    if (!tax) throw ApiError.notFound('Tax rule not found');
    return tax;
  }

  async delete(taxId) {
    const tax = await Tax.findByIdAndDelete(taxId);
    if (!tax) throw ApiError.notFound('Tax rule not found');
    return { message: 'Tax rule deleted successfully' };
  }

  async updateStatus(taxId, isActive) {
    const tax = await Tax.findByIdAndUpdate(taxId, { isActive: Boolean(isActive) }, { new: true });
    if (!tax) throw ApiError.notFound('Tax rule not found');
    return tax;
  }
}

export const superAdminTaxService = new SuperAdminTaxService();
export default superAdminTaxService;
