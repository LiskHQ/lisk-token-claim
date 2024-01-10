import express, { Express } from 'express';
import { address as addressUtil } from '@liskhq/lisk-cryptography';
import * as fs from 'fs';
import { Leaf } from './interface';

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const { leaves } = JSON.parse(
	fs.readFileSync('../../data/example/merkle-tree-result-detailed.json', 'utf-8'),
);

const leafMap: {
	[lskAddress: string]: Leaf;
} = {};

for (const leaf of leaves) {
	leafMap[leaf.lskAddress] = leaf;
}

console.log(`${Object.keys(leafMap).length} Leaves loaded`);
app.post('/check', (req: express.Request, res: express.Response) => {
	const { address } = req.body;
	try {
		addressUtil.validateLisk32Address(address);
	} catch (_) {
		res.status(400).json({
			error: true,
			message: `'${address}' is not a valid address.`,
		});
		return;
	}

	if (!leafMap[address]) {
		res.status(400).json({ error: true, message: `${address} has no eligible claim.` });
		return;
	}
	res.json(leafMap[address]);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
	console.info(`server up on port ${PORT}`);
});
