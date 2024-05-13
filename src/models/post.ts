import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const postSchema = new Schema({
    userId: { type: mongoose.Types.ObjectId, required: true },
    description: { type: String, required: true },
    mediaURL: [
        { type: String, required: true }
    ],
    likes: [
        { type: mongoose.Types.ObjectId }
    ],
    comments: [
        { type: mongoose.Types.ObjectId }
    ],
    location: { type: String, required: true },
    isBlocked: {
        type: Boolean,
        default: false
    }
},{ timestamps: true })

type Post = InferSchemaType<typeof postSchema>

export default model<Post>("Post", postSchema)