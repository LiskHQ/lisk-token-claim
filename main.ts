import { Network } from './src/interface';
import { buildTreeJSON } from './src/buildTreeJSON';

let network: Network;

switch (process.argv[2]) {
	case '--testnet': {
		network = 'testnet';
		break;
	}
	case '--mainnet': {
		network = 'mainnet';
		break;
	}
	default: {
		network = 'example';
		break;
	}
}

const path = `./data/${network}`;
console.log(`Running at \x1b[42m${network}\x1b[0m`);

buildTreeJSON(path);
