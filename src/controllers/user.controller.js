import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {
  uploadOnCloudinary,
  deleteImageCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const genrateAccessAndRefereshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, " someting went wrong while genrating tokens");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "all fields is required");
  }

  const existinguser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existinguser) {
    throw new ApiError(409, " user with email or username already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  console.log(coverImageLocalPath);

  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  console.log(avatar, coverImage);
  if (!avatar) {
    throw new ApiError(400, " avatar file  is requred");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password  -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
  .status(201)
  .json(new ApiResponse(200, createdUser, " user registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!(username || email)) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "user does not exist");
  }

  const isPasswordValid = user.isPassWordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, " invalid credentails");
  }

  const { accessToken, refreshToken } = await genrateAccessAndRefereshToken(
    user._id
  );

  const loggedInuser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(
    new ApiResponse(
      200,
      {
        user: loggedInuser,
        accessToken,
        refreshToken,
      },
      "USer logged in Succeessfully"
    )
  );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponse(200, {}, "user logged out "));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshtoken =
      req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshtoken) {
      throw new ApiError(401, " unauthorized request");
    }

    const decodedToken = jwt.verify(
      incomingRefreshtoken,
      process.env.ACCESS_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshtoken !== user?.refreshToken) {
      throw new ApiError(401, "refersh token is expried or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newrefreshToken } =
      await genrateAccessAndRefereshToken(user._id);

    return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", newrefreshToken, options)
    .json(
      new ApiResponse(
        200,
        { accessToken, refreshToken: newrefreshToken },
        "Access token refreshed"
      )
    );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changecurrentpassword = asyncHandler(async (req, res) => {
  try {
    const { Oldpasword, newpassword, confirmpassword } = req.body;

    if (newpassword !== confirmpassword) {
      throw new ApiError(401, "new password does not match");
    }

    const user = await User.findById(req.user._id);
    const ispasswordCorrect = await user.isPassWordCorrect(Oldpasword);

    if (ispasswordCorrect) {
      throw new ApiError(400, " invaild password");
    }

    user.password = newpassword;
    await user.save({ validateBeforeSave: false });

    return res
    .status(200)
    .json(ApiResponse(201, {}, "password change successfully"));
  } catch (error) {
    throw new ApiError(500, "password chnaging failed");
  }
});

const getCurrentUser = asyncHandler(async (req, res) => {
  try {
    return res.status(200).json(201, req.user, "user fetch successguly");
  } catch (error) {
    throw new ApiError(405, "no User found");
  }
});

const updateAccountDetail = asyncHandler(async (req, res) => {
  try {
    const { fullName, email } = req.body;

    if (!fullName || !email) {
      throw new ApiError(400, "all fieds are required");
    }

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          fullName,
          emial,
        },
      },
      { new: true }
    ).select("-password");

    return res
    .status(200)
    .json(new ApiResponse(201, user, " Account detail update successfully"));
  } catch (error) {
    throw new ApiError(500, "error in updating  account deatail");
  }
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  try {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
      throw new ApiError(400, " Avatar file is missing");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar?.url) {
      throw new ApiError(400, " Error while uploading to cloudnary");
    }

    const user = await User.findByIdAndUpdate(
      req?.user._id,
      {
        $set: {
          avatar: avatar.url,
        },
      },
      {
        new: true,
      }
    ).select("-password");

    if (!user) {
      throw new ApiError(400, " user not found");
    }

    await deleteImageCloudinary(user?.avatar);

    return res
    .status(200)
    .json(new ApiResponse(201, user, " Avatar image updated successfully"));
  } catch (error) {
    throw new ApiError(405, " error in updating useravatar");
  }
});


const updateUsercoverImage = asyncHandler(async (req, res) => {
  try {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
      throw new ApiError(400, " Avatar file is missing");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage?.url) {
      throw new ApiError(400, " Error while uploading to cloudnary");
    }

    const user = await User.findByIdAndUpdate(
      req?.user._id,
      {
        $set: {
          coverImage: coverImage.url,
        },
      },
      {
        new: true,
      }
    ).select("-password");

    if (!user) {
      throw new ApiError(400, " user not found");
    }

    await deleteImageCloudinary(user?.coverImage);

    return res
    .status(200)
    .json(new ApiResponse(201, user, " coverimage image updated successfully"));
  } catch (error) {
    throw new ApiError(405, " error in updating useravatar");
  }
});

const getuserChannelProfile = asyncHandler(async(req,res)=>{
   const {username} = req.params

   if (!username?.trim()) {
      throw new ApiError(400, "username is missing")
   }

   const channel = await User.aggregate([
    {
      $match:{
        username: username?.toLowerCase()
      }
    },
    {
      $lookup:{
        form:"subscriptions",
        localField:"_id",
        foreignField:"channel",
        as:"subscribers"

      }
    },
    {
      $lookup:{
        form:"subscriptions",
        localField:"_id",
        foreignField:"subscriber",
        as:"subscribedTo"
      }
    },
    {
      $addFields:{
        subscribersCount:{
          $size: "$subscribers"
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo"
      },
      isSubscribed:{
        $cond:{
          if:{$in:[req.user?._id, "$subscribers.subscriber"]},
          then:true,
          else:false
        }
      }
      }
    },
    {
      $project:{
        fullName:1,
        username:1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1

      }
     }
   ])

   if(!channel?.length){
    throw new ApiError(404, "channel does not exists")
   }
   return res
   .status(200)
   .json(
       new ApiResponse(200, channel[0], "User channel fetched successfully")
   )
});

const getWatchHistory = asyncHandler(async(req,res)=>{

    const user = await User.aggregate([
      {
        $match:{
          _id: new mongoose.Types.ObjectId(req.user._id)
        }
      },{
        $lookup:{
          form:"videos",
          localField:"watchHistory",
          foreignField:"_id",
          as:"watchHistory",
          pipeline:[
            {
              $lookup:{
                form:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[
                  {
                    $project:{
                      fullName:1,
                      username:1,
                      avatar:1
                    }
                  }
                ]
              }
            },
            {
              $addFields:{
                owner:{
                  $first: "$owner"
                }
              }
            }
          ]

        }
      }
    ])

    return res.status(200).json(
      new ApiResponse(201,  user[0].watchHistory,
        "watch history fetch successfully"
      )
    )
})

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  updateUserAvatar,
  updateAccountDetail,
  getCurrentUser,
  changecurrentpassword,
  updateUsercoverImage,
  getuserChannelProfile,
  getWatchHistory
  
};
