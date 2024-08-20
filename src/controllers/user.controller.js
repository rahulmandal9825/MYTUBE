import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

const registerUser = asyncHandler( async (req ,res) => {
   const {fullName, email , username, password} = req.body

   if(
    [fullName, email , username, password].some((field)=> field?.trim() === "")
   ){
    throw new ApiError(400 , "all fields is required")
   }

   const existinguser = await User.findOne({
    $or: [{ username } , { email }]
   })

   if (existinguser) {
    throw new ApiError(409 , " user with email or username already exists")
   }

const avatarLocalPath = req.files?.avatar[0]?.path;

const coverImageLoacalPath = req.files.coverImage[0].path;

if (!avatarLocalPath ) {
    throw new ApiError(400, "avatar file is required")
}

const avatar = await uploadOnCloudinary(avatarLocalPath);
const coverImage = await uploadOnCloudinary(coverImageLoacalPath);

if(!avatar){
    throw new ApiError(400, " avatar file  is requred")
}

const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
})

const createdUser = await User.findById(user._id).select(
    "-password  -refreshToken"
)

if(!createdUser){
    throw new ApiError(500, "Something went wrong while registering the user")
}

return res.status(201).json(
    new ApiResponse(200, createdUser, " user registered Successfully")
)


})

export {
    registerUser
}