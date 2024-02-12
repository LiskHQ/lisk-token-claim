import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { JSONRPCServer } from 'json-rpc-2.0';
import { DB } from './db';
import { loadMerkleTree } from './utils/leaf-map';
import { submitMultisig } from './controllers/submit-multisig';
import { checkEligibility } from './controllers/check-eligibility';
dotenv.config();

const HOST = process.env.BACKEND_HOST || '127.0.0.1';
const PORT = Number(process.env.BACKEND_PORT) || 3000;
const corsOptions = {
	origin: process.env.CORS_ORIGIN || '*',
	methods: 'GET,POST',
};

void (async () => {
	loadMerkleTree();
	const app: Express = express();
	const server = new JSONRPCServer();

	app.use(cors(corsOptions));
	app.use(express.json());
	app.use(express.urlencoded({ extended: true }));

	server.addMethod('checkEligibility', checkEligibility);
	server.addMethod('submitMultisig', submitMultisig);

	// For Health Check from VPS monitoring
	app.get('/', (_, res) => res.send('OK'));

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

	app.listen(PORT, HOST, () => {
		console.info(`Claim Backend running at ${HOST}:${PORT}`);
	});
})();
