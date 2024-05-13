import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const activityschema = new Schema({
    userId: { type: mongoose.Types.ObjectId, required: true },
    postId: { type: mongoose.Types.ObjectId },
    type: { type: String, enum: ['like', 'comment', 'follow'] , required: true },
    by: { type: mongoose.Types.ObjectId, required: true }
},{ timestamps: true })

type Activity = InferSchemaType<typeof activityschema>;

export default model<Activity>("Activity", activityschema);