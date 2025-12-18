import asyncHandler from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse  } from "../utils/ApiResponse.js"
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async (userId) => {
  const user = await User.findById(userId);

  console.log("USER FOUND:", user._id);
  console.log("METHODS:", Object.getOwnPropertyNames(Object.getPrototypeOf(user)));

  const accessToken = user.generateAccessToken();
  console.log("ACCESS TOKEN OK");

  const refreshToken = user.generateRefreshToken();
  console.log("REFRESH TOKEN OK");

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  console.log("USER SAVED");

  return { accessToken, refreshToken };
};
const registerUser=asyncHandler(async(req,res)=>{
    //get user details from frontend
    //validation not empty
    //check if user already exists:username,email
    //check for images ,check for avatoar
    //upload them to cloudinary
    //create user object -create ntry in db
    //remove password and refresh token field from response
    //check for user creation
    //return res


    const {fullName,email,username,password}=req.body
    console.log("email :",email);

    //check validations
    if(fullName===""){
        throw new ApiError(400,"Fullname is required")

    }
    if(email===""){
        throw new ApiError(400,"email is required")

    }
    if(username===""){
        throw new ApiError(400,"username is required")

    }
    if(password===""){
        throw new ApiError(400,"password is required")

    }

    //check unique username
    const existedUser=await User.findOne({
        $or:[{username},{email}]
    })
    if(existedUser){
        throw new ApiError(409,"User with same email and username already exist")
    }


    //check for images ,check for avatoar

    

    const avatarLocalPath = path.resolve(req.files.avatar[0].path);
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage)&& req.files.coverImage.length>0){
        coverImageLocalPath=req.files.coverImage[0].path
    }
    console.log("Files:",req.files)
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar files is required")
    }
    console.log(avatarLocalPath);

    //upload them to cloudinary
    console.log(
    "Exists:",
    fs.existsSync(avatarLocalPath),
    avatarLocalPath
);

    const avatarCloudInstance=await uploadOnCloudinary(avatarLocalPath)
    const coverImageCloudInstance=await uploadOnCloudinary(coverImageLocalPath)
    console.log(avatarCloudInstance)
    if(!avatarCloudInstance){
        throw new ApiError(400,"Avatar is required!")
    }


    //create user object -create entry in db
    const user=await User.create({
        fullName,
        avatar:avatarCloudInstance.url,
        coverImage:coverImageCloudInstance?.url || "",
        email,
        password,
        username:username.toLowerCase()

    })
    const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user")
    }


    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered successfully")
    )





 
    
});

const loginUser=asyncHandler(async(req,res)=>{
    //req body->data
    //username or email
    //find the user
    //password check
    //access and refreshtoken 
    //send cookie



    //req body data
    const {email,username,password}=req.body
    if(!username && !email){
        throw new ApiError(400,"username or email is required")

    }
    const user=await User.findOne({
        $or:[{username},{email}]
    })
    if(!user){
        throw new ApiError(404,"user does not exists")

    }

    const isPasswordValid=await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,"invalid user credentials")
    }


    const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id)
    const loggedInUser=await User.findById(user._id).select("-password -refreshToken")

    const options={
        httpOnly:true,
        secure:true
    }
    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser,accessToken,refreshToken
            },
            "User logged in successfully"
        )
    )
    
    








});

const logoutUser=asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
            
        },
        {
            new:true
            
        }
    )
    const options={
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged Out"))

})
const refreshAccessToken=asyncHandler(async (req,res)=>{
    const incommingRefreshToken=req.cookies.refreshToken || req.body.refreshToken
    if(incommingRefreshToken){
        throw new ApiError(401,"unauthorized request")
    }

    const decodedToken=jwt.verify(
        incommingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    )
    const user=await User.findById(decodedToken?._id)
    if(!user){
        throw new ApiError(401,"Invalid refresh token")
    }

    if(incommingRefreshToken!==user?.refreshToken){
        throw new ApiError(401,"Refresh token is expired or used")
    }
    const options={
        httpOnly:true,
        secure:true
    }
    const {accessToken,newRefreshToken}=await generateAccessAndRefreshTokens(user._id)
    await generateAccessAndRefreshTokens(user._id)
    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newRefreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                accessToken,refreshToken:newRefreshToken
            },
            "AccessToken refreshed"

        )
    )



})

const changeCurrentPassword=asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword}=req.body
    const user=await User.findById(req.user?._id)
    const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect){
        throw ApiError(400,"Invalid old password")
    }
    user.password=newPassword
    await user.save({validateBeforeSave:false})
    return res.status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Password changed sucessfully"
        )
    )


})
const getCurrentUser=asyncHandler(async(req,res)=>{
    return res.status(200)
    .json(200,req.user,"user fetched sucessfully")
    
})
const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {fullName,email}=req.body
    if(!fullName || !email){
        throw new ApiError(400,"All fields are required")
    }
    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName:fullName,
                email:email
            }
        },
        {new:true}
    ).select(-"-password")

    return res.status(200)
    .json(new ApiResponse(200,user,"Detailed updated sucessfully"))
})




const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }
    const newAvatar=await uploadOnCloudinary(avatarLocalPath)
    if(!newAvatar.url){
        throw new ApiError(400,"Error while uploading on avatar")
    }
    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{avatar:newAvatar.url}
        },
        {new:true}
    ).select(-"-password")

    return res.status(200)
    .json(new ApiResponse(200,user,"Avatar changed successfully"))



})

const updateCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath=req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(401,"Cover image missing")
    }
    const newCoverImage=await uploadOnCloudinary(coverImageLocalPath)
    if(!newCoverImage){
        throw new ApiError(400,"Error in uploading the coverImage")
    }
    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:newCoverImage.url
            }
        },
        {new:true}
    ).select("-password")

    return res.status(200)
    .json(new ApiResponse(200,user,"Cover image changed successfully"))
})
export {registerUser
    ,loginUser
    ,logoutUser
    ,refreshAccessToken
    ,changeCurrentPassword
    ,getCurrentUser
    ,updateAccountDetails
    ,updateUserAvatar
    ,updateCoverImage
}