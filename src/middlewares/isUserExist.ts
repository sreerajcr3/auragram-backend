import { Request, Response, NextFunction, RequestHandler } from "express";
import userModel from "../models/user";
import createHttpError from "http-errors";


const IsUserExist: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const email = req.body.email;
        const currUser = await userModel.findOne({email: email})
        if(currUser) {
            throw createHttpError(401, "User with this EmailID Already Exists. Try with Different EmailID")
        }
        next()
    }
    catch (error) {
        next(error) 
    }
}

export default IsUserExist;