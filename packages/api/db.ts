import mongoose from 'mongoose';

const { MONGO_DATABASE } = process.env;

const MONGO_URI = `mongodb://localhost:27017/${MONGO_DATABASE}`;

export const connectDB = async (): Promise<void> => {
	await mongoose.connect(MONGO_URI);
};
