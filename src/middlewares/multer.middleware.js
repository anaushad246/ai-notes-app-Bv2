import multer from "multer";

// Configure Multer to store files in memory as a buffer
const storage = multer.memoryStorage();

// Create the Multer upload instance
export const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 25 * 1024 * 1024 // Limit file size to 25MB
    }
});