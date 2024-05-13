import { NextFunction, Request, RequestHandler, Response } from "express";
import createHttpError from "http-errors";
import UserModel from "../models/user";
import OtpModel from "../models/otp";
import PostModel from "../models/post";
import commentModel from "../models/comment";
import StoryModel from "../models/story";
import SavePostModel from "../models/savepost";
import ActivityModel from "../models/activity";
import UserReportModel from "../models/userReport";
import PostReportModel from "../models/postReport";
import ChatModel from "../models/chat";
import bcrypt from "bcrypt";
import generateToken from "../util/JWT";
import mongoose from 'mongoose';

interface signUpBody {
    username?: string,
    fullname?: string
    email?: string,
    password?: string,
    account_type?: string
    phonenumber?: number,
    otp: string
}


// @desc Register New User
// @route POST /signup
// @access Public
export const signUp: RequestHandler<unknown, unknown, signUpBody, unknown> = async (req, res, next) => {

    const { username, email, fullname, account_type, phonenumber, otp } = req.body;
    const passwordRaw = req.body.password;
    try {
        if (!username || !email || !passwordRaw || !fullname || !account_type || !phonenumber || !otp) {
            throw createHttpError(400, "All fields are Required")
        }

        const isUsernameExist = await UserModel.findOne({ username: username }).exec()

        if (isUsernameExist) {
            throw createHttpError(409, "Username Already Taken. Please Choose different one or login instead");
        }

        const isEmailExist = await UserModel.findOne({ email: email }).exec();


        if (isEmailExist) {
            throw createHttpError(409, "A user with this email address already exist. Please login instead");
        }

        const isPhoneNumberExist = await UserModel.findOne({ phonenumber: phonenumber })

        if (isPhoneNumberExist) {
            throw createHttpError(409, "A user with this Phone Number already exist. Please login instead");

        }

        const response = await OtpModel.find({ email }).sort({ createdAt: -1 }).limit(1);

        if (response.length === 0 || otp !== response[0].otp) {
            throw createHttpError(400, { success: false, message: 'The OTP is not valid' })
        }

        const hashedPassword = await bcrypt.hash(passwordRaw, 10);

        const newUser = await UserModel.create({
            username,
            email,
            fullname,
            account_type,
            password: hashedPassword,
            phonenumber,
            followers: [],
            following: [],
            bio: '',
            profile_picture: '',
            cover_photo: ''
        })

        res.status(201).json({
            userId: newUser.id,
            username,
            email,
            fullname,
            account_type,
            phonenumber,
            followers: newUser.followers,
            following: newUser.following,
            bio: newUser.bio,
            profile_picture: newUser.profile_picture,
            cover_photo: newUser.cover_photo,
            token: generateToken(newUser._id, "user")
        })
    } catch (error) {
        next(error)
    }
}

interface LoginBody {
    username?: string,
    password: string
}

// @desc Login Registered User
// @route POST /login
// @access Public
export const login: RequestHandler<unknown, unknown, LoginBody, unknown> = async (req, res, next) => {
    const { username } = req.body;
    const password: string = req.body.password;
    try {
        if (!username || !password) {
            throw createHttpError(400, "Parameters Missing");
        }

        const user = await UserModel.findOne({ username }).select("+password +email").exec();

        if (!user) {
            throw createHttpError(400, "Invalid Username");
        }

        if (user.isBlocked) {
            throw createHttpError(401, "User Has Been Blocked by Admin")
        }

        let userPassword: string | undefined;

        if (typeof user.password === 'string') {
            userPassword = user.password;
        } else {
            throw createHttpError(500, "Invalid user password type");
        }

        const passwordMatch = await bcrypt.compare(password, userPassword);

        if (!passwordMatch) {
            throw createHttpError(401, "Invalid Password");
        }

        res.status(201).json({
            userId: user._id,
            username,
            email: user.email,
            fullname: user.fullname,
            account_type: user.account_type,
            followers: user.followers,
            following: user.following,
            bio: user.bio,
            profile_picture: user.profile_picture,
            cover_photo: user.cover_photo,
            token: generateToken(user._id, "user")
        })
    } catch (error) {
        next(error)
    }
}

interface postBody {
    postData: {
        description?: string,
        image?: string,
        location?: string
    }
}

