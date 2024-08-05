const mongoose = require('mongoose');
const mailSender = require('../util/mailSender');

const otpSchema = new mongoose.Schema({

    email: {
        type: String,
        required: true,
        trim: true,
    },
    otp: {
        type: String,
    },
    createdAt: { 
        type: Date,
        default: Date.now(),
        expires: 10*60*1000,
    }
});

async function sendVerificationEmail(email, otp){
    try{
        const responseEmail = await mailSender(email , "Verification Mail by StudyNotion" ,otp);
        console.log("Email send successfully ", responseEmail);

    }catch(error){

        console.error(error);
        throw error;
    }
}

otpSchema.pre("save", async function(next){
   await sendVerificationEmail(this.email , this.otp);
    next();
})

module.exports = mongoose.model("OTP", otpSchema);