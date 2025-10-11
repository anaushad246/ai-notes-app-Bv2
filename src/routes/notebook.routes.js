// src/routes/notebook.routes.js

import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { 
    createNotebook, 
    getNotebooks, 
    updateNotebook, 
    deleteNotebook 
} from '../controllers/notebook.controllers.js';

const router = Router();

// Apply the verifyJWT middleware to all routes in this router
router.use(verifyJWT);

// Secured Routes
router.route("/").post(createNotebook); // POST /api/v1/notebooks (Create Notebook)
router.route("/").get(getNotebooks);  // GET /api/v1/notebooks (View All Notebooks)

router.route("/:notebookId")
    .patch(updateNotebook) // PATCH /api/v1/notebooks/:notebookId (Rename)
    .delete(deleteNotebook); // DELETE /api/v1/notebooks/:notebookId

export default router;