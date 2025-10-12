import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

import express from 'express'
const app = express();

// import cors from 'cors';
import cookieParser from 'cookie-parser';

import cors from "cors";

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map(o => o.trim().replace(/\/$/, "").toLowerCase())
  .filter(Boolean);

  app.use(
    cors({
      origin: function (origin, callback) {
        // Add this console.log for debugging
        console.log({
          incomingOrigin: origin,
          allowedOrigins: allowedOrigins,
        });
  
        // allow requests with no origin (like mobile apps, curl)
        if (!origin) return callback(null, true);
  
        const clean = origin.replace(/\/$/, "").toLowerCase();
        if (allowedOrigins.includes(clean)) return callback(null, true);
  
        console.log("❌ Blocked by CORS:", origin);
        return callback(new Error("Not allowed by CORS"));
      },
      credentials: true, // required for login/cookies
    })
  );

app.use(express.json({limit:"16kb"}));
app.use(express.urlencoded({extended:true,limit:"16kb"}));
app.use(express.static("public"));
app.use(cookieParser())

// routes import
import userRouter from './routes/user.routes.js';
import noteRouter from './routes/note.routes.js';
import notebookRouter from './routes/notebook.routes.js';


//routes declaration
app.get("/",(req,res)=>{
res.send("All are ok")
})
app.use("/api/v1/users",userRouter)
app.use("/api/v1/notes",noteRouter)
app.use("/api/v1/notebooks",notebookRouter)


export {app}