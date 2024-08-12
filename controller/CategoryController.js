const Category = require('../modal/CategorySchema');
// createTags

exports.createCategory = async (req, res) => {

    try {
        const { name, description } = req.body;

        if (!name || !description) {
            return res.status(400).json({
                success: false,
                message: "please enter all the details carefully"
            });
        }

        const categoryCreate = await Category.create(
            { name: name, description: description }
        );

        res.status(200).json({
            success: true,
            message: "Category create successfully",
            categoryCreate,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while creating Category",
            error: error.message,
        });
    }

}

// Get all the category

exports.getAllCategory = async (req, res) => {
    try {

        const categoriesData = await Category.find(
            {},
            { name: true, description: true }
        );

        res.status(200).json({
            success: true,
            message: "Getting all the categories successfully",
            categoriesData,
        })

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while getting Category",
            error: error.message,
        });
    }
}

// getting category page details

exports.getCategoryPageDetails = async(req, res) =>{
    try{
        const {categoryId} = req.body;

        if(!categoryId){
            return res.status(404).json({
                success: false,
                message: "Failed to fetch category id",
            });
        }

        const selectedCategory = await Category.findOne({_id: categoryId}).populate("course").exec();

        if(!selectedCategory){
            return res.status(404).json({
                success: false,
                message: "Course details not found"
            })
        }

        //Handling the case when no course found for that particular id
        if(selectedCategory.course.length === 0){
            console.log("No course found for particular id");
            return res.status(404).json({
                success: false,
                message: "Courses not available for this category"
            })
        }

        const selectedCourses = selectedCategory.course;

        // get courses from other category

        const categoryExceptSelectedCategory = await Category.find({_id: {$ne: categoryId}}).populate("course").exec();

        const differentCourse = [];

        for(const category of categoryExceptSelectedCategory){
            differentCourse.push(category.course);
        }

        // finding top 10 most selling courses
        const topCategory = await Category.find().populate("course").exec();
        const topCourse = topCategory.flatMap((category) => category.course);
        const topMostSellingCourse = topCourse.sort((a,b) => b.sold - a.sold).slice(0, 10);

        return res.status(200).json({
            success: true,
            selectedCourses: selectedCourses,
            differentCourse: differentCourse,
            topMostSellingCourse: topMostSellingCourse,
        })

    }catch(error){
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while getting Category page details",
            error: error.message,
        });
    }
}