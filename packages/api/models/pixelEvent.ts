import { Schema, model, Document, Types } from 'mongoose';

export interface IPixelEvent extends Document {
  pixelBoardId: Types.ObjectId;
  userId: Types.ObjectId;
  position_x: number;
  position_y: number;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

const pixelEventSchema = new Schema<IPixelEvent>(
  {
    pixelBoardId: {
      type: Schema.Types.ObjectId,
      ref: 'PixelBoard',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    position_x: {
      type: Number,
      required: true,
      index: true,
    },
    position_y: {
      type: Number,
      required: true,
      index: true,
    },
    color: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  },
);

// Aggregation/index support for common queries
pixelEventSchema.index({ pixelBoardId: 1, position_x: 1, position_y: 1, createdAt: 1 });

export const PixelEvent = model<IPixelEvent>('PixelEvent', pixelEventSchema);

