let cartModel = require('../schemas/carts')

module.exports = {
    GetCartByUser: async function (userId) {
        return await cartModel.findOne({ user: userId })
            .populate({
                path: 'items.product',
                select: 'title price description images'
            })
    },

    AddToCart: async function (userId, productId, quantity) {
        let cart = await cartModel.findOne({ user: userId })
        if (!cart) {
            cart = new cartModel({
                user: userId,
                items: [{ product: productId, quantity: quantity }]
            })
        } else {
            let existingItem = cart.items.find(
                item => item.product.toString() === productId
            )
            if (existingItem) {
                existingItem.quantity += quantity
            } else {
                cart.items.push({ product: productId, quantity: quantity })
            }
        }
        await cart.save()
        return await cartModel.findById(cart._id)
            .populate({
                path: 'items.product',
                select: 'title price description images'
            })
    },

    UpdateQuantity: async function (userId, productId, quantity) {
        let cart = await cartModel.findOne({ user: userId })
        if (!cart) throw new Error('Cart not found')

        let item = cart.items.find(
            item => item.product.toString() === productId
        )
        if (!item) throw new Error('Product not found in cart')

        item.quantity = quantity
        await cart.save()
        return await cartModel.findById(cart._id)
            .populate({
                path: 'items.product',
                select: 'title price description images'
            })
    },

    RemoveFromCart: async function (userId, productId) {
        let cart = await cartModel.findOne({ user: userId })
        if (!cart) throw new Error('Cart not found')

        cart.items = cart.items.filter(
            item => item.product.toString() !== productId
        )
        await cart.save()
        return await cartModel.findById(cart._id)
            .populate({
                path: 'items.product',
                select: 'title price description images'
            })
    },

    ClearCart: async function (userId) {
        let cart = await cartModel.findOne({ user: userId })
        if (!cart) throw new Error('Cart not found')

        cart.items = []
        await cart.save()
        return cart
    }
}
