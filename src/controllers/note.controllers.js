import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Note } from "../models/note.model.js"; 
// ✅ FIX: Use consistent casing for the import path
import { Notebook } from "../models/notebook.model.js"; 
import { User } from "../models/user.model.js"; 
import { generateQueryEmbedding, generateSummary, generateAITagWithModel, generateDocumentEmbedding } from "../utils/ai.service.js"; 

// Helper function to validate fields
const isValidText = (field) => field?.trim() !== "" && field?.length > 0;

// --- CREATE NOTE (Updated for Notebooks) ---
const createNote = asyncHandler(async (req, res) => {
    // 1. Get data from request body (ADDED notebookId)
    const { title, content, notebookId } = req.body; 

    // 2. Simple Validation
    if (!isValidText(title) || !isValidText(content)) {
        throw new ApiError(400, "Title and content are required fields.");
    }

    // 3. Create note, linking to owner and notebook
    const note = await Note.create({
        title,
        content,
        owner: req.user._id, 
        // ✅ NEW: Assign notebookId if provided (null otherwise)
        notebook: notebookId, 
    });

    if (!note) {
        throw new ApiError(500, "Failed to create note in database.");
    }

    // 5. Send response
    return res
        .status(201)
        .json(new ApiResponse(201, note, "Note created successfully."));
});

// --- GET NOTES FOR AUTHENTICATED USER (Updated for Filtering) ---
const getNotes = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // 2. Get pagination and filter options
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // ✅ NEW: Get the notebookId from query parameters
    const { notebookId } = req.query;

    // 3. Build the initial query object
    const query = { owner: userId };
    
    // ✅ NEW: If notebookId is provided, add the filter logic
    if (notebookId) {
        // Handle special case for 'unassigned' notes ('All Notes')
        if (notebookId.toLowerCase() === 'unassigned') {
            query.notebook = { $in: [null, undefined] };
        } else {
            // Filter by the specific Notebook ID
            query.notebook = new mongoose.Types.ObjectId(notebookId);
        }
    }

    // 4. Query notes with pagination and sorting
    const notes = await Note.find(query) 
        .sort({ createdAt: -1 }) 
        .skip(skip)               
        .limit(limit);            

    // 5. Get the total count of notes for the user, matching the current filter
    const totalNotes = await Note.countDocuments(query); 

    // 6. Send response with pagination metadata
    return res
        .status(200)
        .json(new ApiResponse(200, {
            notes,
            page,
            limit,
            totalPages: Math.ceil(totalNotes / limit),
            totalNotes
        }, "Notes fetched successfully."));
});


// --- UPDATE NOTE (Updated for Moving Notes) ---
const updateNote = asyncHandler(async (req, res) => {
    const { noteId } = req.params;
    // 👇 CHANGED: ADDED notebookId to capture the new folder assignment
    const { title, content, notebookId } = req.body; 

    // 1. Validation
    if (!noteId) {
        throw new ApiError(400, "Note ID is required.");
    }

    // 2. Find and check ownership
    const note = await Note.findOne({ _id: noteId, owner: req.user._id });

    if (!note) {
        throw new ApiError(404, "Note not found or you are not the owner.");
    }
    
    // 3. Update fields
    if (title) note.title = title;
    if (content) note.content = content;
    
    // 👇 NEW LOGIC: Handle moving the note to a different notebook
    if (notebookId !== undefined) {
        // If the value is explicitly 'null' (sent from frontend for 'All Notes'/unassigned), set notebook to null.
        // Otherwise, cast the ID to a Mongoose ObjectId.
        note.notebook = notebookId === null 
            ? null 
            : new mongoose.Types.ObjectId(notebookId);
    }
    
    await note.save();

    // 4. Send response
    return res
        .status(200)
        .json(new ApiResponse(200, note, "Note updated successfully."));
});


// --- DELETE NOTE ---
const deleteNote = async (req, res) => {
    const { noteId } = req.params;
    const userId = req.user?._id;

    const result = await Note.deleteOne({
        _id: new mongoose.Types.ObjectId(noteId),
        owner: new mongoose.Types.ObjectId(userId),
    });

    if (result.deletedCount === 0) {
        throw new ApiError(404, "Note not found or you are not the owner.");
    }
    return res.status(200).json({
      success: true,
      message: "Note deleted successfully."
    });
};

