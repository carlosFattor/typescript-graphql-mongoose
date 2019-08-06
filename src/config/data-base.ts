import * as mongoose from 'mongoose';

export class DataBase {
	private config: any;
	constructor(config: any) {
		this.config = config;
		process.on('SIGINT', () => {
			mongoose.connection.close(() => {
				process.exit(0);
			});
		});
	}

	async connect(): Promise<boolean> {
		const URI = `mongodb://${this.config.db.host}/${this.config.db.name}`;
		mongoose.set('debug', this.config.db.mongoDebug);
		try {
			await mongoose.connect(URI, {
				useNewUrlParser: true
			});
			console.log('Database connection successfully');
			return true;
		} catch (error) {
			console.log(`database connection error => ${error.message}`);
			return false;
		}
	}
}
