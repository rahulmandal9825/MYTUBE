import { Router } from "express";
import {registerUser,loginUser,logoutUser, refreshAccessToken, changecurrentpassword, getCurrentUser, updateAccountDetail, updateUserAvatar, updateUsercoverImage, getuserChannelProfile, getWatchHistory} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js";



const router = Router()


router.route("/register").post(upload.fields([
    {
        name:"avatar",
        maxCount: 1
    },
    {
        name: "coverImage",
        maxCount: 1
    }
]) , registerUser)

router.route("/login").post(loginUser)

//Secure route

router.route("/logout").post(verifyJWT,logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changecurrentpassword)
router.route("/current-user").get(verifyJWT,getCurrentUser)
router.route("/update-acount").patch(verifyJWT, updateAccountDetail)

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUsercoverImage )

router.route("/channel/:username").get(verifyJWT, getuserChannelProfile)
router.route("/history").get(verifyJWT, getWatchHistory)


export default router