// @desc Create New Post
// @route POST /createpost
// @access Private
export const createPost: RequestHandler<unknown, unknown, postBody, unknown> = async (req, res, next) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const userId = req.user.id
    const { description, image, location } = req.body.postData;

    try {
        if (!description || !image || !location) {
            throw createHttpError(400, "Parameters Missing")
        }

        const userPost = await PostModel.create({
            userId,
            description,
            mediaURL: image,
            location,
            likes: [],
            comments: [],
        })

        res.status(201).json({
            userPost
        })
    } catch (error) {
        console.log(error);

        next(error)
    }
}

// @desc Get All Posts
// @route POST /posts
// @access Private
export const AllPosts: RequestHandler = async (req, res, next): Promise<void> => {
    try {
        const posts = await PostModel.find({ isBlocked: false }).populate({
            path: "userId",
            model: "User"
        }).populate({
            path: 'comments',
            model: 'Comment',
            populate: {
                path: 'userId',
                model: 'User'
            }
        }).sort({ 'createdAt': -1 });

        res.status(200).json(posts)
    } catch (error) {
        next(error)
    }
}

interface forgetPasswordBody {
    email?: string,
    password?: string,
    otp: string
}


// @desc Forget Password
// @route POST /forget-password
// @access Public
export const forgetPassword: RequestHandler<unknown, unknown, forgetPasswordBody, unknown> = async (req, res, next) => {

    const { email, otp } = req.body;
    const passwordRaw = req.body.password;
    try {
        if (!email || !passwordRaw || !otp) {
            throw createHttpError(400, "All fields are Required")
        }

        const isUsernameExist = await UserModel.findOne({ email: email }).exec()


        if (!isUsernameExist) {
            throw createHttpError(409, "No Account found on this Email ID");
        }

        const response = await OtpModel.find({ email }).sort({ createdAt: -1 }).limit(1);

        if (response.length === 0 || otp.toString() !== response[0].otp) {
            throw createHttpError(400, { success: false, message: 'The OTP is not valid' })
        }

        const hashedPassword = await bcrypt.hash(passwordRaw, 10);

        await UserModel.updateOne({ email: email }, {
            email,
            password: hashedPassword,
        })

        const updatedUser = await UserModel.findOne({ email: email }).exec()

        res.status(201).json({
            userId: updatedUser?._id,
            username: updatedUser?.username,
            email: updatedUser?.email,
            fullname: updatedUser?.fullname,
            account_type: updatedUser?.account_type,
            phonenumber: updatedUser?.phonenumber,
            token: generateToken(updatedUser?.id, "user")
        })
    } catch (error) {
        next(error)
    }
}

// @desc Get Indivitual Post
// @route GET /post/:postId
// @access Private
export const getPost: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    const { postId } = req.params

    try {
        const post = await PostModel.findOne({ _id: postId }).populate({
            path: 'userId',
            model: 'User'
        }).populate({
            path: 'likes',
            model: 'User'
        }).populate({
            path: "comments",
            model: "Comment",
            populate: {
                path: 'userId',
                model: 'User'
            }
        })

        if (!post) {
            throw createHttpError(404, "No Post found on this ID")
        }

        res.status(201).json({
            "data": post
        })
    } catch (error) {
        console.log(error);

        next(error)
    }
}


// @desc Edit Post
// @route PATCH /post/:postId
// @access Private
export const editPost: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const userId = req.user.id
    const { postId } = req.params

    const { description, image, location, likes, comments } = req.body;

    try {
        const post = await PostModel.findOne({ _id: postId })


        if (!post) {
            throw createHttpError(404, "No Post found on this ID")
        }

        if (post.userId != userId) {
            throw createHttpError(401, "This post doesn't belong to this user")
        }

        const userPost = await PostModel.updateOne({
            _id: postId
        }, {
            description,
            mediaURL: image,
            location,
            likes,
            comments
        })

        res.status(201).json({
            userPost
        })
    } catch (error) {
        console.log(error);

        next(error)
    }
}


// @desc Delete Post
// @route DELETE /post/:postId
// @access Private
export const deletePost: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const userId = req.user.id
    const { postId } = req.params

    try {
        const post = await PostModel.findOne({ _id: postId })


        if (!post) {
            throw createHttpError(404, "No Post found on this ID")
        }

        if (post.userId != userId) {
            throw createHttpError(401, "This post doesn't belong to this user")
        }

        await PostModel.deleteOne({ _id: postId })

        res.status(201).json({
            "status": "success"
        })
    } catch (error) {
        console.log(error);

        next(error)
    }
}

