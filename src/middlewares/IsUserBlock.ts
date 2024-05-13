import { Request, Response, NextFunction, RequestHandler } from "express";
import userModel from "../models/user";
import createHttpError from "http-errors";


interface IUserRequest extends Request {
    user?: unknown
}

const IsUserBlock: RequestHandler = async (req: IUserRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user = req.user
        const currUser = await userModel.findOne({_id: user})
        if(currUser?.isBlocked) {
            throw createHttpError(401, "User Has Been Blocked by Admin")
        }
        next()
    }
    catch (error) {
        next(error) 
    }
}

export default IsUserBlock;