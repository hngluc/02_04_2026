var express = require("express");
var router = express.Router();
let { uploadExcel, uploadImage } = require('../utils/uploadHandler')
let path = require('path')
let excelJs = require('exceljs')
let categoriesModel = require('../schemas/categories')
let productsModel = require('../schemas/products')
let inventoriesModel = require('../schemas/inventories')
let mongoose = require('mongoose')
let slugify = require('slugify')
let userModel = require('../schemas/users')

router.post('/one_file', uploadImage.single('file'), function (req, res, next) {
    res.send({
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size
    })
})
router.post('/multiple_file', uploadImage.array('files', 5), function (req, res, next) {
    console.log(req.body);
    res.send(req.files.map(f => {
        return {
            filename: f.filename,
            path: f.path,
            size: f.size
        }
    }))
})
router.get('/:filename', function (req, res, next) {
    let pathFile = path.join(__dirname, '../uploads', req.params.filename)
    res.sendFile(pathFile)
})
router.post('/excel', uploadExcel.single('file'), async function (req, res, next) {
    //workbook->worksheet->row/column->cell
    let workBook = new excelJs.Workbook();
    let pathFile = path.join(__dirname, '../uploads', req.file.filename)
    await workBook.xlsx.readFile(pathFile)
    let worksheet = workBook.worksheets[0];
    let categories = await categoriesModel.find({})
    let categoriesMap = new Map();
    for (const category of categories) {
        categoriesMap.set(category.name, category.id);
    }
    let getProducts = await productsModel.find({})
    let getSKU = getProducts.map(p => p.sku)
    let getTitle = getProducts.map(p => p.title)
    let result = [];
    for (let index = 2; index <= worksheet.rowCount; index++) {
        let rowError = [];
        const row = worksheet.getRow(index)
        let sku = row.getCell(1).value;
        let title = row.getCell(2).value;
        let category = row.getCell(3).value;
        let price = Number.parseInt(row.getCell(4).value);
        let stock = Number.parseInt(row.getCell(5).value);

        if (price < 0 || isNaN(price)) {
            rowError.push("price phai la so duong")
        }
        if (stock < 0 || isNaN(stock)) {
            rowError.push("stock phai la so duong")
        }
        if (!categoriesMap.has(category)) {
            rowError.push("category khong hop le")
        }
        if (getSKU.includes(sku)) {
            rowError.push("sku da ton tai")
        }
        if (getTitle.includes(title)) {
            rowError.push("title da ton tai")
        }
        if (rowError.length > 0) {
            result.push({
                success: false,
                data: rowError
            })
            continue;
        }
        let session = await mongoose.startSession();
        session.startTransaction()
        try {
            let newProduct = new productsModel({
                sku: sku,
                title: title,
                slug: slugify(title, {
                    replacement: '-',
                    remove: undefined,
                    lower: true,
                    strict: true
                }),
                price: price,
                description: title,
                category: categoriesMap.get(category),
            })
            await newProduct.save({ session })
            let newInventory = new inventoriesModel({
                product: newProduct._id,
                stock: stock
            })
            await newInventory.save({ session })
            await newInventory.populate('product')
            await session.commitTransaction();
            await session.endSession()
            result.push({
                success: true,
                data: newInventory
            })
        } catch (error) {
            await session.abortTransaction();
            await session.endSession()
            result.push({
                success: false,
                data: error.message
            })
        }
    }
    res.send(result)
})

router.post('/users/excel', uploadExcel.single('file'), async function (req, res, next) {
    try {
    let crypto = require('crypto');
    let roleModel = require('../schemas/roles');
    let { sendPasswordMail } = require('../utils/mailHandler');

    if (!req.file) {
        return res.status(400).send({ message: 'Vui long chon file Excel (.xlsx)' });
    }

    let workBook = new excelJs.Workbook();
    let pathFile = path.join(__dirname, '../uploads', req.file.filename);
    await workBook.xlsx.readFile(pathFile);
    let worksheet = workBook.worksheets[0];
    
    // Tìm role "user" trong DB
    let userRole = await roleModel.findOne({ name: /user/i });
    if (!userRole) {
        return res.status(400).send({ message: 'Role "user" chua ton tai trong DB. Hay tao role truoc.' });
    }

    let result = [];
    let getUsers = await userModel.find({});
    let getEmails = getUsers.map(u => u.email);
    let getUsernames = getUsers.map(u => u.username);

    for (let index = 2; index <= worksheet.rowCount; index++) {
        let rowError = [];
        const row = worksheet.getRow(index);
        let username = row.getCell(1).value;
        let emailRaw = row.getCell(2).value;
        
        if (!username || !emailRaw) {
            continue;
        }

        let email = typeof emailRaw === 'object' ? (emailRaw.text || emailRaw.hyperlink) : emailRaw;

        if (getUsernames.includes(username)) {
            rowError.push("Username đã tồn tại: " + username);
        }
        if (getEmails.includes(email)) {
            rowError.push("Email đã tồn tại: " + email);
        }

        if (rowError.length > 0) {
            result.push({
                success: false,
                data: rowError
            });
            continue;
        }

        try {
            // Random password 16 ký tự
            let randomPassword = crypto.randomBytes(8).toString('hex'); // 16 chars

            let newUser = new userModel({
                username: username.toString().trim(),
                email: email.toString().trim(),
                password: randomPassword,
                role: userRole._id
            });
            await newUser.save();

            // Gửi email password cho user
            try {
                await sendPasswordMail(email, username, randomPassword);
            } catch (mailErr) {
                console.error('Gui mail that bai cho', email, mailErr.message);
            }

            result.push({
                success: true,
                data: newUser
            });
        } catch (error) {
            result.push({
                success: false,
                data: error.message
            });
        }
    }
    res.send(result);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

module.exports = router;