// @desc Like Post
// @route PATCH /post/like/:postId
// @access Private
export const likePost: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const userId = req.user.id
    const { postId } = req.params

    try {
        const post = await PostModel.findOne({ _id: postId })


        if (!post) {
            throw createHttpError(404, "No Post found on this ID")
        }

        if (post.likes.includes(userId)) {
            throw createHttpError(401, "User Already liked the post")
        }

        await PostModel.updateOne({ _id: postId }, {
            $push: { likes: userId }
        })

        await ActivityModel.create({
            userId: post.userId,
            postId: post._id,
            type: 'like',
            by: userId
        })

        res.status(201).json({
            "status": "success"
        })
    } catch (error) {
        console.log(error);

        next(error)
    }
}

// @desc Unlike Post
// @route PATCH /post/like/:postId
// @access Private
export const unlikePost: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const userId = req.user.id
    const { postId } = req.params

    try {
        const post = await PostModel.findOne({ _id: postId })

        if (!post) {
            throw createHttpError(404, "No Post found on this ID")
        }

        if (!post.likes.includes(userId)) {
            throw createHttpError(401, "User has not liked the post")
        }

        await PostModel.updateOne({ _id: postId }, {
            $pull: { likes: userId }
        })

        res.status(200).json({
            "status": "success"
        })
    } catch (error) {
        console.log(error);

        next(error)
    }
}


// @desc Add Comment In Post
// @route POST /post/comment/add
// @access Private
export const addComment: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const userId = req.user.id
    const { postId, comment } = req.body

    try {
        if (!comment || !postId) {
            throw createHttpError(404, "Parameters Missing")
        }

        const post = await PostModel.findOne({ _id: postId })

        if (!post) {
            throw createHttpError(404, "No Post found on this ID")
        }


        const Comment = await commentModel.create({
            userId,
            comment
        })

        await PostModel.updateOne({ _id: postId }, {
            $push: { comments: Comment._id }
        })

        await ActivityModel.create({
            type: 'comment',
            postId: post._id,
            userId: post.userId,
            by: userId
        })

        res.status(200).json({
            "status": "success",
            "data": Comment
        })

    } catch (error) {
        console.log(error);

        next(error)
    }
}

// @desc Delete Comment In Post
// @route POST /post/comment/delete
// @access Private
export const deleteComment: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const userId = req.user.id
    const { postId, commentId } = req.body

    try {
        if (!commentId || !postId) {
            throw createHttpError(404, "Parameters Missing")
        }

        const post = await PostModel.findOne({ _id: postId })

        if (!post) {
            throw createHttpError(404, "No Post found on this ID")
        }

        const Comment = await commentModel.findOne({ _id: commentId })

        if (!Comment) {
            throw createHttpError(404, "Comment not found")
        }

        if (Comment?.userId != userId) {
            throw createHttpError("401", "Comment not belong to this user")
        }

        await commentModel.deleteOne({ _id: commentId })


        await PostModel.updateOne({ _id: postId }, {
            $pull: { comments: commentId }
        })
        res.status(200).json({
            "status": "success"
        })
    } catch (error) {
        console.log(error);

        next(error)
    }
}

// @desc Get Current user
// @route GET /me
// @access Private
export const currentUser: RequestHandler = async (req, res, next): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const userId = req.user.id
    try {
        const user = await UserModel.findOne({ _id: userId }).populate({
            path: 'followers',
            model: 'User'
        }).populate({
            path: 'following',
            model: 'User'
        })

        if (!user) {
            throw createHttpError(404, "User Not FOund")
        }

        const posts = await PostModel.find({ userId: user?._id }).populate({
            path: 'comments',
            model: 'Comment',
            populate: {
                path: 'userId',
                model: 'User'
            }
        }).sort({ 'createdAt': -1 })

        res.status(200).json({ user: user, posts: posts })
    } catch (error) {
        next(error)
    }
}


