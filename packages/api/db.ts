import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI ?? `mongodb://localhost:27017/${process.env.MONGO_DATABASE}`;

export const connectDB = async (): Promise<void> => {
	await mongoose.connect(MONGO_URI);
};
