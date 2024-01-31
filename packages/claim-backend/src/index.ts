import express, { Express } from 'express';
import { check } from './controllers/check';
import { DB } from './db';
import { submitMultisig } from './controllers/submit-multisig';
import { loadMerkleTree } from './utils/leaf-map';
import { JSONRPCServer } from 'json-rpc-2.0';

const PORT = process.env.PORT || 3000;
const server = new JSONRPCServer();

void (async () => {
	{
		loadMerkleTree();
		const app: Express = express();

		app.use(express.json());
		app.use(express.urlencoded({ extended: true }));

		server.addMethod('check', check);
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
