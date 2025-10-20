// index.js
import dotenv from 'dotenv';

// 1️⃣ Load environment variables immediately
dotenv.config({ path: './.env' });

// console.log('HUGGING_FACE_API_KEY:', process.env.HUGGING_FACE_API_KEY); // debug check

// 2️⃣ Dynamically import the DB and app after dotenv is loaded
const connectDB = (await import('./src/db/index.js')).default;
const { app } = await import('./src/app.js');

// 3️⃣ Connect to MongoDB, then start the server
connectDB()
  .then(() => {
    const PORT = process.env.PORT || 8000;

    app.listen(PORT, () => {
      console.log(`* Server is running at port: ${PORT}`);
    });

    // Optional: handle express errors
    app.on('error', (error) => {
      console.error('EXPRESS APP ERROR:', error);
      throw error;
    });
  })
  .catch((err) => {
    console.error('MONGO DB connection failed!!!', err);
  });

// // index.js

// import dotenv from 'dotenv';
// dotenv.config(
//     {path: './.env'}
// );

// import connectDB from './src/db/index.js';
// import { app } from './src/app.js';

// // Configure environment variables

// // --- CORRECTED SERVER STARTUP LOGIC ---
// connectDB()
//     .then(() => {
//         // Start listening for requests only after the DB is connected
//         app.listen(process.env.PORT || 8000, () => {
//             console.log(`* Server is running at port : ${process.env.PORT}`);
//         });

//         // Optional: Handle express app errors
//         app.on("error", (error) => {
//             console.log("EXPRESS APP ERROR: ", error);
//             throw error;
//         });
//     })
//     .catch((err) => {
//         console.log("MONGO DB connection failed !!! ", err);
//     });