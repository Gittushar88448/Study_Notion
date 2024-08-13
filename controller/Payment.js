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



//verify Signature of Razorpay and Server
exports.verifySignature = async (req, res) => {

    try {
        const webhookSecret = '1234567'
        const signature = req.headers['x-razorpay-signature'];

        // encrypts webhookSecret
        const shasum = await Crypto.createHmac('sha256', webhookSecret);
        shasum.update(JSON.stringify(req.body));
        const digest = shasum.digest('hex');

        if (digest === signature) {
            console.log("Payment is Authorized");

            // Get the Course id and user id from notes
            const { courseId, userId } = req.body.payload.payment.entity.notes;

            try {

                // update course schema by adding user id into studentEnrolled field
                const updatedEnrolledCourse = await Course.findByIdAndUpdate(
                    { _id: courseId },
                    { $push: { studentEnrolled: userId } },
                    { new: true }
                ).populate("studentEnrolled").exec();

                console.log("Updated enrolled course ", updatedEnrolledCourse);

                // Validate the update enrolled course
                if (!updatedEnrolledCourse) {
                    return res.status(500).json({
                        success: false,
                        message: "Failed to update course schema"
                    });
                }

                // update User schema by adding course id into courses field
                const updatedEnrolledStudent = await User.findByIdAndUpdate(
                    { _id: userId },
                    { $push: { courses: courseId } },
                    { new: true }
                ).populate("courses").exec();

                console.log("Updated enrolled user ", updatedEnrolledStudent);

                // validate the updated student schema
                if (!updatedEnrolledStudent) {
                    return res.status(500).json({
                        success: false,
                        message: "Failed to update user schema"
                    });
                }

                // Increment the 'sold' count by 1
                const updatedCourse = await Course.findByIdAndUpdate(
                    courseId,
                    { $inc: { sold: 1 } }, // Increment the 'sold' field by 1
                    { new: true } // Return the updated document
                );

                if (!updatedCourse) {
                    return res.status(404).json({
                        success: false,
                        message: "course not update"
                    })
                }

                // mail send
                const emailResponse = await mailSender(
                    updatedEnrolledStudent.email,
                    'Congratulations from StudyNotion',
                    courseEnrollmentEmail(updatedEnrolledCourse.courseName, updatedEnrolledStudent.firstName)
                );

                console.log(emailResponse);
                return res.status(200).json({
                    success: true,
                    message: "Signature Verified and COurse Added",
                });

            } catch (error) {
                console.error(error);
                res.status(500).json({
                    success: false,
                    error: error.message
                })
            }

        } else {
            return res.status(500).json({
                success: false,
                message: "signature not verified"
            })
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "something went wrong while verifying signature",
            error: error.message
        })
    }
}