// @desc Edit Profile
// @route PATCH /profile/edit/:userId
// @access Private
export const editProfile: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const userId = req.user.id

    const { username, fullname, bio, profile_picture, cover_photo } = req.body;

    try {
        const isSameUsernameExists = await UserModel.findOne({ username: username })

        if (isSameUsernameExists) {
            throw createHttpError(404, "User with this username already exist")
        }


        const user = await UserModel.updateOne({
            _id: userId
        }, {
            username,
            fullname,
            bio,
            profile_picture,
            cover_photo
        })

        res.status(201).json({
            status: "success",
            user
        })
    } catch (error) {
        console.log(error);

        next(error)
    }
}


// @desc Create Story
// @route POST /story/add
// @access Private
export const createStory: RequestHandler = async (req, res, next): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const userId = req.user.id
    const { image } = req.body;
    try {
        if (!image) {
            throw createHttpError(400, "Image Required")
        }

        const story = await StoryModel.create({
            userId,
            image
        })

        res.status(200).json({ status: "success", story: story })
    } catch (error) {
        next(error)
    }
}


// @desc Delete Story
// @route DELETE /story/delete
// @access Private
export const deleteStory: RequestHandler = async (req, res, next): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const userId = req.user.id
    const { storyId } = req.params;
    try {
        if (!storyId) {
            throw createHttpError(404, "Story ID is Required")
        }

        const story = await StoryModel.findOne({ _id: storyId });

        if (!story) {
            throw createHttpError(404, "Story Not found")
        }

        if (story.userId != userId) {
            throw createHttpError(401, "Story Doesn't Belong to this user")
        }

        await StoryModel.deleteOne({ _id: storyId })

        res.status(200).json({ status: "success" })
    } catch (error) {
        next(error)
    }
}


// @desc Get All Stories
// @route GET /stories
// @access Private
export const allStories: RequestHandler = async (req, res, next): Promise<void> => {
    try {
        const stories = await StoryModel.find().populate({
            path: "userId",
            model: "User"
        }).sort({ 'createdAt': -1 });

        res.status(200).json(stories)
    } catch (error) {
        next(error)
    }
}


// @desc Change Account Visibility
// @route PATCH /account/type
// @access Private
export const changeAccountvisibility: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const userId = req.user.id

    const { account_type } = req.body;

    try {

        if (!account_type) {
            throw createHttpError(400, "Parameters Missing")
        }

        if (account_type !== 'public' && account_type !== 'private' && account_type !== 'business') {
            throw createHttpError(400, "Select a Valid Account Type")
        }

        const user = await UserModel.findOneAndUpdate({ _id: userId }, { account_type }, { new: true })

        res.status(201).json({
            status: "success",
            user
        })
    } catch (error) {

        next(error)
    }
}


// @desc Follow User
// @route PATCH /follow/:userId
// @access Private
export const followUser: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const currUserId = req.user.id

    const { userId } = req.params

    try {

        if (!userId) {
            throw createHttpError(400, "Parameters Missing")
        }

        const user = await UserModel.findOne({ _id: userId })

        if (!user) {
            throw createHttpError(404, "No User Found on this ID")
        }

        await UserModel.updateOne({ _id: currUserId }, {
            $push: { following: userId }
        })

        await UserModel.updateOne({ _id: userId }, {
            $push: { followers: currUserId }
        })

        const newUser = await UserModel.findOne({ _id: currUserId })

        await ActivityModel.create({
            type: 'follow',
            userId,
            by: currUserId
        })

        res.status(200).json({
            status: "success",
            newUser
        })

    } catch (error) {

        next(error)
    }
}



// @desc Follow User
// @route PATCH /unfollow/:userId
// @access Private
export const unfollowUser: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const currUserId = req.user.id

    const { userId } = req.params;

    try {

        if (!userId) {
            throw createHttpError(400, "Parameters Missing")
        }

        const user = await UserModel.findOne({ _id: userId })

        if (!user) {
            throw createHttpError(404, "No User Found on this ID")
        }

        await UserModel.updateOne({ _id: currUserId }, {
            $pull: { following: userId }
        })

        await UserModel.updateOne({ _id: userId }, {
            $pull: { followers: currUserId }
        })

        const newUser = await UserModel.findOne({ _id: currUserId })

        res.status(200).json({
            status: "success",
            newUser
        })
    } catch (error) {

        next(error)
    }
}


