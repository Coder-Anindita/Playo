import dotenv from "dotenv"
import connectDB from "./db/index.js"
import express from "express"
const app=express()
dotenv.config({
    path:"./env"
})
connectDB()











































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