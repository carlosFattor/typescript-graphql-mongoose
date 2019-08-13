import { ResolverMap } from '../../types/graphql-utils';
import * as yup from 'yup';
import User, { IUser } from '../../models/user';
import { formatYupErrors } from '../../utils/formatYupErrors';
import { duplicatedEmail, emailNotLongEnough, passwordNotLongEnough, emailWrong } from './errorMessages';
import { createConfirmEmail } from '../../utils/createConfirmEmail';
import { sendEmail } from '../../utils/sendEmail';

const schema = yup.object().shape({
	email: yup.string().min(6, emailNotLongEnough).max(50).email(emailWrong),
	password: yup.string().min(6, passwordNotLongEnough).max(15)
});

export const resolvers: ResolverMap = {
	Query: {
		bye: () => 'bye'
	},
	Mutation: {
		register: async (_: any, args: GQL.IRegisterOnMutationArguments, { redis, url }) => {
			try {
				await schema.validate(args, { abortEarly: false });

				const { email, password, firstName, lastName } = args;
				const user: IUser = new User({ email, password, firstName, lastName });
				const userSaved = await user.save();
				const link = await createConfirmEmail(url, userSaved._id, redis);
				if (process.env.NODE_ENV !== 'test') {
					await sendEmail(email, link);
				}
				return [
					{
						path: 'register',
						message: 'Successfully'
					}
				];
			} catch (error) {
				if (error instanceof yup.ValidationError) {
					return formatYupErrors(error);
				}
				return [
					{
						path: 'email',
						message: duplicatedEmail
					}
				];
			}
		}
	}
};