// @desc Get user
// @route GET /user/:userId
// @access Private
export const getUser: RequestHandler = async (req, res, next): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    const { userId } = req.params

    try {
        const user = await UserModel.findOne({ _id: userId }).populate({
            path: 'followers',
            model: 'User'
        }).populate({
            path: 'following',
            model: 'User'
        })

        if (!user) {
            throw createHttpError(404, "User Not FOund")
        }

        const posts = await PostModel.find({ userId: user?._id }).populate({
            path: 'comments',
            model: 'Comment',
            populate: {
                path: 'userId',
                model: 'User'
            }
        }).sort({ 'createdAt': -1 })

        res.status(200).json({ user: user, posts: posts })
    } catch (error) {
        next(error)
    }
}


// @desc Get All User
// @route GET /users
// @access Private
export const allUsers: RequestHandler = async (req, res, next): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment

    try {
        const users = await UserModel.find().populate({
            path: 'followers',
            model: 'User'
        }).populate({
            path: 'following',
            model: 'User'
        })

        res.status(200).json({ user: users })
    } catch (error) {
        next(error)
    }
}


// @desc Search User
// @route GET /search
// @access Private
export const searchUser: RequestHandler = async (req, res, next): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    try {
        const { query } = req.query;

        if (!query) {
            throw createHttpError(400, "Query parameter is missing");
        }

        const users = await UserModel.find({ username: { $regex: query, $options: "i" } });

        res.status(200).json({ "users": users });
    } catch (error) {
        next(error)
    }
}


// @desc Save Post
// @route POST /save-post/:postId
// @access Private
export const savePost: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const userId = req.user.id

    const { postId } = req.params;

    try {

        if (!postId) {
            throw createHttpError(400, "Parameters Missing")
        }

        const saved = await SavePostModel.findOne({ userId: userId })

        if (saved) {
            await SavePostModel.updateOne({ userId: userId }, {
                $push: { posts: postId }
            })
        } else {
            await SavePostModel.create({
                userId: userId,
                posts: [postId]
            })
        }

        res.status(200).json({
            status: "success"
        })
    } catch (error) {

        next(error)
    }
}


// @desc Un-Save Post
// @route PATCH /unsave-post/:postId
// @access Private
export const unsavePost: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const userId = req.user.id

    const { postId } = req.params;

    try {

        if (!postId) {
            throw createHttpError(400, "Parameters Missing")
        }

        const saved = await SavePostModel.findOne({ userId: userId })

        if (!saved) {
            throw createHttpError(404, "No Saved Post for this User")
        } else {
            await SavePostModel.updateOne({ userId: userId }, {
                $pull: { posts: postId }
            })
        }

        res.status(200).json({
            status: "success"
        })
    } catch (error) {

        next(error)
    }
}


// @desc Saved Posts
// @route GET /saved-post
// @access Private
export const savedPosts: RequestHandler = async (req, res, next): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const userId = req.user.id

    try {
        const savedPost = await SavePostModel.findOne({ userId: userId }).populate([
            {
                path: "posts",
                model: "Post",
                populate: {
                    path: "userId",
                    model: "User"
                }
            },
            {
                path: "posts",
                model: "Post",
                populate: {
                    path: "comments",
                    model: "Comment",
                    populate: {
                        path: 'userId',
                        model: 'User'
                    }
                }
            },
            {
                path: "userId",
                model: "User"
            }
        ]);

        res.status(200).json({ "saved-posts": savedPost });
    } catch (error) {
        next(error);
    }
}



// @desc Get All Activity
// @route GET /activity
// @access Private
export const getActivity: RequestHandler = async (req, res, next): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const userId = req.user.id

    try {
        const activity = await ActivityModel.find({ userId }).populate({
            path: 'by',
            model: 'User'
        }).populate({
            path: 'postId',
            model: 'Post'
        });

        res.status(200).json({ "activity": activity })

    } catch (error) {
        next(error)
    }
}


// @desc Delete All Activity
// @route DELETE /activity
// @access Private
export const deleteActivity: RequestHandler = async (req, res, next): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const userId = req.user.id

    try {
        await ActivityModel.deleteMany({ userId })

        res.status(200).json({ "success": true })

    } catch (error) {
        next(error)
    }
}


