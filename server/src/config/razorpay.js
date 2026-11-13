import Razorpay from 'razorpay';
import { env } from './env.js';
import logger from './logger.js';

let razorpayInstance = null;

if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
  try {
    razorpayInstance = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
    logger.info('Razorpay client initialized.');
  } catch (err) {
    logger.warn(`Razorpay initialization warning: ${err.message}`);
  }
} else {
  logger.info('Razorpay credentials not set. Simulated payment flow will be used if test orders created.');
}

export const getRazorpayInstance = () => razorpayInstance;
export { razorpayInstance };
export default razorpayInstance;
