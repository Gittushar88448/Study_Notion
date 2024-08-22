const User = require('../modal/UserSchema');
const mailSender = require('../util/mailSender');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// resetPasswordToken
exports.resetPasswordToken = async(req, res) =>{
    try{
        const {email} = req.body;
        const user = await User.findOne({email});

        if(!user){
            return res.status(404).json({
                success: false,
                message: "user is not regestered",
            });
        }

        // generate token
        const token = crypto.randomUUID();
        console.log("random uuid token",token);

        // update user by adding token and expiring time
        const updatedDetails = await User.findByIdAndUpdate({_id: user._id},
                                                            {
                                                                token: token,
                                                                resetPasswordExpires: Date.now() + 5*60*1000,
                                                            },
                                                            {new: true}
        );

        //custom url which sends to the user
        const url = `http://localhost:3000/updatePassword/${token}` 

        await mailSender(email,"Password Reset",
			`Your Link for email verification is ${url}. Please click this url to reset your password.`);

        res.status(200).json({
            success: true,
            updatedDetails,
            message: "update details and send mail of reset password having url successfully",
        })
    }catch(error){
        console.error(error);
        res.status(500).json({
            success: false,
            message: "something went wrong while updating the reset password details"
        })
    }
}


// resetPassword 

exports.resetPassword = async(req, res) =>{
    try{
        const { password , confirmPassword , token} = req.body;

        if(password !== confirmPassword){
            return res.status(401).json({
                success: false,
                message: "Password not matched with confirm password"
            });
        }
    
        const userDetails = await User.findOne({token: token});

        if(userDetails.resetPasswordExpires  < Date.now()){
            return res.json({
                success: false,
                message: "Password reset token expires"
            });
        }

        const hashedPassword = await bcrypt.hash(password , 10);

         const updatedPassword = await User.findByIdAndUpdate({_id: userDetails._id},
                                    {
                                        password: hashedPassword,
                                    },
                                    {
                                        new: true
                                    }
        );

        res.status(200).json({
            success: true,
            updatedPassword,
            message: "Password updated successfully"
        })

    }catch(error){
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while reseting the password"
        });
    }
}