import { RequestHandler } from "express";
import createHttpError from "http-errors";
import AdminModel from "../models/admin";
import postModel from "../models/post";
import UserModel from "../models/user";
import UserReportModel from "../models/userReport";
import PostReportModel from "../models/postReport";
import generateToken from "../util/JWT";


interface LoginBody {
    username?: string,
    password?: string
}

// @desc Admin Login
// @route POST /admin/login
// @access Public
export const login: RequestHandler<unknown, unknown, LoginBody, unknown> = async (req, res, next) => {
    const { username } = req.body;
    const password = req.body.password;
    try {
        if (!username || !password) {
            throw createHttpError(400, "Parameters Missing");
        }

        const admin = await AdminModel.findOne({ username }).exec();

        if (!admin) {
            throw createHttpError(401, "Invalid Username");
        }

        let adminPassword: string | undefined;

        if (typeof admin.password === 'string') {
            adminPassword = admin.password;
        } else {
            throw createHttpError(500, "Invalid admin password type");
        }

        const passwordMatch = adminPassword === password

        if (!passwordMatch) {
            throw createHttpError(401, "Invalid Password");
        }

        res.status(201).json({
            admin,
            token: generateToken(admin._id, "admin")
        })
    } catch (error) {
        next(error)
    }
}


// @desc Get All Users
// @route POST /admin/users
// @access Private
export const users: RequestHandler = async(req, res, next): Promise<void> => {
    try {
        const users = await UserModel.find();
        res.status(200).json(users)
    } catch (error) {
        next(error)
    }
}

// @desc Block User
// @route PATCH /admin/user/block/:userID
// @access Private
export const blockUser: RequestHandler  = async (req, res, next) : Promise<void> => {
    try {
        const userID = req.params.userID;
        
        if(userID == null) {
            throw createHttpError(400, "User ID Required")
        } else {
            const user = await UserModel.findById(userID);
            if(user == null) {
                throw createHttpError(404, "User Not Found")
            } else {
                await UserModel.findByIdAndUpdate(userID, { isBlocked: true })
                res.status(200).json({ "status":"success" })
            }
        }
    } catch (error) {
        next(error)
    }
}

// @desc UnBlock User
// @route PATCH /admin/user/unblock/:userID
// @access Private
export const UnBlockUser: RequestHandler  = async (req, res, next) : Promise<void> => {
    try {
        const userID = req.params.userID;
        if(userID == null) {
            throw createHttpError(400, "User ID Required")
        } else {
            const user = await UserModel.findById(userID);
            if(user == null) {
                throw createHttpError(404, "User Not Found")
            } else {
                await UserModel.findByIdAndUpdate(userID, { isBlocked: false })
                res.status(200).json({ "status":"success" })
            }
        }
    } catch (error) {
        next(error)
    }
}

// @desc Get All Posts
// @route POST /admin/posts
// @access Private
export const posts: RequestHandler = async(req, res, next): Promise<void> => {
    try {
        const posts = await postModel.find().populate({
            path: "userId",
            model: "User"
        });
        res.status(200).json(posts)
    } catch (error) {
        next(error)
    }
}

// @desc Block Post
// @route PATCH /admin/post/block/:userID
// @access Private
export const blockPost: RequestHandler  = async (req, res, next) : Promise<void> => {
    try {
        const postID = req.params.postID;
        
        if(postID == null) {
            throw createHttpError(400, "Post ID Required")
        } else {
            const post = await postModel.findById(postID);
            if(post == null) {
                throw createHttpError(404, "Post Not Found")
            } else {
                await postModel.findByIdAndUpdate(postID, { isBlocked: true })
                res.status(200).json({ "status":"success" })
            }
        }
    } catch (error) {
        next(error)
    }
}

// @desc UnBlock Post
// @route PATCH /admin/post/unblock/:userID
// @access Private
export const UnBlockPost: RequestHandler  = async (req, res, next) : Promise<void> => {
    try {
        const postID = req.params.postID;
        if(postID == null) {
            throw createHttpError(400, "Post ID Required")
        } else {
            const post = await postModel.findById(postID);
            if(post == null) {
                throw createHttpError(404, "Post Not Found")
            } else {
                await postModel.findByIdAndUpdate(postID, { isBlocked: false })
                res.status(200).json({ "status":"success" })
            }
        }
    } catch (error) {
        next(error)
    }
}

// @desc All User Report
// @route GET /admin/report/user
// @access Private
export const UserReport: RequestHandler  = async (req, res, next) : Promise<void> => {
    try {
        const userReports = await UserReportModel.find({}).populate({
            path: 'userId',
            model: 'User'
        }).populate({
            path: 'reports.userId',
            model: 'User'
        })

        res.status(200).json({ reports: userReports })

    } catch (error) {
        next(error)
    }
}

// @desc All Post Report
// @route GET /admin/report/post
// @access Private
export const PostReport: RequestHandler  = async (req, res, next) : Promise<void> => {
    try {
        const postReports = await PostReportModel.find({}).populate({
            path: 'postId',
            model: 'Post'
        }).populate({
            path: 'reports.userId',
            model: 'User'
        })

        res.status(200).json({ reports: postReports })

    } catch (error) {
        next(error)
    }
}


// @desc Resolve User Report
// @route PATCH /admin/report/user/:userID
// @access Private
export const userReportResolve: RequestHandler  = async (req, res, next) : Promise<void> => {
    try {
        const {reportId} = req.params;
        
        if(reportId == null) {
            throw createHttpError(400, "Report Id Required")
        } else {
            const report = await UserReportModel.findById(reportId);
            if(report == null) {
                throw createHttpError(404, "Report Not Found")
            } else {
                await UserReportModel.findByIdAndUpdate(reportId, { resolved: true })
                await UserModel.findByIdAndUpdate(report.userId, { isBlocked: true })
                res.status(200).json({ "status":"success" })
            }
        }
    } catch (error) {
        next(error)
    }
}


// @desc Resolve Post Report
// @route PATCH /admin/report/post/:postID
// @access Private
export const postReportResolve: RequestHandler  = async (req, res, next) : Promise<void> => {
    try {
        const {reportId} = req.params;
        
        if(reportId == null) {
            throw createHttpError(400, "Report Id Required")
        } else {
            const report = await PostReportModel.findById(reportId);
            if(report == null) {
                throw createHttpError(404, "Report Not Found")
            } else {
                await PostReportModel.findByIdAndUpdate(reportId, { resolved: true })
                await postModel.findByIdAndUpdate(report.postId, { isBlocked: true })
                res.status(200).json({ "status":"success" })
            }
        }
    } catch (error) {
        next(error)
    }
}