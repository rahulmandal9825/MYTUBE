import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))



app.use(express.json());
app.use(express.urlencoded({ extended: true })); // or false, depending on your needs
app.use(express.static("public"))
app.use(cookieParser())


import userRouter from "./routes/user.route.js"

app.use("/user", userRouter );

export default app