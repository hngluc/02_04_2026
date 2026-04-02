let express = require('express');
let router = express.Router();
const { checkLogin } = require('../utils/authHandler');
let messageModel = require('../schemas/messages');
let { uploadImage } = require('../utils/uploadHandler');

// GET "/" - lay message cuoi cung cua moi cuoc hoi thoai voi user hien tai
router.get('/', checkLogin, async function (req, res, next) {
    try {
        let currentUserId = req.user._id;

        let messages = await messageModel.aggregate([
            {
                $match: {
                    $or: [
                        { from: currentUserId },
                        { to: currentUserId }
                    ]
                }
            },
            { $sort: { createdAt: -1 } },
            {
                $addFields: {
                    otherUser: {
                        $cond: {
                            if: { $eq: ["$from", currentUserId] },
                            then: "$to",
                            else: "$from"
                        }
                    }
                }
            },
            {
                $group: {
                    _id: "$otherUser",
                    lastMessage: { $first: "$$ROOT" }
                }
            },
            { $replaceRoot: { newRoot: "$lastMessage" } },
            { $sort: { createdAt: -1 } }
        ]);

        await messageModel.populate(messages, [
            { path: 'from', select: 'username fullName avatarUrl' },
            { path: 'to', select: 'username fullName avatarUrl' }
        ]);

        res.send(messages);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

// GET "/:userID" - lay tat ca message giua user hien tai va userID
router.get('/:userID', checkLogin, async function (req, res, next) {
    try {
        let currentUserId = req.user._id;
        let otherUserId = req.params.userID;

        let messages = await messageModel.find({
            $or: [
                { from: currentUserId, to: otherUserId },
                { from: otherUserId, to: currentUserId }
            ]
        })
            .sort({ createdAt: 1 })
            .populate('from', 'username fullName avatarUrl')
            .populate('to', 'username fullName avatarUrl');

        res.send(messages);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

// POST "/" - gui message (text hoac file)
router.post('/', checkLogin, uploadImage.single('file'), async function (req, res, next) {
    try {
        let currentUserId = req.user._id;
        let { to, text } = req.body;

        if (!to) {
            return res.status(400).send({ message: "to la bat buoc" });
        }

        let messageContent;
        if (req.file) {
            messageContent = {
                type: "file",
                text: req.file.path
            };
        } else {
            if (!text) {
                return res.status(400).send({ message: "text la bat buoc khi khong gui file" });
            }
            messageContent = {
                type: "text",
                text: text
            };
        }

        let newMessage = new messageModel({
            from: currentUserId,
            to: to,
            messageContent: messageContent
        });

        await newMessage.save();
        await newMessage.populate('from', 'username fullName avatarUrl');
        await newMessage.populate('to', 'username fullName avatarUrl');

        res.send(newMessage);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

module.exports = router;
