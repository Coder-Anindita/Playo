import asyncHandler from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse  } from "../utils/ApiResponse.js"
import path from "path";
import fs from "fs";
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
    const coverImageLocalPath = path.resolve(req.files.coverImage[0].path);
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
export {registerUser}