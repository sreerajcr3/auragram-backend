import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const savePostSchema = new Schema({
    userId: { type: mongoose.Types.ObjectId, required: true },
    posts: [
        { type: mongoose.Types.ObjectId }
    ]
},{ timestamps: true })

type SavePost = InferSchemaType<typeof savePostSchema>

export default model<SavePost>("SavePost", savePostSchema)