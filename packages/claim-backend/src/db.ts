import { Sequelize } from 'sequelize-typescript';
import Signature from './models/Signature.model';

class DB {
	private readonly sequelize: Sequelize;
	private readonly models;

	constructor() {
		this.models = [Signature];
		this.sequelize = new Sequelize({
			dialect: 'postgres',
			database: process.env.DB_DATABASE || 'claim-backend',
			username: process.env.DB_USERNAME || 'claim-backend',
			password: process.env.DB_PASSWORD || 'let-me-in',
			models: [__dirname + '/models/*.model.ts'],
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
