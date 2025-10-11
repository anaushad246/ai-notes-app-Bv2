import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Notebook } from "../models/notebook.model.js";
import { Note } from "../models/note.model.js"; // Needed to delete associated notes
import mongoose from "mongoose";

// Helper function to validate fields
const isValidText = (field) => field?.trim() !== "" && field?.length > 0;

// --- CREATE NOTEBOOK ---
const createNotebook = asyncHandler(async (req, res) => {
    const { name } = req.body;
    const notebook = await Notebook.create({
        name: isValidText(name) ? name : undefined,
        owner: req.user._id,
    });

    if (!notebook) {
        throw new ApiError(500, "Failed to create notebook in database.");
    }
    return res
        .status(201)
        .json(new ApiResponse(201, notebook, "Notebook created successfully."));
});

// --- GET ALL NOTEBOOKS ---
const getNotebooks = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const notebooks = await Notebook.find({ owner: userId }).sort({ createdAt: 1 });
    return res
        .status(200)
        .json(new ApiResponse(200, notebooks, "Notebooks fetched successfully."));
});

// --- RENAME NOTEBOOK ---
const updateNotebook = asyncHandler(async (req, res) => {
    const { notebookId } = req.params;
    const { name } = req.body;

    if (!notebookId || !isValidText(name)) {
        throw new ApiError(400, "Notebook ID and a new name are required.");
    }

    const notebook = await Notebook.findOneAndUpdate(
        { _id: notebookId, owner: req.user._id },
        { $set: { name } },
        { new: true }
    );

    if (!notebook) {
        throw new ApiError(404, "Notebook not found or you are not the owner.");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, notebook, "Notebook renamed successfully."));
});

// --- DELETE NOTEBOOK (AND ALL ITS NOTES) ---
const deleteNotebook = asyncHandler(async (req, res) => {
    const { notebookId } = req.params;
    const userId = req.user._id;

    if (!notebookId) {
        throw new ApiError(400, "Notebook ID is required.");
    }

    // 1. Delete the notebook
    const notebookResult = await Notebook.deleteOne({
        _id: new mongoose.Types.ObjectId(notebookId),
        owner: new mongoose.Types.ObjectId(userId),
    });

    if (notebookResult.deletedCount === 0) {
        throw new ApiError(404, "Notebook not found or you are not the owner.");
    }

    // 2. Delete all notes associated with this notebook
    const notesResult = await Note.deleteMany({
        notebook: new mongoose.Types.ObjectId(notebookId),
        owner: new mongoose.Types.ObjectId(userId),
    });

    return res.status(200).json(new ApiResponse(
        200,
        { notebookDeleted: true, notesDeletedCount: notesResult.deletedCount },
        "Notebook and all associated notes deleted successfully."
    ));
});

export {
    createNotebook,
    getNotebooks,
    updateNotebook,
    deleteNotebook
};