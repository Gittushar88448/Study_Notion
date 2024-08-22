const { default: mongoose } = require("mongoose");
const Course = require("../modal/Course");
const RatingAndReview = require("../modal/RatingAndReviewSchema");
const User = require('../modal/UserSchema');


exports.createReviewAndRating = async (req, res) => {
    try {
        // get course id and user id 
        const userId = req.user.id

        const { review, rating, courseId } = req.body;

        //validate
        if (!courseId || !review || !rating) {
            return res.status(404).json({
                success: false,
                message: "data not found",
            });
        }

        //check if user is already enrolled or not
        const courseDetails = await Course.findOne({
            _id: courseId,
            studentEnrolled: { $elemMatch: { $eq: userId } }
        }
        )

        if (!courseDetails) {
            return res.status(404).json({
                success: false,
                message: "User is not enrolled for this course"
            });
        }

        //create a rating and review
        const newReviewAndRating = await RatingAndReview.create({
            rating: rating,
            review: review,
            course: courseId,
            user: userId
        });

        // update the rating and review in course schema
        const updatedInCourse = await Course.findByIdAndUpdate(
            { _id: courseId },
            { $push: { ratingAndReview: newReviewAndRating._id } },
            { new: true }
        ).populate("ratingAndReview").exec();

        //return response
        return res.status(200).json({
            success: true,
            message: "you have successfully submitted your views towards this course",
            updatedInCourse,
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while rating this course"
        });
    }
}

// Getting average reviews and ratings

exports.getAvgdRatings = async(req, res) =>{
    try{
        const {courseId} = req.body;

        const result = await RatingAndReview.aggregate(
            [
                {
                    $match: {course: mongoose.Types.ObjectId(courseId)}
                },
                {
                    $group: {
                        _id: null,
                        averageRating: {$avg: "$rating"},
                    }
                }
            ]
        );

        if(result.length > 0){
            return res.status(200).json({
                success: true,
                message: "Successfully gets the average rating",
                averageRating: result[0].averageRating,
            })
        }

        return res.status(404).json({
            success: false,
            message: "Data is empty",
            averageRating: 0
        })

    }catch(error){
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while getting average reviews and ratings this course"
        });
    }
}


// get all the review and ratings instead of object id

exports.getAllReviewsAndRatings = async(req, res) =>{
    try{
        const result = await RatingAndReview.find({}).sort({rating: "desc"}).populate({
            path: "user",
            select: "firstName , lastName , email , image",
        }).populate({
            path: "course",
            select: "courseName"
        }).exec();
        
        return res.status(200).json({
            success: false,
            message: "Successfully fetched all the rating and reviews",
            result
        })
    }catch(error){
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while getting all reviews and ratings this course"
        });
    }
}