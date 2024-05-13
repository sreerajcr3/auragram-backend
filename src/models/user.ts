import mongoose, { InferSchemaType, Schema, model } from "mongoose";

const userSchema = new Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true, Selection: true },
    email: { type: String, required: true, unique: true, Selection: true },
    phonenumber: { type: Number, required: true },
    account_type: { type: String, enum: ['public', 'private', 'business'], default:'public', required: true },
    fullname: { type: String, required: true },
    followers: [
        { type: mongoose.Types.ObjectId }
    ],
    following: [
        { type: mongoose.Types.ObjectId }
    ],
    bio: { type: String },
    profile_picture: { type: String },
    cover_photo: { type: String },
    isBlocked: { type: Boolean, default: false }
},{ timestamps: true })

type User = InferSchemaType<typeof userSchema>;

export default model<User>("User", userSchema);