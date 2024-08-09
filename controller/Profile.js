const { findByIdAndDelete } = require('../modal/Course');
const Profile = require('../modal/ProfileSchema');
const User = require('../modal/UserSchema');

// Update profile

exports.updateProfile = async(req, res) =>{
    try{
        const {dateOfBirth = "", about="", phone, gender, profession} = req.body;
        
        const userId = req.user.id;

        // validate
        if(!phone || !gender || !profession){
            return res.status(404).json({
                success: false,
                message: "please enter all the details carefully"
            });
        }else if(!userId){
            return res.json({
                success: false,
                message: "User id not found",
            })
        }

        const userDetails = await User.findById(userId);
        const profileId = userDetails.additionalDetails;
        const profileDetails = await Profile.findById(profileId);

        profileDetails.dateOfBirth = dateOfBirth;
        profileDetails.about = about;
        profileDetails.phone = phone;
        profileDetails.gender = gender;
        profileDetails.profession = profession;

        const updatedDetails = await profileDetails.save();

        return res.status(200).json({
            success: true,
            message: "Updated the profile details successfully",
            updatedDetails
        });

    }catch(error){
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while upadating profile",
            error: error.message
        });
    }
}



// Delete Profile

exports.removeProfile = async(req, res) =>{
    try{
        const userId = req.user.id;

        // validate
        if(!userId){
            return res.json({
                success: false,
                message: "User id not found",
            })
        }
        const user = await User.findById(userId);
        const profileId = user.additionalDetails;

        await Profile.findByIdAndDelete({_id:profileId});
        await User.findByIdAndDelete(userId);

        return res.status(200).json({
            success: true,
            message: "Removed user profile successfully",
        })
    }catch(error){
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while delete profile",
            error: error.message
        });
    }
}