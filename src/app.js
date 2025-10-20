// import dotenv from 'dotenv';
// dotenv.config({ path: './.env' });
import express from 'express'
const app = express();
import session from 'express-session';
import passport from 'passport';
import './config/passport.js'; // <-- ADD THIS to run the passport config
import authRouter from './routes/auth.routes.js'; // <-- ADD THIS

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
        // allow requests with no origin (like mobile apps, curl)
        if (!origin) return callback(null, true);
        const clean = origin.replace(/\/$/, "").toLowerCase();
        if (allowedOrigins.includes(clean)) return callback(null, true);
        return callback(new Error("Not allowed by CORS"));
      },
      credentials: true, // required for login/cookies
    })
  );

  // --- ADD THESE LINES before your routes ---
app.use(session({
  secret: process.env.SESSION_SECRET || "ABCD1234",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.json({limit:"50mb"}));
app.use(express.urlencoded({extended:true,limit:"50mb"}));
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
app.use("/api/v1/auth", authRouter)


export {app}