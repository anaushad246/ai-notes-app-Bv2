import dotenv from 'dotenv'
dotenv.config({
    path: './.env'
})
import { app } from './src/app.js';

import connectDB from './src/db/index.js';




connectDB()
.then(()=>{
    app.listen(
       process.env.PORT ||
         8000,()=>{
        console.log(`* server is running at port : ${process.env.PORT}`);
        
    })
})
.catch((e)=>{
    console.log(`MongoDB connection failed ${e.message}`);
    
})