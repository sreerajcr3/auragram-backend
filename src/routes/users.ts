import express from "express";
import * as UserController from "../controllers/users";
import protect from "../middlewares/UserAuth";
import IsUserBlock from "../middlewares/IsUserBlock";
import IsUserExist from "../middlewares/isUserExist";
import sendOTP from "../controllers/otpController";
import IsNoUserExist from "../middlewares/isNoUserExists";

const userRouter = express.Router();

userRouter.post("/signup", UserController.signUp)
userRouter.post("/login", UserController.login)
userRouter.post("/createpost", protect, IsUserBlock,  UserController.createPost)
userRouter.get("/posts", protect, IsUserBlock, UserController.AllPosts)

userRouter.post("/signup-send-otp", IsUserExist, sendOTP)
userRouter.post("/forget-send-otp", IsNoUserExist, sendOTP)
userRouter.post("/forget-password", UserController.forgetPassword)

userRouter.get("/post/:postId", protect, IsUserBlock, UserController.getPost)
userRouter.patch("/post/:postId", protect, IsUserBlock, UserController.editPost)
userRouter.delete("/post/:postId", protect, IsUserBlock, UserController.deletePost)
userRouter.patch("/post/like/:postId", protect, IsUserBlock, UserController.likePost)
userRouter.patch("/post/unlike/:postId", protect, IsUserBlock, UserController.unlikePost)
userRouter.post("/post/comment/add", protect, IsUserBlock, UserController.addComment)
userRouter.post("/post/comment/delete", protect, IsUserBlock, UserController.deleteComment)

userRouter.get("/me", protect, IsUserBlock, UserController.currentUser)

userRouter.patch("/profile/edit", protect, IsUserBlock, UserController.editProfile)

userRouter.get("/stories", protect, IsUserBlock, UserController.allStories)
userRouter.post("/story/add", protect, IsUserBlock, UserController.createStory)
userRouter.delete("/story/delete/:storyId", protect, IsUserBlock, UserController.deleteStory)


userRouter.patch("/account/type", protect, IsUserBlock, UserController.changeAccountvisibility)

userRouter.patch("/follow/:userId", protect, IsUserBlock, UserController.followUser)
userRouter.patch("/unfollow/:userId", protect, IsUserBlock, UserController.unfollowUser)

userRouter.get("/user/:userId", protect, IsUserBlock, UserController.getUser)
userRouter.get("/users", protect, IsUserBlock, UserController.allUsers)
userRouter.get("/search", protect, IsUserBlock, UserController.searchUser)

userRouter.post("/save-post/:postId", protect, IsUserBlock, UserController.savePost)
userRouter.patch("/unsave-post/:postId", protect, IsUserBlock, UserController.unsavePost)
userRouter.get("/saved-post", protect, IsUserBlock, UserController.savedPosts)

userRouter.get('/activity', protect, IsUserBlock, UserController.getActivity)
userRouter.delete('/activity', protect, IsUserBlock, UserController.deleteActivity)

userRouter.post('/report/user', protect, IsUserBlock, UserController.reportUser)
userRouter.post('/report/post', protect, IsUserBlock, UserController.reportPost)

userRouter.get('/chat', protect, IsUserBlock, UserController.getChat)
userRouter.post('/chat', protect, IsUserBlock, UserController.addChat)
userRouter.get('/chat/me', protect, IsUserBlock, UserController.getMyChat)
userRouter.get('/chat/me/:user_id', protect, IsUserBlock, UserController.getAChat)

export default userRouter;