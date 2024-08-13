
const Category = require('../modal/CategorySchema');
const User = require('../modal/UserSchema');
const { imageUploadToCloudinary } = require('../util/imageUploader');
require('dotenv').config();
const Course = require('../modal/Course');

// Course creation  
exports.createCourse = async (req, res) => {

    try {
        // fetching details from request's body
        const { courseName, courseDescription, whatYouWillLearn, price, category, tag } = req.body;

        // fetching file thumbnail image
        const thumbnail = req.files.thumbnailImage;

        console.log("thumbnail ",thumbnail);

        // Validation
        if (!courseName || !courseDescription || !whatYouWillLearn || !price || !tag || !category) {
            return res.status(400).json({
                success: false,
                message: "Please enter all the details carefully",
            });
        }

        // fetching user id from user token
        const userId = req.user.id;
        
        // Instructor Validation
        if (!userId) {
            return res.status(404).json({
                success: false,
                message: "User id not found"
            })
        }

        // fetching instructor details
        const instructorDetails = await User.findById(userId);
        console.log("Instructor details", instructorDetails);


        // validate
        if (!instructorDetails) {
            return res.status(404).json({
                success: false,
                message: "Instructor details not found in database"
            });
        }

        const categoryDetails = await Category.findById(category);

        if (!categoryDetails) {
            return res.status(404).json({
                success: false,
                message: "category details not found in the collection"
            });
        }
        console.log("category details", categoryDetails);

        const thumbnailUpload = await imageUploadToCloudinary(thumbnail, process.env.FOLDER_NAME);
        console.log("Thumbnail upload",thumbnailUpload);

        const newCourse = await Course.create({
            courseName,
            courseDescription,
            instructor: instructorDetails._id,
            whatYouWillLearn: whatYouWillLearn,
            price,
            tag: tag,
            category: categoryDetails._id,
            thumbnail: thumbnailUpload.secure_url,
        });

        await User.findByIdAndUpdate({ _id: userId }, {
            $push: {
                courses: newCourse._id
            }
        }, { new: true });

        await Category.findByIdAndUpdate(
            { _id: category },
            {$push:{course: newCourse._id,}},
            { new: true }
        )

        res.status(200).json({
            success: true,
            message: "Course created successfully",
            newCourse
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while creating course"
        })
    }


}

// Getting all courses

exports.getAllCourses = async (req, res) => {
    try {
        const allCourse = await Course.find({}, {
            courseName: true,
            price: true,
            thumbnail: true,
            instructor: true,
            ratingAndReview: true,
            studentEnrolled: true,
        }).populate("instructor").populate('ratingAndReview');

        res.status(200).json({
            success: true,
            message: "getting all the course successfully",
            allCourse,
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: false,
            message: "something went wrong while getting all courses"
        });
    }
}

// get course details

exports.getCourseDetails = async (req, res) => {

    try {
        const { courseId } = req.body;

        const courseDetails = await Course.findById(courseId).populate(
                                                {
                                                    path: "instructor",
                                                    populate: {
                                                        path: "additionalDetails"
                                                    }
                                                }
                                            ).populate(
                                                {
                                                    path: "courseContent",
                                                    populate: {
                                                        path: "subSection"
                                                    }
                                                }
                                            ).populate(
                                                {
                                                    path: "ratingAndReview",
                                                    populate: {
                                                        path: "user",
                                                        path: "course"
                                                    }
                                                }
                                            ).populate(
                                                {
                                                    path: "category",
                                                    populate: {
                                                        path: "course"
                                                    }
                                                }
                                            ).populate("studentEnrolled");



        if(!courseDetails){
            return res.status(404).json({
                status: false,
                message: "course details not found",
                error: error.message,
            });
        }

        return res.status(200).json({
            success: true,
            message: "course fetched successfully",
            data: courseDetails
        })

    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: false,
            message: "something went wrong while getting course details"
        });
    }
}
