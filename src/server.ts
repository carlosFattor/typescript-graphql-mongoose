import 'reflect-metadata';
import { Config } from './config';
import { DataBase } from './config/data-base';
import { importSchema } from 'graphql-import';
import { GraphQLServer } from 'graphql-yoga';
// import { resolvers } from './resolvers';
import { mergeSchemas, makeExecutableSchema } from 'graphql-tools';
import * as path from 'path';
import * as fs from 'fs';
import { GraphQLSchema } from 'graphql';

const folders = fs.readdirSync(path.join(__dirname, './modules'));

const config = new Config().getConfig();

const dataBase = new DataBase(config);

export const startServer = async () => {
	try {
		const schemas: GraphQLSchema[] = [];
		folders.forEach((folder) => {
			const { resolvers } = require(`./modules/${folder}/resolvers`);
			const typeDefs = importSchema(path.join(__dirname, `./modules/${folder}/schema.graphql`));
			schemas.push(makeExecutableSchema({ resolvers, typeDefs }));
		});
		const server = new GraphQLServer({ schema: mergeSchemas({ schemas }) });
		const dataBaseStarted = await dataBase.connect();
		if (dataBaseStarted) {
			console.log('Data base UP');
			await server.start();
			console.log('Server UP => localhost:4000');
		}
	} catch (error) {
		console.log('Error starting services');
	}
};

startServer();
