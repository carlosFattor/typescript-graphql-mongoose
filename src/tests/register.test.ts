// tslint:disable-next-line:no-implicit-dependencies
import { request } from 'graphql-request';
import { host, development } from './constants';
import { DataBase } from '../config/data-base';
import User from '../models/user';

const email = 'carlos11fa222ttor@teste.com';
const password = '123ds';
const firstName = 'Abreu';
const lastName = 'Cunha';

const mutation = `
mutation {
    register(email: "${email}", password: "${password}", firstName: "${firstName}", lastName: "${lastName}")
}
`;

const connection = async () => {
	const dataBase = new DataBase(development);
	const connected = await dataBase.connect();
	return connected;
};

const deleteUser = async () => {
	await User.deleteOne({ email });
};

test('Register user', async () => {
	const connected = connection();
	if (connected) {
		await deleteUser();
		const response = await request(host, mutation);
		expect(response).toEqual({ register: true });

		const users = await User.find({ email });
		expect(users).toHaveLength(1);
		const user = users[0];
		expect(user.email).toEqual(email);
		await deleteUser();
	}
});
