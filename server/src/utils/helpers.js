export const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

export const sanitizeUser = (user) => {
  if (!user) return null;
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.refreshToken;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.emailVerificationToken;
  delete obj.emailVerificationExpires;
  delete obj.otp;
  delete obj.otpExpires;
  obj.fullName = obj.fullName || obj.name || '';
  obj.name = obj.name || obj.fullName || '';
  return obj;
};

export const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const rawSort = query.sortBy || query.sort || 'latest';
  let sortObj = { createdAt: -1 };

  switch (String(rawSort).toLowerCase()) {
    case 'price_asc':
    case 'price-low':
    case 'price-asc':
    case 'price_low':
    case 'price: low to high':
      sortObj = { price: 1 };
      break;
    case 'price_desc':
    case 'price-high':
    case 'price-desc':
    case 'price_high':
    case 'price: high to low':
      sortObj = { price: -1 };
      break;
    case 'rating':
    case 'rating_desc':
    case 'rating-high':
    case 'top-rated':
      sortObj = { rating: -1, createdAt: -1 };
      break;
    case 'oldest':
      sortObj = { createdAt: 1 };
      break;
    case 'name_asc':
    case 'a-z':
      sortObj = { name: 1 };
      break;
    case 'name_desc':
    case 'z-a':
      sortObj = { name: -1 };
      break;
    case 'latest':
    case 'newest':
    default:
      if (typeof rawSort === 'string' && ['name', 'price', 'rating', 'createdAt', 'stock'].includes(rawSort)) {
        const order = query.sortOrder === 'asc' ? 1 : -1;
        sortObj = { [rawSort]: order };
      } else {
        sortObj = { createdAt: -1 };
      }
      break;
  }

  return { page, limit, skip, sort: sortObj };
};

export const roundToTwoDecimals = (num) => {
  return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
};
