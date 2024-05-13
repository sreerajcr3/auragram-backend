import mongoose, { InferSchemaType, model } from "mongoose";

const postReportSchema = new mongoose.Schema({
    postId: {
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

type postReport = InferSchemaType<typeof postReportSchema>

export default model<postReport>("Post Report", postReportSchema)
