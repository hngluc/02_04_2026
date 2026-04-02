let inventoryModel = require('../schemas/inventories');

module.exports = {
    // Get all inventories with product details
    GetAllInventories: async function () {
        try {
            return await inventoryModel.find()
                .populate({
                    path: 'product',
                    select: 'title price description category'
                });
        } catch (error) {
            throw error;
        }
    },

    // Get inventory by product ID with product details
    GetInventoryById: async function (productId) {
        try {
            return await inventoryModel.findOne({ product: productId })
                .populate({
                    path: 'product',
                    select: 'title price description category'
                });
        } catch (error) {
            throw error;
        }
    },

    // Add stock - increase stock quantity
    AddStock: async function (productId, quantity) {
        try {
            if (quantity <= 0) {
                throw new Error('Quantity must be greater than 0');
            }
            const result = await inventoryModel.findOneAndUpdate(
                { product: productId },
                { $inc: { stock: quantity } },
                { new: true }
            ).populate({
                path: 'product',
                select: 'title price description category'
            });

            if (!result) {
                throw new Error('Inventory not found');
            }
            return result;
        } catch (error) {
            throw error;
        }
    },

    // Remove stock - decrease stock quantity
    RemoveStock: async function (productId, quantity) {
        try {
            if (quantity <= 0) {
                throw new Error('Quantity must be greater than 0');
            }

            const inventory = await inventoryModel.findOne({ product: productId });
            if (!inventory) {
                throw new Error('Inventory not found');
            }

            if (inventory.stock < quantity) {
                throw new Error('Insufficient stock');
            }

            const result = await inventoryModel.findOneAndUpdate(
                { product: productId },
                { $inc: { stock: -quantity } },
                { new: true }
            ).populate({
                path: 'product',
                select: 'title price description category'
            });

            return result;
        } catch (error) {
            throw error;
        }
    },

    // Reserve stock - decrease stock and increase reserved
    Reservation: async function (productId, quantity) {
        try {
            if (quantity <= 0) {
                throw new Error('Quantity must be greater than 0');
            }

            const inventory = await inventoryModel.findOne({ product: productId });
            if (!inventory) {
                throw new Error('Inventory not found');
            }

            if (inventory.stock < quantity) {
                throw new Error('Insufficient stock for reservation');
            }

            const result = await inventoryModel.findOneAndUpdate(
                { product: productId },
                {
                    $inc: {
                        stock: -quantity,
                        reserved: quantity
                    }
                },
                { new: true }
            ).populate({
                path: 'product',
                select: 'title price description category'
            });

            return result;
        } catch (error) {
            throw error;
        }
    },

    // Sold - decrease reserved and increase soldCount
    Sold: async function (productId, quantity) {
        try {
            if (quantity <= 0) {
                throw new Error('Quantity must be greater than 0');
            }

            const inventory = await inventoryModel.findOne({ product: productId });
            if (!inventory) {
                throw new Error('Inventory not found');
            }

            if (inventory.reserved < quantity) {
                throw new Error('Insufficient reserved quantity');
            }

            const result = await inventoryModel.findOneAndUpdate(
                { product: productId },
                {
                    $inc: {
                        reserved: -quantity,
                        soldCount: quantity
                    }
                },
                { new: true }
            ).populate({
                path: 'product',
                select: 'title price description category'
            });

            return result;
        } catch (error) {
            throw error;
        }
    }
};
