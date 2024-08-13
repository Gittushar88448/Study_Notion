const User = require('../modal/UserSchema');
const Course = require('../modal/Course');
const { instance } = require('../config/razorpay');
const mongoose = require('mongoose');
const mailSender = require('../util/mailSender');
const { verify } = require('jsonwebtoken');
const { courseEnrollmentEmail } = require('../mail/template/courseEnrollment');
const Razorpay = require('razorpay');

exports.capturePayment = async (req, res) => {

    try {
        // fetching the user id and course id
        const userId = req.user.id;
        const { courseId } = req.body;

        // validate user id and course id
        if (!userId || !courseId) {
            return res.status(400).json({
                success: false,
                message: 'Please provide valid id'
            });
        }

        var courseDetails;
        try {
            // fetching course details through course id
            courseDetails = await Course.findById(courseId);

            // validate course details
            if (!courseDetails) {
                return res.status(404).json({
                    success: false,
                    message: "Course details not found",
                });
            }
            // convert the user id having in string format to object 
            const uid = mongoose.Types.ObjectId(userId);

            // check user is already enrolled for the course or not
            if (courseDetails.studentEnrolled.includes(uid)) {
                return res.status(400).json({
                    success: false,
                    message: "User has already enrolled in this course",
                });
            }
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }

        const currency = "INR";

        // price is multiply by 100 because Razorpay takes only amount in multiple of 100
        const amount = courseDetails.price * 100;

        const options = {
            amount: amount,
            currency,
            receipt: Math.random(Date.now()).toString(),
            notes: {
                courseId: courseId,
                userId: userId
            }
        }

        try {
            // initiate payment 
            const paymentResponse = await instance.orders.create(options);
            console.log("Payment response", paymentResponse);

            return res.status(200).json({
                success: true,
                courseName: courseDetails.courseName,
                courseDescription: courseDetails.courseDescription,
                thumbnail: courseDetails.thumbnail,
                orderId: paymentResponse.id,
                currency: paymentResponse.currency,
                amount: paymentResponse.amount
            });

        } catch (error) {
            console.error(error);
            res.json({
                success: false,
                message: "Could not initiate order",
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while capturing payment",
            error: error.message
        });
    }
}


