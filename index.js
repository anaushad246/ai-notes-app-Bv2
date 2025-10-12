// index.js

import dotenv from 'dotenv';
import connectDB from './src/db/index.js';
import { app } from './src/app.js';

// Configure environment variables
dotenv.config({
    path: './.env'
});

// --- CORRECTED SERVER STARTUP LOGIC ---
connectDB()
    .then(() => {
        // Start listening for requests only after the DB is connected
        app.listen(process.env.PORT || 8000, () => {
            console.log(`* Server is running at port : ${process.env.PORT}`);
        });

        // Optional: Handle express app errors
        app.on("error", (error) => {
            console.log("EXPRESS APP ERROR: ", error);
            throw error;
        });
    })
    .catch((err) => {
        console.log("MONGO DB connection failed !!! ", err);
    });