import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from 'jsonwebtoken'; // Added missing jwt import

export const verifyJWT = asyncHandler( async(req,res,next)=>{
    try {
        const accessToken = req.cookies?.accessToken || req.header("Authorization")
        ?.replace("Bearer ","")
        
        // ✅ ADD THIS LOG
        console.log("Backend received accessToken:", accessToken);
        // OLD CODE (commented out due to issues):
        // if (!token) {
        //     throw new ApiError(401,"unAuthorized request")
        // }
        // const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        
        // NEW CODE (fixed):
        if (!accessToken) {
            throw new ApiError(401,"Unauthorized request. Please log in again.")
        }
    
        const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    
       const user =  await User.findById(decodedToken?._id).select("-password -refreshToken");
       if (!user) {
         // ✅ THIS IS THE MOST IMPORTANT LOG
        console.log(`AUTH_DEBUG: User not found for ID: ${decodedToken?._id}`);
        //TODO: discuss about frontend
        throw new ApiError(401,"invalid access token")
       }
       req.user = user;
        // ✅ THIS IS THE MOST IMPORTANT LOG
        console.log(`AUTH_DEBUG: JWT verified for user '${user.username}'. Proceeding to the next handler.`);
       next()
    } catch (error) {
        // ✅ THIS LOG WILL CATCH ANY ERRORS (like an expired token)
        console.error("AUTH_DEBUG: An error occurred inside verifyJWT.", error.message);
        throw new ApiError(401,error?.message || "Invalid access token")
    }
} )