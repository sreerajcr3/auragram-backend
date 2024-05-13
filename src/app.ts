import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import createHttpError, { isHttpError } from "http-errors";
import morgan from "morgan";
import userRouter from "./routes/users";
import adminRouter from "./routes/admins";
import cors from "cors";

const app = express();

app.use(cors())
app.use(morgan("dev"))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", userRouter)
app.use("/admin", adminRouter)

app.use((req, res, next) => {
    next(createHttpError(404, 'Endpoint not found'))
});

/* eslint-disable @typescript-eslint/no-unused-vars */
app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
    console.log(error);
    let errorMessage = "An unknown error occurred";
    let statusCode = 500;
    if(isHttpError(error)) {        
        statusCode = error.status;
        errorMessage = error.message;
    }
    res.status(statusCode).json({ error: errorMessage })
})

export default app;