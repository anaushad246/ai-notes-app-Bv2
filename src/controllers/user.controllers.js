import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from '../models/user.model.js';
// import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken'

const generateAccessAndRefreshToken = async(userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        
        // OLD CODE (commented out due to issues):
        // user.accessToken = accessToken; // This was incorrect - accessToken shouldn't be stored in DB
        // user.save({ validateBeforeSave:false }) // Missing await
        
        // NEW CODE (fixed):
        await user.save({ validateBeforeSave:false })
        return {accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(404,"something went wrong")
    }
};

const registerUser = asyncHandler(async (req, res) => {
    console.log(req.files);
    
    // Get user details from frontEnd
    const { username, email, fullname, password } = req.body;
    console.log("email:", email);

    // Validation - not empty
    if ([fullname, username, email, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "Full name, username, email, and password are required");
    }

    // Check if user already exists: username, email
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (existedUser) {
        throw new ApiError(409, "User already exists");
    }

    // Check for avatar image, and upload to Cloudinary
    // const avatarLocalPath = req.files?.avatar?.[0]?.path;
    // console.log(avatarLocalPath);
    
    // const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    // if (!avatarLocalPath) {
    //     throw new ApiError(400, "Avatar file is required");
    // }

    // const avatar = await uploadOnCloudinary(avatarLocalPath);
    // const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;

    // if (!avatar) {
    //     throw new ApiError(400, "Error uploading avatar");
    // }

    // Create user object - create entry in DB
    const user = await User.create({
        fullname,
        // avatar: avatar.url,
        // coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    });

    // Remove refresh token and password field from response
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while creating user");
    }

    // Return response
    res.status(200).json(new ApiResponse(200, createdUser, "User registered successfully"));
});

//login user logic
const loginUser = asyncHandler( async(req,res)=>{
    //req.body => data
    const {username,email,password} = req.body;
    console.log(password);
    
    if ( !(username || email) ) {
        throw new ApiError(400,"username or email is required");
        
    }
    //username or email
    //find the user
   const user = await User.findOne({
        $or:[{username},{email}]
    })

    if (!user) {
        throw new ApiError(404, "user doest not exist" )
    }
    //password check
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(404, "password incorrect" )
    }
    //access and refresh token
    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)
    //send cookie
    const loggedInUser = await User.findById(user._id)
    .select("-password -refreshToken");

    const options = {
        httpOnly:true,
        // secure:true
        secure: process.env.NODE_ENV === 'production'
    }
    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(200,
            {
                user:loggedInUser,refreshToken,accessToken
            },
        "user logged in successfully"
        )
    )

} );


const logOutUser = asyncHandler( async(req,res)=>{
     await User.findByIdAndUpdate(
        req.user._id,
        {
        $set:{
refreshToken: undefined
        }
    })
    const options = {
        httpOnly:true,
        // secure:true
        secure: process.env.NODE_ENV === 'production'
    }
    return res
    .status(200)
    .clearCookie("refreshToken",options)
    .clearCookie("accessToken",options)
    .json( new ApiResponse(200,{},{message:"User logOut successfully"}))

} );

const refreshAccessToken = asyncHandler( async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
        throw new ApiError(401,"unauthorized request");
    }
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError(401,"Invalid refresh token")
        };
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401,"refresh token is expired or used")
        };
    
        const options = {
            httpOnly:true,
            // secure:true
            secure: process.env.NODE_ENV === 'production'
        };
    
        // OLD CODE (commented out due to issues):
        // const {accessToken,newRefreshToken} =  await generateAccessAndRefreshToken(user._id);
        // .cookie("accesstoken",accessToken,options) // Wrong cookie name
        
        // NEW CODE (fixed):
        const {accessToken,refreshToken:newRefreshToken} =  await generateAccessAndRefreshToken(user._id);
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken,refreshToken:newRefreshToken},
                "Access token refreshed"
    
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "invalid refresh token")
    }
} );

const changeCurrentPassword = asyncHandler( async(req,res)=>{
    const {oldPassword,newPassword} = req.body;

    // OLD CODE (commented out due to issues):
    // if ((!oldPassword === newPassword)) { // Wrong logic - this was always true
    //     throw new ApiError(400,"invalid password")
    // }
    // const user = await User.findById(req.user?._id)
    // const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    // // Missing password validation check
    
    // NEW CODE (fixed):
    if (oldPassword === newPassword) {
        throw new ApiError(400,"New password must be different from old password")
    }
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400,"Old password is incorrect")
    }

    user.password = newPassword;
    await user.save({validateBeforeSave:false});

    return res
    .status(200)
    .json( new ApiResponse(200,{},"Password changed successfully"))
} )

const getCurrentUser = asyncHandler( (req,res)=>{
    return res
    .status(200)
    .json( new ApiResponse(200,req.user,"current user fetched successfully"))
} );

const updateAccountDetails = asyncHandler( async(req,res)=>{
    const {fullname,email} = req.body;
    if (!fullname || !email) {
        throw new ApiError(400,"All fields are required")
    }
    
    // OLD CODE (commented out due to issues):
    // const user = await User.findById( // Wrong method - should be findByIdAndUpdate
    //     req.user?._id,
    //     { 
    //         $set:{
    //             fullname,
    //             email: email
    //         }
    //     },
    //     {new:true}
    // ).select("-password ")
    
    // NEW CODE (fixed):
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        { 
            $set:{
                fullname,
                email: email
            }
        },
        {new:true}
    ).select("-password ")

    return res
    .status(200)
    .json( new ApiResponse(200,user,"Account details updated successfully") )
});

// const updateUserAvatar = asyncHandler( async(req,res)=>{
// const avatarLocalPath = req.file?.path;
// if (!avatarLocalPath) {
//     throw new ApiError(400,"Avatar file is missing")
// }
// const avatar = await uploadOnCloudinary(avatarLocalPath);
// if (!avatar?.url) {
//     throw new ApiError(400,"Error while uploading on avatar")
// }

//  const user = await User.findById(
//     req.user._id,
//     {
//         $set:{
//             avatar:avatar.url
//         }
//     },
//     {new:true}
// )
// return res
//     .status(200)
//     .json(new ApiResponse(200,user,"avatar image updated successfully"))
// } )

// const updateUserCoverImage = asyncHandler( async(req,res)=>{
//     const coverImageLocalPath = req.file?.path;
//     if (!coverImageLocalPath) {
//         throw new ApiError(400,"cover image path is missing")
//     }
//     const coverImage = await uploadOnCloudinary(coverImageLocalPath);
//     if (!coverImage?.url) {
//         throw new ApiError(400,"Error while uploading on avatar")
//     }
    
//      const user = await User.findById(
//         req.user._id,
//         {
//             $set:{
//                 coverImage:coverImage.url
//             }
//         },
//         {new:true}
//     )

//     return res
//     .status(200)
//     .json(new ApiResponse(200,user,"Cover image updated successfully"))
// })



export {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    // updateUserAvatar,
    // updateUserCoverImage
};
