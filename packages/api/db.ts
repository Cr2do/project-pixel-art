import mongoose from 'mongoose';

const { MONGO_USERNAME, MONGO_PASSWORD, MONGO_DATABASE } = process.env;

const MONGO_URI = `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@localhost:27017/${MONGO_DATABASE}?authSource=admin`;

export const connectDB = async (): Promise<void> => {
	await mongoose.connect(MONGO_URI);
};
