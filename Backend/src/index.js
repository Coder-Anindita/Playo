import dotenv from "dotenv"
dotenv.config({
    path:"./.env"
})
console.log("ENV CHECK:", {
  cloud: process.env.CLOUDINARY_CLOUD_NAME,
  key: process.env.CLOUDINARY_API_KEY,
  secret: process.env.CLOUDINARY_API_SECRET
});

import connectDB from './db/index.js'
import express from "express"



import app from "./app.js"
connectDB()
.then(()=>{
    app.listen(process.env.PORT,()=>{
        console.log(`server is running on port ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log("Database Connection error",err);
    

})











































// const setUpFunction= async()=>{
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error",(error)=>{
//             console.log("App is unable to connect to db:",error)
//             throw error

//         })
//         app.listen(process.env.PORT,()=>{
//             console.log(`App is listening on port ${process.env.PORT}`)
//         })
        
//     } catch (error) {
//         console.error("DB connection failed",error)
//         throw error
//     }

// }
// setUpFunction()