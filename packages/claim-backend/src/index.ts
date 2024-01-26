import express, { Express } from 'express';
import { check } from './controllers/check';
import { DB } from './db';
import { submitMultisig } from './controllers/submitMultisig';

const PORT = process.env.PORT || 3000;

void (async () => {
	{
		const app: Express = express();

		app.use(express.json());
		app.use(express.urlencoded({ extended: true }));

		app.post('/check', check);
		app.post('/submitMultisig', submitMultisig);

		const db = new DB();
		await db.sync();

		app.listen(PORT, () => {
			console.info(`Claim Backend running at port ${PORT}`);
		});
	}
})();
