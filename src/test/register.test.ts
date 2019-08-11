// tslint:disable-next-line:no-implicit-dependencies
import { request } from 'graphql-request';
import fetch from 'node-fetch';
import User, { IUser } from '../models/user';
import {
	duplicatedEmail,
	passwordNotLongEnough,
	emailNotLongEnough,
	emailWrong
} from '../modules/register/errorMessages';
import { Config } from '../config';
import { startServer } from '../server';
import { createConfirmEmail } from '../utils/createConfirmEmail';
import * as Redis from 'ioredis';

const config = new Config().getConfig();

const redis = new Redis();

const email = 'carlos.fattor@gmail.com';
const password = '11111111111';
const firstName = 'Abreu';
const lastName = 'Cunha';
const mutation = (e: string = email, p: string = password) => {
	return `
	mutation {
		register(email: "${e}", password: "${p}", firstName: "${firstName}", lastName: "${lastName}") {
			path
			message
			}
		}
`;
};

let getHost = () => '';

beforeAll(async () => {
	await startServer();
	getHost = () => `http://127.0.0.1:${config.app.port}/graphql`;
});

const deleteUser = async () => {
	await User.deleteOne({ email });
};

describe('General functions over register user', () => {
	test('check for register user', async () => {
		await deleteUser();

		// register a user
		const response = await request(getHost(), mutation(email, password));
		expect(response.register[0]).toEqual({
			path: 'register',
			message: 'Successfully'
		});

		//find user
		const users = await User.find({ email });
		expect(users).toHaveLength(1);
		const user = users[0];
		expect(user.email).toEqual(email);
		await deleteUser();
	});

	test('check for duplicated Email', async () => {
		await request(getHost(), mutation(email, password));
		const response: any = await request(getHost(), mutation(email, password));
		expect(response.register).toHaveLength(1);
		expect(response.register[0]).toEqual({
			path: 'email',
			message: duplicatedEmail
		});
		await deleteUser();
	});

	test('check for bad password', async () => {
		const response = await request(getHost(), mutation(email, '11'));
		expect(response.register[0]).toEqual({
			path: 'password',
			message: passwordNotLongEnough
		});
	});

	test('check for bad email', async () => {
		const response = await request(getHost(), mutation('aa', password));
		expect(response.register).toEqual([
			{
				path: 'email',
				message: emailNotLongEnough
			},
			{
				path: 'email',
				message: emailWrong
			}
		]);
	});

	test('check link for a new user', async () => {
		await deleteUser();
		const user: IUser = new User({ email, password, firstName, lastName });
		const userSaved = await user.save();

		const url: string = await createConfirmEmail(`http://127.0.0.1:${config.app.port}`, userSaved._id, redis);
		const response = await fetch(url);
		await response.text();

		const chunks = url.split('/');
		const userFinder: IUser = await User.findOne({ _id: userSaved._id });
		expect(userFinder.confirmed).toBeTruthy();
		await deleteUser();

		const userId = await redis.get(chunks[chunks.length - 1]);

		expect(userId).toBeNull();
	});

	test('Check response for ID not found', async () => {
		const response = await fetch(`http://127.0.0.1:${config.app.port}/confirmed/12345`);
		expect(response.status).toEqual(404);
	});
});
