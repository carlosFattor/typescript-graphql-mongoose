import * as dotenv from 'dotenv';
dotenv.config();

const env = process.env.NODE_ENV;

export class Config {
	private development = {
		app: {
			port: Number(process.env.DEV_APP_PORT),
			secret: process.env.DEV_APP_SECRET,
			host: process.env.DEV_HOST
		},
		db: {
			user: process.env.DEV_DB_USER,
			password: process.env.DEV_DB_PASSWORD,
			host: process.env.DEV_DB_HOST,
			mongoDebug: process.env.DEV_DB_DEBUGGER,
			name: process.env.DEV_DB_NAME
		}
	};

	getConfig(): any {
		switch (env) {
			case 'development':
				return this.development;
			case 'test':
				return this.development;
		}
	}
}
