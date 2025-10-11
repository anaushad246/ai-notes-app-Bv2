import {Router} from 'express';
import { loginUser, logOutUser, refreshAccessToken, registerUser, getCurrentUser } from '../controllers/user.controllers.js';
// import { upload } from '../middlewares/multer.middleware.js'
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();
router.route("/register").post(
    // upload.fields([
    //     {name:"avatar",
    //         maxCount:1
    //     },
    //     {
    //         name:"coverImage",
    //         maxCount:1
    //     }
    // ]),
    registerUser)

router.route("/login").post(loginUser);

//secured routes
router.route("/logout").post(verifyJWT,logOutUser);
router.route("/refresh-token").post(refreshAccessToken)
// ✅ 2. Add the new route for getting the current user
router.route("/current-user").get(verifyJWT, getCurrentUser);

export default router