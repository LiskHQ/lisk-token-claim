import * as fs from 'fs';
import { Account } from './interface';
import { buildTree } from './buildTree';

export const buildTreeJSON = (path: string) => {
  let accounts;
  try {
    accounts = JSON.parse(fs.readFileSync(`${path}/accounts.json`, 'utf-8')) as Account[];
  } catch (err) {
    console.log(`Error occurred reading ${path}/accounts.json`);
    if (err instanceof Error) {
      console.log(err.message);
    }
    process.exit(1);
  }

  const { tree, leaves } = buildTree(accounts);
  fs.writeFileSync(
    `${path}/merkle-tree-result.json`,
    JSON.stringify({
      merkleRoot: tree.root,
      leaves,
    }),
    'utf-8',
  );

  console.log(`Result outputted to: ${path}/merkle-tree-result.json`);

  fs.writeFileSync(
    `${path}/merkle-tree-result-simple.json`,
    JSON.stringify({
      merkleRoot: tree.root,
      leaves: leaves.map(leaf => ({
        b32Address: leaf.address,
        balanceBeddows: leaf.balanceBeddows,
        mandatoryKeys: leaf.mandatoryKeys ?? [],
        numberOfSignatures: leaf.numberOfSignatures ?? 0,
        optionalKeys: leaf.optionalKeys ?? [],
        proof: leaf.proof,
      })),
    }),
    'utf-8',
  );

  console.log(`Lightweight result outputted to: ${path}/merkle-tree-result-simple.json`);
};