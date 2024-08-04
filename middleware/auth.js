const jwt = require('jsonwebtoken');
require('dotenv').config();

// Authentication
exports.auth = async(req, res , next) =>{
    try{
        const token = req.body.token || req.cookies.token || req.header("Authorization").replace("Bearer ", "");

        if(!token){
            return res.status(400).json({
                success: false,
                message: "token not found"
            })
        };
        try{
            const decode = jwt.verify(token , process.env.JWT_SECRET);
            req.user = decode;
        }catch(err){
            console.error(err);
            res.status(401).json({
                success: false,
                message: "Invalid token",
            });
        }
        next();
    }catch(error){
        console.error(error);
        res.status(500).json({
            success: false,
            message: "something went wrong while authentication",
        })
    }
}
// IsAdmin Autherization

exports.isAdmin = async(req, res, next) =>{
    try{
        if(req.user.accountType !== "Admin"){
            return res.status(401).json({
                success: false,
                message: "protected route only for Admin"
            });
        }
        next();
    }catch(error){
        console.error(error);
        res.status(500).json({
            success: false,
            message: "user role can not be varified"
        });
    }
}
// IsInstructor Autherization

exports.isInstructor = async(req, res, next) =>{
    try{
        if(req.user.accountType !== "Instructor"){
            return res.status(401).json({
                success: false,
                message: "protected route only for Instructor"
            });
        }
        next();
    }catch(error){
        console.error(error);
        res.status(500).json({
            success: false,
            message: "user role can not be varified"
        });
    }
}
