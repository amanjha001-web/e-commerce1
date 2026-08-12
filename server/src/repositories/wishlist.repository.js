import Wishlist from "../models/Wishlist.model.js";

/*                           Create Wishlist                                  */

const createWishlist = async (wishlistData, session = null) => {
  const wishlist = await Wishlist.create([wishlistData], {
    session,
  });

  return wishlist[0];
};

/*                       Get Wishlist By Id                                   */

const getWishlistById = async (wishlistId) => {
  return await Wishlist.findById(wishlistId)
    .populate("user", "fullName email avatar")
    .populate({
      path: "products",
      populate: [
        {
          path: "category",
          select: "name slug",
        },
        {
          path: "brand",
          select: "name slug",
        },
      ],
    })
    .lean();
};

/*                     Get Wishlist By User Id                                */

const getWishlistByUserId = async (userId) => {
  return await Wishlist.findOne({
    user: userId,
  })
    .populate("user", "fullName email avatar")
    .populate({
      path: "products",
      populate: [
        {
          path: "category",
          select: "name slug",
        },
        {
          path: "brand",
          select: "name slug",
        },
      ],
    })
    .lean();
};

/*                         Update Wishlist                                    */

const updateWishlist = async (userId, updateData, session = null) => {
  return await Wishlist.findOneAndUpdate(
    {
      user: userId,
    },
    updateData,
    {
      new: true,
      runValidators: true,
      session,
    },
  )
    .populate("user", "fullName email avatar")
    .populate({
      path: "products",
      populate: [
        {
          path: "category",
          select: "name slug",
        },
        {
          path: "brand",
          select: "name slug",
        },
      ],
    });
};

/*                      Add Product To Wishlist                               */

const addProductToWishlist = async (userId, productId, session = null) => {
  return await Wishlist.findOneAndUpdate(
    {
      user: userId,
    },
    {
      $addToSet: {
        products: productId,
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      session,
    },
  );
};

/*                   Remove Product From Wishlist                             */

const removeProductFromWishlist = async (userId, productId, session = null) => {
  return await Wishlist.findOneAndUpdate(
    {
      user: userId,
    },
    {
      $pull: {
        products: productId,
      },
    },
    {
      new: true,
      runValidators: true,
      session,
    },
  );
};

/*                    Check Product Exists                                    */

const isProductInWishlist = async (userId, productId) => {
  return await Wishlist.exists({
    user: userId,
    products: productId,
  });
};

/*                    Get Wishlist Count                                      */

const getWishlistCount = async (userId) => {
  const wishlist = await Wishlist.findOne({
    user: userId,
  }).select("products");

  return wishlist ? wishlist.products.length : 0;
};

/*                     Clear Wishlist                                         */

const clearWishlist = async (userId, session = null) => {
  return await Wishlist.findOneAndUpdate(
    {
      user: userId,
    },
    {
      $set: {
        products: [],
      },
    },
    {
      new: true,
      session,
    },
  );
};

/*                     Delete Wishlist                                        */

const deleteWishlist = async (userId, session = null) => {
  return await Wishlist.findOneAndDelete(
    {
      user: userId,
    },
    {
      session,
    },
  );
};

/*                               Export                                       */

export default {
  createWishlist,

  getWishlistById,
  getWishlistByUserId,

  updateWishlist,

  addProductToWishlist,
  removeProductFromWishlist,

  isProductInWishlist,
  getWishlistCount,

  clearWishlist,

  deleteWishlist,
};
