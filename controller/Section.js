const Course = require('../modal/Course');
const Section = require('../modal/SectionSchema');

// Create Section

exports.createSection = async (req, res) => {
    try {
        const { courseId, sectionName } = req.body;

        if (!courseId || !sectionName) {
            return res.status(400).json({
                success: false,
                message: "Please enter all the fields"
            });
        }

        const newSection = await Section.create({ sectionName: sectionName });

        console.log("New section", newSection);

        // HW: populate the nested courseContent
        const updateCourseContent = await Course.findByIdAndUpdate(
            {_id:courseId},
            { $push: { courseContent: newSection._id } },
            { new: true })
            .populate({
                path: 'courseContent',
                populate: {
                    path: 'subSection'
                }
            }
            ).exec();

            console.log("Updated course content", updateCourseContent);


        return res.status(200).json({
            success: true,
            message: "Section created successfully",
            updateCourseContent
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while create section",
            error: error.message
        });
    }
}


