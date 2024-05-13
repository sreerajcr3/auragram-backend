import { InferSchemaType, Schema, model } from "mongoose";

const adminSchema = new Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
},{ timestamps: true })

type Admin = InferSchemaType<typeof adminSchema>;

export default model<Admin>("Admin", adminSchema);