import { Args, Command, Flags } from '@oclif/core';
import {createAccounts} from "../../applications/example/create-accounts";
import {buildTreeJSON} from "../../applications/buildTreeJSON";
import {signAccounts} from "../../applications/example/sign";

export default class Example extends Command {
  static args = {
    person: Args.string({ description: 'Person to say hello to', required: true }),
  };

  static description = 'Generate example data for demo purpose';

  static examples = [
    `$ oex generate`,
  ];

  static flags = {
    from: Flags.string({ char: 'f', description: 'Who is saying hello', required: true }),
  };

  async run(): Promise<void> {
    // Create Accounts using dev-validators.ts with random balances
    createAccounts();

    // Build MerkleTree to example
    buildTreeJSON(`../../data/example`);

    // Sign all leaves using dev-validators.ts again
    signAccounts();

    this.log("Success!");
  }
}
