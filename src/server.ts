import 'reflect-metadata';
import { Config } from './config';
import { DataBase } from './config/data-base';
import { importSchema } from 'graphql-import';
import { GraphQLServer } from 'graphql-yoga';
import { mergeSchemas, makeExecutableSchema } from 'graphql-tools';
import * as path from 'path';
import * as fs from 'fs';
import { GraphQLSchema } from 'graphql';
import * as Redis from 'ioredis';
import User from './models/user';

const folders = fs.readdirSync(path.join(__dirname, './modules'));

const config = new Config().getConfig();

const dataBase = new DataBase(config);

const redis = new Redis();

export const startServer = async () => {
	if (process.env.NODE_ENV === 'test') {
		await redis.flushall();
	}
	try {
		const schemas: GraphQLSchema[] = [];
		folders.forEach((folder) => {
			const { resolvers } = require(`./modules/${folder}/resolvers`);
			const typeDefs = importSchema(path.join(__dirname, `./modules/${folder}/schema.graphql`));
			schemas.push(makeExecutableSchema({ resolvers, typeDefs }));
		});
		const server = new GraphQLServer({
			schema: mergeSchemas({ schemas }),
			context: ({ request }) => ({
				redis,
				url: `${request.protocol}://${request.get('host')}`
			})
		});
		const dataBaseStarted = await dataBase.connect();
		if (dataBaseStarted) {
			console.log('Data base UP');
			const options = {
				port: process.env.NODE_ENV === 'test' ? 0 : config.app.port,
				endpoint: '/graphql',
				subscriptions: '/subscriptions',
				playground: '/playground'
			};

			const app = await server.start(options, ({ port }) => {
				startExtraUrl(server, redis);
				console.log(`Server UP => localhost:${port}`);
			});
			return app;
		}
		return null;
	} catch (error) {
		console.log(`Error starting services => ${error}`);
		return null;
	}
};

function startExtraUrl(server: GraphQLServer, REDIS: Redis.Redis) {
	server.express.get('/confirm/:id', async (req, res) => {
		try {
			const { id } = req.params;
			const userId = await REDIS.get(id);
			await User.updateOne({ _id: userId }, { confirmed: true });
			await REDIS.del(id);
			res.send('ok');
		} catch (error) {
			res.status(404);
		}
	});
}
