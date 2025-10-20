import { Router } from 'express';
// Use the middleware you already have
import { verifyJWT } from '../middlewares/auth.middleware.js'; 
import { upload } from '../middlewares/multer.middleware.js';
import { createNote, getNotes, updateNote, deleteNote, embedNote, deleteMultipleNotes, searchNotes, summarizeNote, retagNote, transcribeAndSummarize } from '../controllers/note.controllers.js';

const router = Router();

// Apply the verifyJWT middleware to all routes in this router
router.use(verifyJWT);

// Secured Routes
router.route("/").post(createNote); // POST /api/v1/notes (Add Note)
router.route("/").get(getNotes);  // GET /api/v1/notes (View All Notes)
router.route("/search").get(searchNotes); // GET /api/v1/notes/search?query=...
router.route("/").delete(deleteMultipleNotes); // DELETE /api/v1/notes (Batch Delete)

// ⚠️ IMPORTANT: Specific routes MUST come BEFORE dynamic routes like /:noteId
// Move transcribe-summarize BEFORE /:noteId routes
router.route("/transcribe-summarize").post(upload.single('audio'), transcribeAndSummarize);

router.route("/:noteId/summarize").post(summarizeNote);
router.route("/:noteId/retag").post(retagNote);
router.route("/:noteId/embed").post(embedNote);

// Dynamic /:noteId route should come LAST
router.route("/:noteId")
    .patch(updateNote) // PATCH /api/v1/notes/:noteId
    .delete(deleteNote); // DELETE /api/v1/notes/:noteId

export default router;
// import { Router } from 'express';
// // Use the middleware you already have
// import { verifyJWT } from '../middlewares/auth.middleware.js'; 
// import { upload } from '../middlewares/multer.middleware.js';
// import { createNote, getNotes, updateNote, deleteNote, embedNote, deleteMultipleNotes, searchNotes, summarizeNote, retagNote, transcribeAndSummarize } from '../controllers/note.controllers.js';

// const router = Router();

// // Apply the verifyJWT middleware to all routes in this router
// router.use(verifyJWT);

// // Secured Routes
// router.route("/").post(createNote); // POST /api/v1/notes (Add Note)
// router.route("/").get(getNotes);  // GET /api/v1/notes (View All Notes)
// router.route("/search").get(searchNotes); // GET /api/v1/notes/search?query=...
// router.route("/").delete(deleteMultipleNotes); // DELETE /api/v1/notes (Batch Delete)
// router.route("/:noteId/summarize").post(summarizeNote);
// router.route("/:noteId/retag").post(retagNote);
// router.route("/:noteId/embed").post(embedNote);
// // It should be a POST request and use the upload middleware for a single file named "audio"
// router.route("/transcribe-summarize").post(upload.single('audio'), transcribeAndSummarize);

// router.route("/:noteId")
//     .patch(updateNote) // PATCH /api/v1/notes/:noteId
//     .delete(deleteNote); // DELETE /api/v1/notes/:noteId

// export default router;