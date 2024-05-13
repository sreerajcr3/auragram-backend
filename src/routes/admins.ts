import express from "express";
import * as AdminController from "../controllers/admins";
import protect from "../middlewares/AdminAuth";

const adminRouter = express.Router();

adminRouter.post('/login', AdminController.login)
adminRouter.get('/users', protect, AdminController.users)
adminRouter.patch('/user/block/:userID', protect, AdminController.blockUser)
adminRouter.patch('/user/unblock/:userID', protect, AdminController.UnBlockUser)

adminRouter.get('/posts', protect, AdminController.posts)
adminRouter.patch('/post/block/:postID', protect, AdminController.blockPost)
adminRouter.patch('/post/unblock/:postID', protect, AdminController.UnBlockPost)

adminRouter.get('/report/user', protect, AdminController.UserReport)
adminRouter.get('/report/post', protect, AdminController.PostReport)
adminRouter.patch('/report/user/:reportId', protect, AdminController.userReportResolve)
adminRouter.patch('/report/post/:reportId', protect, AdminController.postReportResolve)

export default adminRouter;