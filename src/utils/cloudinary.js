import {v2 as cloudinary} from "cloudinary";
import fs from "fs"

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_NAME, 
    api_key: process.env.API_KEY, 
    api_secret: process.env.API_SECRET 
});
const uploadOnCloudinary = async (localfilepath) => {
    try {
        if (!localfilepath) return null
        const response = await cloudinary.uploader.upload(localfilepath, {
            resource_type: "auto"
        })

        fs.unlinkSync(localfilepath)
        return response;

    } catch (error) {
        fs.unlinkSync(localfilepath) //remve file in local path
        return null
    }
}



export {uploadOnCloudinary}