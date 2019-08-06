import { ResolverMap } from '../../types/graphql-utils';
import User, { IUser } from '../../models/user';

export const resolvers: ResolverMap = {
	Query: {
		bye: () => 'bye'
	},
	Mutation: {
		register: async (_: any, { email, password, firstName, lastName }: GQL.IRegisterOnMutationArguments) => {
			const user: IUser = new User({ email, password, firstName, lastName });
			await user.save();
			return true;
		}
	}
};
