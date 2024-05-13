import { Request, Response, NextFunction } from "express";
import userModel from "../models/user";
import jwt, { JwtPayload } from "jsonwebtoken";
import env from "../util/validateEnv"
import createHttpError from "http-errors";
import { Document } from "mongoose";

interface UserRequest extends Request {
    user?: Document<unknown, unknown, unknown> | null;
}



const protect = async (req: UserRequest, res: Response, next: NextFunction) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1]

            const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload
            if(decoded.role == "user") {
                const user = await userModel.findById(decoded.id)
                req.user = user || null
    
                next()
            } else {
                throw createHttpError(401, "Not Authorized")
            }

        } else {
            throw createHttpError(401, "Not Authorized")
        }
        
    }
    catch (error) {
        next(error) 
    }
}

export default protect;