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


   const toggleSubscription = asyncHandler(async(req,res)=>{
     try {
      const {channalId} = req.params

      if(!isValidObjectId(channalId)){
       throw new ApiError(500, "channelId is required")
      }

      const channel = await Subscription.findById(channalId)

      if (!channel) {
        throw new ApiError(400, 'invliad channel id')
      }

      const existingSubscription = await Subscription.findOne({
        channel: channalId,
        subscriber: req.user?._id
      
      })

      if (existingSubscription) {
        await Subscription.deleteOne({
          channel: channalId,
          subscriber: req.user?._id
        })
      }else{
        await Subscription.create({
          channel: channalId,
          subscriber: req.user?._id
        })
      }
 
      return res.status(200).json(
       new ApiResponse(200, {}, "Subscription toggled succesfully")
      )
     } catch (error) {
      throw new ApiError(500, "error toggling subscition")
     }

   })
// controller to return subscriber list of a channel
   const getUserChannelSubscription = asyncHandler(async(req, res)=>{
       try {
         const {channalId} = req.params;
 
         if (!isValidObjectId(channalId)) {
           throw new ApiError(400, "channelId is invaild")
         }
 
         const subscriberlist =await Subscription.aggregate([
          {
            $match:{
              channel:new mongoose.Types.ObjectId(channalId)
            }
          },{
            $lookup:{
              from:"users",
              localField:"subscriber",
              foreignField:"_id",
              as:"subscribers"
            }
          },
          {
            $unwind:"subscribers"
          },
          {
            $group:{
              _id:"$channel",
              subscribers:{
                $push:{
                  fullName: "$subscribers.fullName",
                            username: "$subscribers.username",
                            avatar: "$subscribers.avatar",
                            coverImage: "$subscribers.coverImage",
                            email: "$subscribers.email"
                }
              }
            }
          },{
            $projects:{
              _id: 0,
              subscribers:1
            }
          }
         ])


         if (!subscriberlist) {
            throw new ApiError(404,"Channel not found")
               
         }

         if(!subscriberlist.length===0){
          return res.status(200).json(
            new ApiResponse(200, {}, " Succesfully fetch number of subscriber of the given channelId")
          )
         }


         return res.status(200).json(
           new ApiResponse(200, subscriberlist, " Succesfully fetcch number of subscriber of the given channelId")
         )
       } catch (error) {
        throw new ApiError(500, "error fetching sunscriber")
       }

   })

   // controller to return channel list to which user has subscribed
   const getSubscriberChannel =asyncHandler(async(req,res)=>{

    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400,"Invalid subscriber id")
    }
    const user = await User.findById(req.user?._id)
    if(!user){
        throw new ApiError(404,"User not found")
    }
    const channellist =await Subscription.aggregate([
      {
        $match:{
          subscriber:new mongoose.Types.ObjectId(req.user?._id)
        }
      },{
        $lookup:{
          from:"users",
          localField:"channel",
          foreignField:"_id",
          as:"channels"
        }
      },
      {
        $unwind:"channels"
      },
      {
        $group:{
          _id:"$subscriber",
          subscribers:{
            $push:{
              fullName: "$channels.fullName",
                        username: "$channels.username",
                        avatar: "$channels.avatar",
                        coverImage: "$channels.coverImage",
                        email: "$channels.email"
            }
          }
        }
      },{
        $projects:{
          _id: 0,
          channels:1
        }
      }
     ])

    res
    .status(200)
    .json(new ApiResponse(200,{channellist},"Subscribed channels are fetched successfully"))
})

   export {
    toggleSubscription,
    getSubscriberChannel,
    getUserChannelSubscription
   }