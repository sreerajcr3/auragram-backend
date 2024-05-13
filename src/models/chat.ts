import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const chatSchema = new Schema({
    sender: { type: mongoose.Types.ObjectId, required: true },
    receiver: { type: mongoose.Types.ObjectId, required: true },
    message: { type: String }
},{ timestamps: true })

type Chat = InferSchemaType<typeof chatSchema>

export default model<Chat>("Chat", chatSchema)