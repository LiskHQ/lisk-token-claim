import fs from "fs";
import {Leaf} from "./interface";

const { leaves } = JSON.parse(
  fs.readFileSync('../../data/example/merkle-tree-result-detailed.json', 'utf-8'),
);

const leafMap: {
  [lskAddress: string]: Leaf;
} = {};

for (const leaf of leaves) {
  leafMap[leaf.lskAddress] = leaf;
}

console.log(`LeafMap: ${Object.keys(leafMap).length} Leaves loaded`);

export default leafMap;