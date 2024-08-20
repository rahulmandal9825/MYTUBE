import mongoose from "mongoose";
import { DB_NAME } from "../constans.js";

const connectDB = async () => {
 
    try {
        const connectioninstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\n MongoDb connect DB HOST ${connectioninstance.host}`);
    } catch (error) {
        console.log("MonogDB connection failed", error);
        process.exit(1)
    }
}


export default connectDB