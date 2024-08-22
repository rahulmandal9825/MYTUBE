import {v2 as cloudinary} from "cloudinary";
import fs from "fs";
import dotenv from 'dotenv';

dotenv.config({ path: './.env' }); 

cloudinary.config({ 
    cloud_name:process.env.CLOUDINARY_NAME, 
    api_key:process.env.API_KEY, 
    api_secret:process.env.API_SECRET 
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
        return error
    }
}

const deleteImageCloudinary = async(url) =>{
    const publicId = url.split("/").pop().split('.')[0]
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        console.log('Image deleted:', result);
    } catch (error) {
        console.error('Error deleting image:', error);
    }
}

export {uploadOnCloudinary , deleteImageCloudinary}