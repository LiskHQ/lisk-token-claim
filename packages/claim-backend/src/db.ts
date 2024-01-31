import { Sequelize } from 'sequelize-typescript';
import Signature from './models/Signature.model';

class DB {
	private readonly sequelize: Sequelize;
	private readonly models;

	constructor() {
		this.models = [Signature];
		this.sequelize = new Sequelize({
			database: 'claim-backend',
			dialect: 'postgres',
			username: 'claim-backend',
			password: 'let-me-in',
			models: [__dirname + '/models/*.model.ts'],
			// logging: env.DB_LOGGING,
			port: Number(process.env.DB_PORT) || 5432,
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