// @desc Report User
// @route POST /report/user
// @access Private
export const reportUser: RequestHandler = async (req, res, next): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const userId = req.user.id

    try {
        const { reportUserId, description } = req.body;

        if (!reportUserId || !description) {
            throw createHttpError(400, 'Parameters Missing');
        }

        const userReport = await UserReportModel.findOne({ userId: reportUserId });

        if (!userReport) {
            await UserReportModel.create({
                userId: reportUserId,
                reports: [{ userId, description, reportedAt: Date.now() }],
            });
        } else {
            const existingReport = userReport.reports.find(report => {
                if (report && report.userId) {
                    const reportUserId = report.userId as mongoose.Types.ObjectId;
                    return reportUserId.equals(new mongoose.Types.ObjectId(userId));
                }
                return false;
            });

            if (!existingReport) {
                userReport.reports.push({ userId, description, reportedAt: Date.now() });
                await userReport.save();
            } else {
                throw createHttpError(400, 'User already reported by this user');
            }
        }

        res.status(200).json({ message: 'User reported successfully' });

    } catch (error) {
        next(error);
    }
}




// @desc Report Post
// @route POST /report/post
// @access Private
export const reportPost: RequestHandler = async (req, res, next): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const userId = req.user.id

    try {
        const { postId, description } = req.body;

        if (!postId || !description) {
            throw createHttpError(400, 'Parameters Missing');
        }

        const postReport = await PostReportModel.findOne({ postId });

        if (!postReport) {
            await PostReportModel.create({
                postId,
                reports: [{ userId, description, reportedAt: Date.now() }]
            });
        } else {
            const existingReport = postReport.reports.find(report => {
                if (report && report.userId) {
                    const reportUserId = report.userId as mongoose.Types.ObjectId;
                    return reportUserId.equals(new mongoose.Types.ObjectId(userId));
                }
                return false;
            });

            if (!existingReport) {
                postReport.reports.push({ userId, description, reportedAt: Date.now() });
                await postReport.save();
            } else {
                throw createHttpError(400, 'Post already reported by this user');
            }
        }

        res.status(200).json({ message: 'Post reported successfully' });

    } catch (error) {
        next(error);
    }
}



// @desc Get Chat
// @route GET /chat
// @access Private
export const getChat: RequestHandler = async (req, res, next): Promise<void> => {

    try {
        const chats = await ChatModel.find({})
            .populate({
                path: "sender",
                model: "User",
            })
            .populate({
                path: "receiver",
                model: "User",
            });

        if (!chats) {
            res
                .status(404)
                .json({ message: "Chats not found" });
        }

        res.status(200).json({ message: "chats", data: chats })

    } catch (error) {
        next(error);
    }
}


// @desc Add Chat
// @route POST /chat
// @access Private
export const addChat: RequestHandler = async (req, res, next): Promise<void> => {

    const { sender, receiver, message } = req.body;

    if (!sender || !receiver || !message) {
        res.status(400).json({ message: "Bad request" });
    }

    try {
        const chat = new ChatModel({ sender, receiver, message });
        await chat.save();

        await chat.populate({ path: "sender", model: "User" });
        await chat.populate({ path: "receiver", model: "User" });

        res
            .status(200)
            .json({ message: "Chat added successfully", data: chat });
    } catch (error) {
        next(error);
    }
}


// @desc Get Chat of Current User
// @route GET /chat/me
// @access Private
export const getMyChat: RequestHandler = async (req, res, next): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const userId = req.user.id

    try {
        const chats = await ChatModel.find({
            $or: [
                { sender: userId },
                { receiver: userId }
            ]
        })
            .populate({
                path: "sender",
                model: "User",
            })
            .populate({
                path: "receiver",
                model: "User",
            });

        if (!chats) {
            res
                .status(404)
                .json({ message: "Chats not found" });
        }

        res.status(200).json({ message: "chats", data: chats })

    } catch (error) {
        next(error);
    }
}

// @desc Get Chat of Current User
// @route GET /chat/me/:user_id
// @access Private
export const getAChat: RequestHandler = async (req, res, next): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const currUserId = req.user.id;
    const { user_id } = req.params;

    try {
        const chats = await ChatModel.find({
            $or: [
                { sender: currUserId, receiver: user_id },
                { sender: user_id, receiver: currUserId }
            ]
        })
            .populate({
                path: "sender",
                model: "User",
            })
            .populate({
                path: "receiver",
                model: "User",
            });

        if (chats.length === 0) {
            res.status(404).json({ message: "Chats not found" });
            return;
        }

        res.status(200).json({ message: "chats", data: chats });

    } catch (error) {
        next(error);
    }
}