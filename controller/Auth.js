const User = require('../modal/UserSchema');
const OTP = require('../modal/OTP');
const otpGenerator = require('otp-generator');
const bcrypt = require('bcrypt');
const Profile = require('../modal/ProfileSchema');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const mailSender = require('../util/mailSender');
const {passwordUpdated} = require('../mail/template/passwordUpdate')


// Send Otp
exports.sendOtp = async (req, res) => {
    try {

        // fetching email from request's body
        const { email } = req.body;

        // Validate email
        if (!email) {
            res.json({
                success: false,
                message: "please enter the email address"
            });
        }

        // find user from the collection on the basis of email
        const existingUser = await OTP.findOne({ email });

        //  existing user or user is already exist
        if (existingUser) {
            res.status(401).json({
                success: false,
                message: "user is already exist, please login"
            })
        }

        // send otp
        var otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        })

        // for unique otp
        const result = await OTP.findOne({ otp: otp });

        while (result) {
            otp = otpGenerator.generate(6, {
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false,
            })
            result = await OTP.findOne({ otp: otp });
        }
        console.log(otp);

        const otpPayload = { email, otp };

        // save entry to database
        const otpData = await OTP.create(otpPayload);
        console.log(otpData);

        res.status(200).json({
            success: true,
            message: "OTP send successfully to the user"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Something went wrong while sending otp",
        })
    }
}


// Signup 
exports.signup = async (req, res) => {
    try {
        // Fetching information
        const { firstName, lastName, email, accountType, password, confirmPassword, otp, contactNumber } = req.body;

        // validate Information
        if (!firstName || !lastName || !email || !password || !otp || !contactNumber) {
            return res.json({
                success: false,
                message: "Please fill all the details"
            })
        }
        // validate password
        if (password !== confirmPassword) {
            return res.json({
                success: false,
                message: "password not matched"
            });
        }

        if (contactNumber.length !== 10) {
            return res.json({
                success: false,
                message: "Please enter the valid contact number",
            });
        }

        // fetching the existing user entry in database
        const existingUser = await User.findOne({ email });

        // validate existing User
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User is already Signed up"
            })
        };

        // find most recent otp from the OTP collection
        const recentOtp = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1);

        // validate recent OTP
        if (recentOtp.length == 0) {
            return res.json({
                success: false,
                message: "OTP not found"
            })
        }

        if (otp !== recentOtp[0].otp) {
            return res.json({
                success: false,
                message: "Invalid otp"
            });
        }

        // password encrypting by 10 rounds
        let hashedPassword = bcrypt.hash(password, 10);

        // creating null entry in profile schema
        const profileDetails = await Profile.create({
            gender: null,
            dateOfBirth: null,
            about: null,
            phone: null,
        });

        const user = await User.create({
            firstName,
            lastName,
            email,
            contactNumber: contactNumber,
            password: hashedPassword,
            accountType,
            additionalDetails: profileDetails._id,
            image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`
        });

        res.status(200).json({
            success: true,
            user,
            message: "user entry has been created Successfully in database"
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while signup"
        });
    }
}
// Login
exports.login = async (req, res) => {
    try {
        // fetching data from request's body
        const { email, password } = req.body;

        // Validate data
        if (!email || !password) {
            return res.json({
                success: false,
                message: "Please fill all the details"
            });
        }
        // fetching user details exists in db or not
        const user = await User.findOne({ email }).populate('additionalDetails');

        // if user details not present
        if (!user) {
            return res.status(409).json({
                success: false,
                message: "User is not registered , Please first registered yourself",
            })
        }


        if (await bcrypt.compare(password, user.password)) {

            const payload = {
                email: user.email,
                id: user._id,
                accountType: user.accountType,
            }

            const token = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn: "2h",
            });

            user.token = token;
            user.password = undefined;

            const options = {
                expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                httpOnly: true,
            }

            res.cookie("token", token, options).status(200).json({
                success: true,
                token,
                user,
                message: "Cookie has been sent successfully"
            })
        } else {
            return res.json({
                success: false,
                message: "Password incorrect"
            })
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "something went wrong while login"
        })
    }
}


// ChangePassword
exports.changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword, confirmPassword } = req.body;
        const userId = req.user.id;

        // validate 
        if (!oldPassword || !newPassword || !confirmPassword) {
            return res.json({
                success: false,
                message: "Please fill all the details",
            })
        } else if (newPassword !== confirmPassword) {
            return res.status(401).json({
                success: false,
                message: "Password not matched",
            });
        }

        const user = await User.findById(userId);


        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User details not found",
            });
        }


        if (await bcrypt.compare(oldPassword, user.password)) {

            const hashedPassword = bcrypt.hash(newPassword, 10);

            const updatedUserDetails = await User.findByIdAndUpdate(
                { _id: userId },
                { password: hashedPassword },
                { new: true }
            );
            // Send notification email
            try {
                const emailResponse = await mailSender(
                    updatedUserDetails.email,
                    "Password Updated Successfully",
                    passwordUpdated(
                        updatedUserDetails.email,
                        `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
                    )
                );
                console.log("Email sent successfully:", emailResponse.response);
            } catch (error) {
                // If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
                console.error("Error occurred while sending email:", error);
                return res.status(500).json({
                    success: false,
                    message: "Error occurred while sending email",
                    error: error.message,
                });
            }
        } else {
            return res.status(401).json({
                success: false,
                message: "password is incorrect"
            })
        }
        res.status(200).json({
            success: true,
            message: "Password changed successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "something went wrong while changing password"
        })
    }
}