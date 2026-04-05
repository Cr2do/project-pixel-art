import { Schema, model, Document } from 'mongoose';

export interface IPixel extends Document {
    pixelBoardId: Schema.Types.ObjectId;
    userId: Schema.Types.ObjectId;
    position_x: number;
    position_y: number;
    color: string;
    createdAt: Date;
    updatedAt: Date;
}

const pixelSchema = new Schema<IPixel>({
    pixelBoardId: {
        type: Schema.Types.ObjectId,
        ref: 'PixelBoard',
        required: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
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
    color: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
});

export const Pixel = model<IPixel>('Pixel', pixelSchema);