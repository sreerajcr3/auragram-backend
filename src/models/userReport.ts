import mongoose, { InferSchemaType, model } from "mongoose";

const userReportSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        required: true,
    },
    resolved: {
        type: Boolean,
        default: false
    },
    reports: [
        {
            description: { type: String },
            userId: { type: mongoose.Types.ObjectId },
            reportedAt: { type: Date }
        }
    ]
},
    { timestamps: true }
);

type userReport = InferSchemaType<typeof userReportSchema>

export default model<userReport>("User Report", userReportSchema)
