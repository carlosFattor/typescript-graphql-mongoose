import { ResolverMap } from '../../types/graphql-utils';
import User, { IUser } from '../../models/user';

export const resolvers: ResolverMap = {
	Query: {
		bye2: () => 'bye2'
	},
	Mutation: {
		login: async (_: any, { email, password }: GQL.ILoginOnMutationArguments) => {
			const user: IUser = await User.findOne({ email });
			if (!!!user) {
				return [
					{
						path: 'email',
						message: 'User not found'
					}
				];
			}
			const isTheSamePassword = await user.comparePassword(password);
			if (isTheSamePassword) {
				return [
					{
						path: 'email',
						message: 'Login successfully'
					}
				];
			}
			return [
				{
					path: 'email',
					message: 'Incorrect password'
				}
			];
		}
	}
};
