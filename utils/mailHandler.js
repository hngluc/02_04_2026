const nodemailer = require("nodemailer");


const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 25,
    secure: false, // Use true for port 465, false for port 587
    auth: {
        user: "46731643d1ff9a",
        pass: "14fd99e23810a6",
    },
});
module.exports = {
    sendMail: async function (to,url) {
        const info = await transporter.sendMail({
            from: 'hehehe@gmail.com',
            to: to,
            subject: "reset password URL",
            text: "click vao day de doi pass", // Plain-text version of the message
            html: "click vao <a href="+url+">day</a> de doi pass", // HTML version of the message
        });

        console.log("Message sent:", info.messageId);
    },
    sendPasswordMail: async function (to, username, password) {
        const info = await transporter.sendMail({
            from: 'hehehe@gmail.com',
            to: to,
            subject: "Thong tin tai khoan cua ban",
            text: `Username: ${username}\nPassword: ${password}`,
            html: `<h3>Chào ${username},</h3>
                   <p>Tài khoản của bạn đã được tạo thành công.</p>
                   <p><b>Username:</b> ${username}</p>
                   <p><b>Password:</b> ${password}</p>
                   <p>Vui lòng đổi mật khẩu sau khi đăng nhập lần đầu.</p>`,
        });
        console.log("Password mail sent to:", to, info.messageId);
    }
}
