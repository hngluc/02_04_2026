var express = require('express');
var router = express.Router();
let inventoryController = require('../controllers/inventories');

// GET all inventories with product details
router.get('/', async function (req, res) {
    try {
        const inventories = await inventoryController.GetAllInventories();
        res.send(inventories);
    } catch (error) {
        res.status(500).send({
            message: error.message
        });
    }
});

// GET inventory by product ID with product details
router.get('/:productId', async function (req, res) {
    try {
        const productId = req.params.productId;
        const inventory = await inventoryController.GetInventoryById(productId);

        if (!inventory) {
            return res.status(404).send({
                message: 'Inventory not found'
            });
        }

        res.send(inventory);
    } catch (error) {
        res.status(500).send({
            message: error.message
        });
    }
});

// POST - Add stock (increase stock)
router.post('/add-stock', async function (req, res) {
    try {
        const { product, quantity } = req.body;

        if (!product || !quantity) {
            return res.status(400).send({
                message: 'Product and quantity are required'
            });
        }

        const result = await inventoryController.AddStock(product, quantity);
        res.send({
            message: 'Stock added successfully',
            data: result
        });
    } catch (error) {
        res.status(400).send({
            message: error.message
        });
    }
});

// POST - Remove stock (decrease stock)
router.post('/remove-stock', async function (req, res) {
    try {
        const { product, quantity } = req.body;

        if (!product || !quantity) {
            return res.status(400).send({
                message: 'Product and quantity are required'
            });
        }

        const result = await inventoryController.RemoveStock(product, quantity);
        res.send({
            message: 'Stock removed successfully',
            data: result
        });
    } catch (error) {
        res.status(400).send({
            message: error.message
        });
    }
});

// POST - Reservation (decrease stock, increase reserved)
router.post('/reservation', async function (req, res) {
    try {
        const { product, quantity } = req.body;

        if (!product || !quantity) {
            return res.status(400).send({
                message: 'Product and quantity are required'
            });
        }

        const result = await inventoryController.Reservation(product, quantity);
        res.send({
            message: 'Reservation created successfully',
            data: result
        });
    } catch (error) {
        res.status(400).send({
            message: error.message
        });
    }
});

// POST - Sold (decrease reserved, increase soldCount)
router.post('/sold', async function (req, res) {
    try {
        const { product, quantity } = req.body;

        if (!product || !quantity) {
            return res.status(400).send({
                message: 'Product and quantity are required'
            });
        }

        const result = await inventoryController.Sold(product, quantity);
        res.send({
            message: 'Sale recorded successfully',
            data: result
        });
    } catch (error) {
        res.status(400).send({
            message: error.message
        });
    }
});

module.exports = router;
