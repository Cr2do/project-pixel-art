import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
	lastname: string;
	firstname: string;
	email: string;
	role: 'USER' | 'ADMIN';
	password: string;
	resetPasswordToken?: string;
	resetPasswordExpiresAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

const userSchema = new Schema<IUser>(
	{
		lastname: {
			type: String,
			required: true,
			trim: true,
		},
		firstname: {
			type: String,
			required: true,
			trim: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			lowercase: true,
		},
		password: {
			type: String,
			required: true,
			trim: true,
		},
		resetPasswordToken: {
			type: String,
			select: false,
		},
		resetPasswordExpiresAt: {
			type: Date,
			select: false,
		},
		role: {
			type: String,
			enum: ['USER', 'ADMIN'],
			default: 'USER',
		},
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
	},
);

export const User = model<IUser>('User', userSchema);
