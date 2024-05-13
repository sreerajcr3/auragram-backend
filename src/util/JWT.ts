import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import env from "../util/validateEnv";

// Generate JWT Token 
const generateToken = (id: mongoose.Types.ObjectId, role: string) => {
    return jwt.sign({ id, role }, env.JWT_SECRET, {
        expiresIn: '30d'
    })
}

export default generateToken