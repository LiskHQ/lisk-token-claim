import express, { Express } from 'express';
import dotenv from 'dotenv';
import { JSONRPCServer } from 'json-rpc-2.0';
import { DB } from './db';
import { loadMerkleTree } from './utils/leaf-map';
import { submitMultisig } from './controllers/submit-multisig';
import { checkEligibility } from './controllers/check-eligibility';
dotenv.config();

const PORT = process.env.PORT || 3000;
const server = new JSONRPCServer();

void (async () => {
	{
		loadMerkleTree();
		const app: Express = express();

		app.use(express.json());
		app.use(express.urlencoded({ extended: true }));

		server.addMethod('checkEligibility', checkEligibility);
		server.addMethod('submitMultisig', submitMultisig);

		app.post('/rpc', (req, res) => {
			const jsonRPCRequest = req.body;

			void server.receive(jsonRPCRequest).then(jsonRPCResponse => {
				if (jsonRPCResponse) {
					res.json(jsonRPCResponse);
				} else {
					res.sendStatus(204);
				}
			});
		});

		const db = new DB();
		await db.sync();

		app.listen(PORT, () => {
			console.info(`Claim Backend running at port ${PORT}`);
		});
	}
})();
