import mongoose, { Schema } from "mongoose";

const notebookSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            default: "Untitled Notebook",
        },
        // Link the notebook to the User model
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User", // References the User model
            required: true,
        },
    },
    {
        timestamps: true
    }
);

export const Notebook = mongoose.model('Notebook', notebookSchema);