import { Schema, model, Document } from 'mongoose';

export interface IPixelBoard extends Document {
    name: string;
    width: number;
    height: number;
    position_x: number;
    position_y: number;
    status: 'IN_PROGRESS' | 'FINISHED';
    allow_override: boolean;
    delay_seconds: number;
    createdAt: Date;
    updatedAt: Date;
    contributions: {
        userId: Schema.Types.ObjectId;
        nb_pixels_placed: number;
        is_author: boolean;
    }[];
}

const contributionSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    nb_pixels_placed: {
        type: Number,
        default: 0,
    },
    is_author: {
        type: Boolean,
        default: false,
    },
}, {
    _id: false,
});
        

const pixelBoardSchema = new Schema<IPixelBoard>({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    width: {
        type: Number,
        required: true,
    },
    height: {
        type: Number,
        required: true,
    },
    position_x: {
        type: Number,
        required: true,
    },
    position_y: {
        type: Number,
        required: true,
    },
    status:{
        type: String,
        enum: ['IN_PROGRESS', 'FINISHED'],
        default: 'IN_PROGRESS',
    },
    allow_override: {
        type: Boolean,
        default: false,
    },
    delay_seconds: {
        type: Number,
        default: 60,
    },
    contributions: [contributionSchema],
}, {
    timestamps: true,
});

export const PixelBoard = model<IPixelBoard>('PixelBoard', pixelBoardSchema);