import { Document, Schema, model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as validator from 'mongoose-unique-validator';
import * as jwt from 'jsonwebtoken';

export interface IUser extends Document {
	email: string;
	password: string;
	firstName: string;
	lastName: string;
	validPassword(password: string): boolean;
}

const UserSchema: Schema = new Schema<IUser>({
	email: { type: String, required: true, unique: true },
	password: { type: String, required: true },
	firstName: { type: String, required: true },
	lastName: { type: String || null }
});

UserSchema.plugin(validator, {
	message: 'is already taken.'
});

const SALT_WORK_FACTOR = 10;

UserSchema.pre<IUser>('save', function(next) {
	// tslint:disable-next-line:no-this-assignment
	const user = this;
	if (!user.isModified('password')) {
		return next();
	}
	bcrypt.genSalt(SALT_WORK_FACTOR, (err, salt) => {
		if (err) {
			return next(err);
		}
		bcrypt.hash(user.password, salt, (error: Error, hash: string) => {
			if (error) {
				return next(err);
			}
			user.password = hash;
			next();
		});
	});
});

declare type handleCallback = (myArgument: boolean) => void;
UserSchema.methods.comparePassword = function(candidatePassword: string, callback: handleCallback) {
	bcrypt.compare(candidatePassword, this.password).then((resp: boolean) => {
		callback(resp);
	});
};

UserSchema.methods.generateJWT = function(secret: string, expiresIn: number): string {
	return jwt.sign(
		{
			_id: this._id,
			email: this.email
		},
		secret,
		{
			expiresIn
		}
	);
};

const User = model<IUser>('User', UserSchema);
export default User;
