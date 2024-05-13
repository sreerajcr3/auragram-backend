import { Request, Response, NextFunction, RequestHandler } from "express";
import userModel from "../models/user";
import createHttpError from "http-errors";


const IsNoUserExist: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const email = req.body.email;
        const currUser = await userModel.findOne({email: email})
        if(!currUser) {
            throw createHttpError(401, "User not found in this EmailID try Creating new Account")
        }
        next()
    }
    catch (error) {
        next(error) 
    }
}

export default IsNoUserExist;