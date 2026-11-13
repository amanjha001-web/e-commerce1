import { cloudinary } from '../../config/cloudinary.js';
import { env } from '../../config/env.js';
import logger from '../../config/logger.js';

export const uploadToCloudinary = async (fileBuffer, folder = 'shopsphere', options = {}) => {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY) {
    logger.info('Simulating Cloudinary upload (no credentials set)');
    const fakeId = `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    return {
      url: `https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80`,
      publicId: `${folder}/${fakeId}`,
    };
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
        ...options,
      },
      (error, result) => {
        if (error) {
          logger.error('Cloudinary upload error:', error);
          return reject(error);
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
};

export const deleteFromCloudinary = async (publicId) => {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !publicId || publicId.startsWith('mock_')) {
    return { result: 'ok' };
  }

  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    logger.error(`Error deleting image from Cloudinary [${publicId}]:`, error);
    throw error;
  }
};

export default { uploadToCloudinary, deleteFromCloudinary };
