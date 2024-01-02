import * as fs from 'fs';
import { buildTreeJSON } from "../src/buildTreeJSON";
import {buildTree} from "../src/buildTree";

describe('buildTreeJSON', () => {
  const timestamp = Date.now();

  // Playing around with `example` network
  const path = "./data/example";

  let backedUp = false;
  beforeAll(() => {
    try {
      // Backing-up existing, ensure both files are newly built during testing
      fs.renameSync(`${path}/merkle-tree-result.json`, `${path}/merkle-tree-result-${timestamp}.json`);
      fs.renameSync(`${path}/merkle-tree-result-simple.json`, `${path}/merkle-tree-result-simple-${timestamp}.json`);
      backedUp = true;
    } catch (_) {
      console.log("Nothing to Back up")
    }
  });

  afterAll(() => {
    if (backedUp) {
      // Revert backed up
      fs.renameSync(`${path}/merkle-tree-result-${timestamp}.json`, `${path}/merkle-tree-result.json`);
      fs.renameSync(`${path}/merkle-tree-result-simple-${timestamp}.json`, `${path}/merkle-tree-result-simple.json`);
    }
  });

  it('should build JSON files with correct params', () => {
    const accounts = JSON.parse(fs.readFileSync(`${path}/accounts.json`, "utf-8"));
    const merkleTree = buildTree(accounts);
    buildTreeJSON(path);

    // Verify merkle-tree-result.json
    const merkleTreeResultJSON = JSON.parse(fs.readFileSync(`${path}/merkle-tree-result.json`, 'utf-8'));
    expect(merkleTreeResultJSON.merkleRoot).toBe(merkleTree.tree.root);
    expect(merkleTreeResultJSON.leaves.length).toBe(merkleTree.leaves.length);
    for (let i = 0; i < merkleTree.leaves.length; i++) {
      const jsonLeaf = merkleTreeResultJSON.leaves[i];
      const merkleTreeLeaf = merkleTree.leaves[i];

      expect(jsonLeaf.lskAddress).toBe(merkleTreeLeaf.lskAddress);
      expect(jsonLeaf.balance).toBe(merkleTreeLeaf.balance);
      expect(jsonLeaf.balanceBeddows).toBe(merkleTreeLeaf.balanceBeddows);
      expect(jsonLeaf.numberOfSignatures).toBe(merkleTreeLeaf.numberOfSignatures);
      expect(jsonLeaf.mandatoryKeys).toEqual(merkleTreeLeaf.mandatoryKeys);
      expect(jsonLeaf.optionalKeys).toEqual(merkleTreeLeaf.optionalKeys);
      expect(jsonLeaf.hash).toBe(merkleTreeLeaf.hash);
      expect(jsonLeaf.proof).toEqual(merkleTreeLeaf.proof);
    }

    // Verify merkle-tree-result-simple.json
    const merkleTreeResultSimpleJSON = JSON.parse(fs.readFileSync(`${path}/merkle-tree-result-simple.json`, 'utf-8'));
    expect(merkleTreeResultSimpleJSON.merkleRoot).toBe(merkleTree.tree.root);
    expect(merkleTreeResultSimpleJSON.leaves.length).toBe(merkleTree.leaves.length);
    for (let i = 0; i < merkleTree.leaves.length; i++) {
      const jsonLeaf = merkleTreeResultSimpleJSON.leaves[i];
      const merkleTreeLeaf = merkleTree.leaves[i];

      expect(jsonLeaf.b32Address).toBe(merkleTreeLeaf.address);
      expect(jsonLeaf.balanceBeddows).toBe(merkleTreeLeaf.balanceBeddows);
      expect(jsonLeaf.numberOfSignatures).toBe(merkleTreeLeaf.numberOfSignatures);
      expect(jsonLeaf.mandatoryKeys).toEqual(merkleTreeLeaf.mandatoryKeys);
      expect(jsonLeaf.optionalKeys).toEqual(merkleTreeLeaf.optionalKeys);
      expect(jsonLeaf.proof).toEqual(merkleTreeLeaf.proof);
    }

  });
});