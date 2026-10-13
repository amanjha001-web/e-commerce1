import { asyncHandler } from "../utils/index.js";
import vendorDashboardService from "../services/vendorDashboard.service.js";

const getVendorDashboard = asyncHandler(async (req, res) => {
  const dashboard = await vendorDashboardService.getVendorDashboard(
    req.user._id,
  );

  return res.status(200).json({
    success: true,
    statusCode: 200,
    data: dashboard,
    message: "Vendor dashboard fetched successfully",
  });
});

export { getVendorDashboard };
