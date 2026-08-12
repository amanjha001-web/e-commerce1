import Razorpay from "razorpay";
import ApiError from "../utils/ApiError.js";

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  throw new ApiError(
    500,
    "Razorpay credentials are missing in environment variables",
  );
}

const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

export default razorpay;
