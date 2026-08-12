import mongoose from "mongoose";

import commissionRepository from "../repositories/commission.repository.js";
import vendorEarningRepository from "../repositories/vendorEarning.repository.js";

import ApiError from "../utils/ApiError.js";


/*                      Calculate Commission                                  */


const calculateCommission = ({ saleAmount, commissionRate }) => {
  const commissionAmount = Number(
    ((saleAmount * commissionRate) / 100).toFixed(2),
  );

  const vendorAmount = Number((saleAmount - commissionAmount).toFixed(2));

  return {
    saleAmount,
    commissionRate,
    commissionAmount,
    vendorAmount,
  };
};


/*                         Create Commission                                  */


const createCommission = async (commissionData, session = null) => {
  const {
    vendor,
    order,
    orderItem,
    saleAmount,
    commissionRate,
    type = "product_sale",
    createdBy,
    notes,
  } = commissionData;

  const calculation = calculateCommission({
    saleAmount,
    commissionRate,
  });

  const commission = await commissionRepository.createCommission(
    {
      vendor,
      order,
      orderItem,

      saleAmount,

      commissionRate,

      commissionAmount: calculation.commissionAmount,

      vendorAmount: calculation.vendorAmount,

      type,

      createdBy,

      notes,

      status: "pending",
    },

    session,
  );

  await vendorEarningRepository.createEarning(
    {
      vendor,

      order,

      orderItem,

      grossAmount: saleAmount,

      commissionAmount: calculation.commissionAmount,

      netEarning: calculation.vendorAmount,

      status: "pending",
    },

    session,
  );

  return commission;
};


/*                      Get Commission By Id                                  */


const getCommissionById = async (commissionId) => {
  const commission = await commissionRepository.findById(commissionId);

  if (!commission) {
    throw new ApiError(404, "Commission not found");
  }

  return commission;
};


/*                    Vendor Commission List                                  */


const getVendorCommissions = async (vendorId, options = {}) => {
  return commissionRepository.findByVendor(vendorId, options);
};


/*                     Commission Summary                                     */


const getCommissionSummary = async (vendorId) => {
  return commissionRepository.getSummary(vendorId);
};


/*                     Check Existing Commission                              */


const commissionExists = async (orderItemId) => {
  const commission = await commissionRepository.findByOrderItem(orderItemId);

  return Boolean(commission);
};


/*                      Create From Order Item                                */


const createCommissionFromOrderItem = async (orderItem, session = null) => {
  const alreadyExists = await commissionExists(orderItem._id);

  if (alreadyExists) {
    throw new ApiError(409, "Commission already exists for this order item");
  }

  return createCommission(
    {
      vendor: orderItem.vendor,

      order: orderItem.order,

      orderItem: orderItem._id,

      saleAmount: orderItem.totalPrice,

      commissionRate: orderItem.commissionRate,

      type: "product_sale",
    },

    session,
  );
};

/*                         Approve Commission                                 */


const approveCommission = async (
  commissionId,
  session = null
) => {

  const commission =
    await commissionRepository.findById(
      commissionId
    );



  if (!commission) {
    throw new ApiError(
      404,
      "Commission not found"
    );
  }



  if (commission.status !== "pending") {
    throw new ApiError(
      400,
      "Only pending commission can be approved"
    );
  }



  const updatedCommission =
    await commissionRepository.updateCommission(

      commissionId,

      {
        status: "approved",
      },

      session

    );



  await vendorEarningRepository.updateStatus(

    commission.orderItem,

    "available",

    session

  );



  return updatedCommission;

};






/*                         Reject Commission                                  */


const rejectCommission = async (
  commissionId,
  reason,
  session = null
) => {

  const commission =
    await commissionRepository.findById(
      commissionId
    );



  if (!commission) {
    throw new ApiError(
      404,
      "Commission not found"
    );
  }



  const updatedCommission =
    await commissionRepository.updateCommission(

      commissionId,

      {
        status: "cancelled",
        notes: reason,
      },

      session

    );



  await vendorEarningRepository.updateStatus(

    commission.orderItem,

    "cancelled",

    session

  );



  return updatedCommission;

};






/*                          Mark As Paid                                      */


const markCommissionPaid = async (
  commissionId,
  payoutId,
  session = null
) => {

  const commission =
    await commissionRepository.findById(
      commissionId
    );



  if (!commission) {
    throw new ApiError(
      404,
      "Commission not found"
    );
  }



  if (commission.status !== "approved") {
    throw new ApiError(
      400,
      "Commission must be approved before payout"
    );
  }



  const updatedCommission =
    await commissionRepository.updateCommission(

      commissionId,

      {

        status: "paid",

        payout: payoutId,

        paidAt: new Date(),

      },

      session

    );



  await vendorEarningRepository.markWithdrawn(

    commission.orderItem,

    payoutId,

    session

  );



  return updatedCommission;

};






/*                         Refund Commission                                  */


const refundCommission = async (
  commissionId,
  refundAmount,
  session = null
) => {

  const commission =
    await commissionRepository.findById(
      commissionId
    );



  if (!commission) {
    throw new ApiError(
      404,
      "Commission not found"
    );
  }



  const updatedSaleAmount =
    commission.saleAmount - refundAmount;



  if (updatedSaleAmount < 0) {
    throw new ApiError(
      400,
      "Invalid refund amount"
    );
  }



  const calculation =
    calculateCommission({

      saleAmount: updatedSaleAmount,

      commissionRate:
        commission.commissionRate,

    });




  return commissionRepository.updateCommission(

    commissionId,

    {

      saleAmount:
        updatedSaleAmount,

      commissionAmount:
        calculation.commissionAmount,

      vendorAmount:
        calculation.vendorAmount,

    },

    session

  );

};






/*                           Delete Commission                                */


const deleteCommission = async (
  commissionId
) => {

  const commission =
    await commissionRepository.findById(
      commissionId
    );



  if (!commission) {
    throw new ApiError(
      404,
      "Commission not found"
    );
  }



  return commissionRepository.deleteCommission(
    commissionId
  );

};






/*                           Payout Ready                                     */


const getPendingPayouts = async (
  vendorId
) => {

  return commissionRepository.getPendingPayouts(
    vendorId
  );

};






/*                              Export                                        */


export default {

  calculateCommission,

  createCommission,

  createCommissionFromOrderItem,

  getCommissionById,

  getVendorCommissions,

  getCommissionSummary,

  commissionExists,

  approveCommission,

  rejectCommission,

  markCommissionPaid,

  refundCommission,

  deleteCommission,

  getPendingPayouts,

};