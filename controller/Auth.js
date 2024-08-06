const User = require('../modal/UserSchema');
const OTP = require('../modal/OTP');
const otpGenerator = require('otp-generator');
const bcrypt = require('bcrypt');
const Profile  = require('../modal/ProfileSchema');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const mailSender = require('../util/mailSender');


// Send Otp
exports.sendOtp = async(req, res) =>{
    try{

        // fetching email from request's body
        const {email} = req.body;

        // Validate email
        if(!email){
            res.json({
                success: false,
                message: "please enter the email address"
            });
        }

        // find user from the collection on the basis of email
        const existingUser = await OTP.findOne({email});

        //  existing user or user is already exist
        if(existingUser){
            res.status(401).json({
                success: false,
                message: "user is already exist, please login"
            })
        }

        // send otp
        var otp = otpGenerator.generate(6 ,{
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        })

        // for unique otp
        const result = await OTP.findOne({otp: otp});

        while(result){
            otp = otpGenerator.generate(6 ,{
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false,
            })
            result = await OTP.findOne({otp: otp});
        }
        console.log(otp);

        const otpPayload = {email, otp};

        // save entry to database
        const otpData = await OTP.create(otpPayload);
        console.log(otpData);

        res.status(200).json({
            success: true,
            message: "OTP send successfully to the user"
        });

    }catch(error){
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Something went wrong while sending otp",
        })
    }
}


