const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    whatYouWillLearn: {
        type: String,
    },
    courseContent: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Section"
        }
    ],
    ratingAndReview: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "RatingAndReview"
        }
    ],
    price: {
        type: String,
        trim: true,
    },
    thumbnail: {
        type: String
    },
    tags: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tag"
    },
    studentEnrolled: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ]
})

module.exports = mongoose.model("Course", courseSchema);