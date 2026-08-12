import Cart from "../models/Cart.model.js";

/*                              Create Cart                                   */

const createCart = async (cartData, session = null) => {
  const cart = await Cart.create([cartData], {
    session,
  });

  return cart[0];
};

/*                           Get Cart By User                                 */

const getCartByUserId = async (userId) => {
  return await Cart.findOne({
    user: userId,
  })
    .populate(
      "items.product",
      "name slug thumbnail price discountPrice stock isActive status",
    )
    .populate("user", "fullName email")
    .lean();
};

/*                           Check Cart Exists                                */

const cartExists = async (userId) => {
  return await Cart.exists({
    user: userId,
  });
};

/*                            Update Cart                                     */

const updateCart = async (userId, updateData, session = null) => {
  return await Cart.findOneAndUpdate(
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
    .populate(
      "items.product",
      "name slug thumbnail price discountPrice stock isActive status",
    )
    .populate("user", "fullName email");
};

/*                           Update Cart Totals                               */

const updateCartTotals = async (
  userId,
  totalItems,
  totalPrice,
  session = null,
) => {
  return await Cart.findOneAndUpdate(
    {
      user: userId,
    },
    {
      totalItems,
      totalPrice,
    },
    {
      new: true,
      session,
    },
  );
};
/*                        Get Cart Item Count                                 */

const getCartItemCount = async (userId) => {
  const cart = await Cart.findOne({ user: userId })
    .select("totalItems")
    .lean();

  return cart?.totalItems || 0;
};

/*                      Remove Product From Cart                              */

const removeProductFromCart = async (
  userId,
  productId,
  session = null,
) => {
  return await Cart.findOneAndUpdate(
    {
      user: userId,
    },
    {
      $pull: {
        items: {
          product: productId,
        },
      },
    },
    {
      new: true,
      runValidators: true,
      session,
    },
  )
    .populate(
      "items.product",
      "name slug thumbnail price discountPrice stock isActive status",
    )
    .populate("user", "fullName email");
};

/*                             Clear Cart                                     */

const clearCart = async (
  userId,
  session = null,
) => {
  return await Cart.findOneAndUpdate(
    {
      user: userId,
    },
    {
      items: [],
      totalItems: 0,
      totalPrice: 0,
    },
    {
      new: true,
      runValidators: true,
      session,
    },
  );
};

/*                            Delete Cart                                     */

const deleteCart = async (
  userId,
  session = null,
) => {
  return await Cart.findOneAndDelete(
    {
      user: userId,
    },
    {
      session,
    },
  );
};

/*                                  Export                                    */

export default {
  createCart,
  getCartByUserId,
  cartExists,
  updateCart,
  updateCartTotals,
  getCartItemCount,
  removeProductFromCart,
  clearCart,
  deleteCart,
};