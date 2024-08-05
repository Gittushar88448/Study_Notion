const nodemailer = require('nodemailer');
require('dotenv').config();

const mailSender = async(email, title, body) =>{
    try{
        let transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            auth: {
                user: process.env.Mail_USER,
                pass: process.env.MAIL_PASS,
            }
        });

        const info = await transporter.sendMail({
            from: "code by Tushar" || "Study Notion",
            to: `${email}`,
            subject: `${title}`,
            html: `${body}`,
        })
        console.log(info);
        return info;
    
    }catch(error){
        console.error("error while sending email", error);
    }
    
}

module.exports = mailSender;