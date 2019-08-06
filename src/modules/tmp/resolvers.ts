import { ResolverMap } from '../../types/graphql-utils';

export const resolvers: ResolverMap = {
	Query: {
		hello: (_: any, { name }: GQL.IHelloOnQueryArguments) => `Hello ${name || 'world'}`
	}
};
