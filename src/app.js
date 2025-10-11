import express from 'express'
const app = express();

import cors from 'cors';
import cookieParser from 'cookie-parser';
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}))

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