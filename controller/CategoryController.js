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

