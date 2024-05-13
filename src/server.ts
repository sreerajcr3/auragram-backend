import "dotenv/config";
import app from "./app";
import env from "./util/validateEnv";
import mongoose from "mongoose";
import http from "http";
import { Server } from "socket.io";
import chatModel from "../src/models/chat"

const PORT = env.PORT;

const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
})

type User = {
    username: string;
    socketId: string;
};

let onlineUsers: User[] = [];

const addNewUser = (username: string, socketId: string) => {
    const user = getUser(username);
    if (user && user.socketId !== socketId) removeUser(user.socketId);
    onlineUsers.push({ username, socketId });
    console.log(onlineUsers)
};

const removeUser = (socketId: string) => {
    onlineUsers = onlineUsers.filter((user) => user.socketId !== socketId);
};

const getUser = (username: string) => {
    return onlineUsers.find((user) => user.username === username);
};

io.on("connection", (socket) => {
    console.log(`New client connected: ${socket.id}`);
    socket.on("newUser", (username) => {
        addNewUser(username, socket.id);
    });

    socket.on("sendNotification", ({ type, senderName, receiverName }) => {
        const receiver = getUser(receiverName);
        if (receiver) {
            io.to(receiver?.socketId).emit("receiveNotification", {
                senderName,
                type,
            });
        }
    });

    socket.on("message", async (data) => {
        const { sender, message, receiver } = JSON.parse(data)
        const chat = new chatModel({
            message,
            sender: sender._id,
            receiver: receiver._id,
        });

        await chat.save();
        await chat.populate({ path: "sender", model: "User" });
        await chat.populate({ path: "receiver", model: "User" });

        const receiverUser = getUser(receiver.username);
        const senderUser = getUser(sender.username);
        console.log("Online Users", onlineUsers);
        console.log("Reciever", receiverUser);
        console.log("Sender", senderUser);




        if (receiverUser) {
            io.to(receiverUser?.socketId).emit("message", chat);
            io.to(receiverUser?.socketId).emit("receiveNotification", {
                senderName: sender.username,
                type: "MESSAGE",
                receiverName: receiver.username,
            });
        }
        if (senderUser) {
            io.to(senderUser?.socketId).emit("message", chat);
        }
    });

    socket.on("getOnlineUsers", () => {
        io.emit("onlineUsers", onlineUsers);
    });

    socket.on("callUser", (data) => {
        const sender = getUser(data.from);
        const receiver = getUser(data.userToCall);

        if (receiver) {
            io.to(receiver?.socketId).emit("callUser", {
                signal: data.signalData,
                from: sender?.socketId,
                name: sender?.username,
            });
        }
    });

    socket.on("answerCall", (data) => {
        io.to(data.to).emit("callAccepted", data.signal);
    });

    socket.on("declineCall", (data) => {
        io.to(data.to).emit("callDeclined", null);
    });

    socket.on("cancelCall", (data) => {
        const receiver = getUser(data.to);

        if (receiver) {
            io.to(receiver.socketId).emit("callCanceled", null);
        }
    });

    socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);

        socket.broadcast.emit("callEnded");
    });
});

mongoose.connect(env.MONGO_CONNECTION_STRING)
    .then(() => {
        console.log('Mongoose Connected')
        server.listen(PORT, () => {
            console.log("Server running on PORT", PORT);
        });
    })
    .catch(console.error)
