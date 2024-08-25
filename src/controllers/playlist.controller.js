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
import {Subscription} from "../models/subscription.model.js"
import { Playlist } from "../models/playlist.model.js";

// create  a playlist 
const createPlaylist = asyncHandler(async(req,res)=>{
  const {name, description} = req.body
  
  if ([name,description].some((field)=>field.trim() === "")) {
    throw new ApiError(400, "all field is requied")
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user?._id
  })

  return res.status(200).json(
    new ApiResponse(200, playlist, "succesfully created playlist")
  )

})

// get a user playlist 
const getUserPlaylist =asyncHandler(async(req,res)=>{

    const { userId } = req.params
    
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, " invaild userId")
    }
    const playlist = await Playlist.find({owner: userId})

    return res.status(200).json(
        new ApiResponse(200, playlist, "succesfully fetched playlist")
      )
})


const getPlaylistById = asyncHandler(async(req,res)=>{
    const {playlistId} = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400,"Invalid playlist id")
    }

    const playlist = await Playlist.findById(playlistId)

    return res.status(200).json(
        new ApiResponse(200, {playlist} , "playlist is fetched successfully")
    )
})




export {
    createPlaylist,
    getUserPlaylist,
    getPlaylistById
}