const deleteMultipleNotes = async (req, res) => {
    const { noteIds } = req.body;
    const userId = req.user?._id;

    if (!noteIds || !Array.isArray(noteIds) || noteIds.length === 0) {
        throw new ApiError(400, "Note IDs are required.");
    }

    const result = await Note.deleteMany({
        _id: { $in: noteIds.map(id => new mongoose.Types.ObjectId(id)) },
        owner: new mongoose.Types.ObjectId(userId),
    });

    if (result.deletedCount === 0) {
        console.warn(`User ${userId} attempted to delete notes that did not exist or they did not own.`);
    }

    return res.status(200).json({
        success: true,
        message: `${result.deletedCount} notes deleted successfully.`,
    });
};

const embedNote = asyncHandler(async (req, res) => {
    const { noteId } = req.params;
    const note = await Note.findOne({ _id: noteId, owner: req.user._id });

    if (!note) {
        throw new ApiError(404, "Note not found or you are not the owner.");
    }

    // Generate the embedding from the note's title and content
    const embedding = await generateDocumentEmbedding(note.title + "\\n\\n" + note.content);
    if (!embedding) {
        throw new ApiError(500, "Failed to generate embedding for the note.");
    }

    // Save the new embedding to the note
    note.embedding = embedding;
    await note.save({ validateBeforeSave: false });

    return res.status(200).json(new ApiResponse(200, note, "Note has been embedded successfully and is now searchable."));
});


// src/controllers/note.controllers.js (CORRECTED searchNotes function)

const searchNotes = asyncHandler(async (req, res) => {
    // 1. Get the user's search query from the query parameter (e.g., ?query=...)
    const { query } = req.query; 
    const userId = req.user._id; 
    console.log(`Backend received search request for query: "${query}"`);
    if (!query) {
        throw new ApiError(400, "Search query is required.");
    }

    // 2. Embed the user's text query using the utility function
    const queryVector = await generateQueryEmbedding(query);

    // 3. Perform Vector Search using MongoDB Aggregation
    const notes = await Note.aggregate([
        // Stage 1: $vectorSearch MUST be the first stage
        {
            $vectorSearch: {
                // ⚠️ CRITICAL: Replace "vector_index_name" with your actual Atlas Vector Search index name.
                index: "vector_index",
                path: "embedding",
                queryVector: queryVector,
                numCandidates: 100,
                limit: 10,
                // SOLUTION: Use 'filter' to apply the ownership check
                filter: { owner: userId } 
            }
        },
        // Stage 2: Projection (To get only the desired fields)
        {
            $project: {
                title: 1,
                content: 1,
                aiTag: 1,
                score: { $meta: "vectorSearchScore" }
            }
        }
    ]);
    console.log("Notes found by vector search:", JSON.stringify(notes, null, 2));
    // 4. Send response (This is now correctly inside the function scope)
    return res
        .status(200)
        .json(new ApiResponse(200, notes, "Search results fetched successfully."));
        // console.log(`Backend sent search results: ${JSON.stringify(notes, null, 2)}`);
});

const summarizeNote = asyncHandler(async (req, res) => {
    const { noteId } = req.params;
    const note = await Note.findOne({ _id: noteId, owner: req.user._id });
    if (!note) {
        throw new ApiError(404, "Note not found or you are not the owner.");
    }
    
// --- THIS IS THE FIX ---
    // 1. Create a clean, plain-text version of the content by removing HTML tags.
    const plainTextContent = note.content.replace(/<[^>]*>?/gm, ' ');

    // 2. Send the clean text to the AI for summarization.
    const summary = await generateSummary(plainTextContent);
    if (!summary) {
        throw new ApiError(500, "Failed to generate summary.");
    }
    // 3. Update the note with the new summary.
    note.content = summary;
    await note.save();

    return res.status(200).json(new ApiResponse(200, note, "Note summarized successfully."));
});

const retagNote = asyncHandler(async (req, res) => {
    const { noteId } = req.params;

    const note = await Note.findOne({ _id: noteId, owner: req.user._id });
    if (!note) {
        throw new ApiError(404, "Note not found or you are not the owner.");
    }

    // Get the new tag from our smart AI function
    const newTag = await generateAITagWithModel(note.content);

    // Update the note's tag and save it
    note.aiTag = newTag;
    await note.save({ validateBeforeSave: false });

    return res.status(200).json(new ApiResponse(200, note, "Note re-tagged successfully."));
});

export {
    createNote,
    getNotes,
    updateNote,
    deleteNote,
    embedNote,
    deleteMultipleNotes,
    searchNotes,
    summarizeNote,
    retagNote
    
};