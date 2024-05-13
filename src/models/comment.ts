import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const commentSchema = new Schema({
    userId: { type: mongoose.Types.ObjectId, required: true },
    comment: {
        type: String,
        required: true
    }
},{ timestamps: true })

type Comment = InferSchemaType<typeof commentSchema>

export default model<Comment>("Comment", commentSchema)