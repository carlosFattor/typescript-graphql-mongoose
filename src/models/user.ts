import { Document, Schema, model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as validator from 'mongoose-unique-validator';
import * as jwt from 'jsonwebtoken';

export interface IUser extends Document {
	email: string;
	password: string;
	firstName: string;
	lastName: string;
	confirmed: boolean;
	comparePassword(password: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema<IUser>({
	email: {
		type: String,
		trim: true,
		required: true,
		unique: [ true, 'Email address is required' ],
		lowercase: true,
		match: [ /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address' ]
	},
	password: { type: String, required: true, min: 3, max: 15 },
	firstName: { type: String, required: true },
	lastName: { type: String || null },
	confirmed: { type: Boolean, default: false }
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

UserSchema.methods.comparePassword = function(candidatePassword: string): Promise<boolean> {
	return bcrypt.compare(candidatePassword, this.password);
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
