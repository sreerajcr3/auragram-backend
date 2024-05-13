import mongoose, { InferSchemaType, model } from "mongoose";

const storySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 720, 
  },
});

type Story = InferSchemaType<typeof storySchema>

export default model<Story>("Story", storySchema)
