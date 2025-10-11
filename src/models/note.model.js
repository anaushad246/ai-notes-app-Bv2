import mongoose, { Schema } from "mongoose";

const noteSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        content: {
            type: String,
            required: true,
        },
        // Link the note back to the User model
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User", // References the User model
            required: true,
        },
         // ✅ NEW FIELD: Reference to the Notebook
         notebook: {
            type: Schema.Types.ObjectId,
            ref: "Notebook", // References the new Notebook model
            default: null, // Allow notes to be unassigned (in 'All Notes')
        },
        // Optional: Field for AI-generated summary or tag
        aiTag: {
            type: String,
            default: "General",
        },
        embedding: {
            type: [Number], // Defines it as an array of numbers
            default: undefined,
        }
    },
    {
        timestamps: true
    }
);

export const Note = mongoose.model('Note', noteSchema);