import { Sequelize } from 'sequelize-typescript';
import Signature from './models/signature.model';

class DB {
	private readonly sequelize: Sequelize;
	private readonly models;

	constructor() {
		this.models = [Signature];
		this.sequelize = new Sequelize({
			dialect: 'postgres',
			host: process.env.DB_HOST || '127.0.0.1',
			database: process.env.DB_DATABASE || 'claim-backend',
			username: process.env.DB_USERNAME || 'claim-backend',
			password: process.env.DB_PASSWORD || 'passwd',
			models: [__dirname + '/models/*.model.ts'],
			port: Number(process.env.DB_PORT) || 5432,
			logging: process.env.DB_LOGGING !== 'false',
			dialectOptions:
				process.env.DB_SSLMODE === 'true'
					? {
							ssl: {
								require: true,
								rejectUnauthorized: false,
							},
						}
					: {},
		});
		this.sequelize.addModels(this.models);
	}

	public async sync() {
		for (const model of this.models) {
			await model.sync({
				alter: true,
			});
		}
	}
}

export { DB, Signature };
