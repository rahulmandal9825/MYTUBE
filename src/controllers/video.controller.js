import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {
  uploadOnCloudinary,
  deleteImageCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";

const getAllvideo = asyncHandler(async(req , res)=>{

    const {page=1 , limit =10 , query, sortBy , sortType, userId} = req.query

    const videos = await Video.aggregatePaginate(query, {
        page: parseInt(page),
        limit: parseInt(limit),
        sort:{[sortBy]: sortType}
        userId: isValidObjectId(userId) ? userId : null,
        customLabels:{
            docs:"videos"
        }

    })
    if (!video) {
        throw new ApiError(400, " video is not found!")
    }

    return res.status(200)
    .json(new ApiResponse(200,{videos:videos},"Videos are fetched successfully"))
})

const publishedVideo = asyncHandler(async(req, res)=>{
   const {title , description} = req.body;
   
   const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
   const videoLocalPath = req.files?.videofile[0]?.path;

   if([title, description,thumbnailLocalPath,videoLocalPath].some((field)=> field?.trim() === "")){
    throw new ApiError(400, " All field are required!")
   }

   const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
   const videofile = await uploadOnCloudinary(videoLocalPath);

   if(!thumbnail){
    throw new ApiError(400, "thumnail link is requied")
   }
   if (!videofile) {
    throw new ApiError(400, "videofile link is requied")
   }
   
   const video = await Video.create({
    vidioFile: videofile.url,
    thumbnail: thumbnail.url,
    title,
    description,
    duration: videofile.duration,
    isPublished: true,
    owner: req.user?._id

   })

   if (!video) {
    throw new ApiError(500, "Shoming went wrong wile uploading")
   }
   return res.status(200).json(
    new ApiResponse(200, video, "VIdeo is publish succesfully")
   )


});

const getvideobyId = asyncHandler(async(req, res)=>{
    const { videoId } = req.params

   if (!isValidObjectId(videoId)) {
    throw new ApiError(400, " invild id ")
   }
   const video = await Video.findById(videoId)
   if (!video) {
     throw new ApiError(404 , " video is not found")
   }

   return res.status(200).json(new ApiResponse(200 , {video}, " video is fetch succesfully"))
})

const updatevideo = asyncHandler(async(req, res)=>{
    const {videoId} = req.params
    const {title , description} = req.body
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "invaild videoId")
    }

    if([title, description].some((field)=> field.trim() === "")){
        throw new ApiError(400, " All field is requied")
    }
    const video = await Video.findById(videoId)
   if (!video) {
     throw new ApiError(404 , " video is not found")
   }

   const thumbnailLocalPath = req.files?.thumbnail[0].path;
   if(!thumbnailLocalPath){
    throw new ApiError(404, "thumbnail is required")
   }

   const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

   if(!thumbnail){
    throw new ApiError(404, "thumbnail uploading in cloudnary is failed ")
   }

   await Video.findByIdAndUpdate(videoId ,{
    $set:{
        title,
        description,
        thumbnail:thumbnail.url
    },
    
   },
   {
    new: true
  })

   return res.status(200).json(200 ,{}, " video detail is succesfully updated")
 

})

const deleteVideo = asyncHandler(async(req, res)=>{
    const { videoId } = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video id")
    }
    
    const video = await Video.findById(videoId)
    
    if (!video) {
        throw new ApiError(400, " video not found")
    }
try {

        await deleteImageCloudinary(video.videoFile)
    
} catch (error) {
    throw new ApiError(403, " deleting video in cloudnary failed ")
}

await Video.findByIdAndDelete(videoId)
    
        return res.status(200).json(
            new ApiResponse(200, {}, "videos has benn deleted")
        )

})

const togglePublistatus =asyncHandler(async(req, res)=>{
    const {videoId} = req.params
    
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "invaild videoId")
    }

    const video = await Video.findById(videoId)

   if (!video) {
     throw new ApiError(404 , " video is not found")
   }

   const publishedflag = video.isPublished
   await Video.findByIdAndUpdate(
    videoId,
    {
        $set:{
            isPublished: !publishedflag
        }
    },{
        new: true
    }
   )

   publishedflag = !publishedflag;
  
   return  res
   .status(200)
   .json(new ApiResponse(200,{publishedflag},"Video publish status is toggled successfully"))
})


export {
    publishedVideo,
    getAllvideo,
    updatevideo,
    getvideobyId,
    deleteVideo,
    togglePublistatus
}