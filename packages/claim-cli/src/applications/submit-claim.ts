import { select, confirm } from '@inquirer/prompts';
import * as crypto from '@liskhq/lisk-cryptography';
import { ethers } from 'ethers';

import L2ClaimAbi from '../abi/L2Claim';
import publishMultisigClaim from './publish-multisig-claim';
import {
	buildAccountList,
	fetchCheckEligibility,
	fetchSubmitMultisig,
	NetworkParams,
	getETHWallet,
	getLSKPrivateKey,
	signMessage,
	printPreview,
	confirmSendTransaction,
	append0x,
	getInput,
} from '../utils';

export default async function submitClaim(networkParams: NetworkParams): Promise<void> {
	const privateKey = await getLSKPrivateKey();

	const lskAddressBytes = crypto.address.getAddressFromPrivateKey(privateKey);
	const lskAddress = crypto.address.getLisk32AddressFromAddress(lskAddressBytes);
	console.log('Representing LSK v4 Address:', lskAddress);

	const result = await fetchCheckEligibility(lskAddress, networkParams);
	if (!result.account && result.multisigAccounts.length === 0) {
		throw new Error(`No Eligible Claim for Address: ${lskAddress}.`);
	}

	const choices = await buildAccountList(result, networkParams);

	if (
		choices.reduce((numOfClaimed, choice) => numOfClaimed + (choice.claimed ? 1 : 0), 0) ==
		choices.length
	) {
		for (const [index, choice] of choices.entries()) {
			console.log(`${index + 1}: ${choice.value.lskAddress} ${choice.claimed}`);
		}
		throw new Error(`All accounts under ${lskAddress} have successfully been claimed.`);
	}

	const claimAccount = await select({
		message: 'Choose Claim Address',
		choices: choices.map(account => ({
			...account,
			disabled: !!account.claimed,
		})),
	});

	if (claimAccount.numberOfSignatures === 0) {
		// Regular Claim
		const wallet = await getETHWallet();
		const walletWithSigner = wallet.connect(new ethers.JsonRpcProvider(networkParams.rpc));
		console.log('Representing LSK L2 Address:', wallet.address);

		const destinationAddress = await getInput({
			message: 'Claim Destination Address',
			default: wallet.address,
		});

		const claimContract = new ethers.Contract(
			networkParams.l2Claim,
			L2ClaimAbi,
			new ethers.JsonRpcProvider(networkParams.rpc),
		);

		const signature = signMessage(claimAccount.hash, destinationAddress, privateKey);
		const contractWithSigner = claimContract.connect(walletWithSigner) as ethers.Contract;

		printPreview(claimAccount.lskAddress, destinationAddress, claimAccount.balanceBeddows);
		await confirmSendTransaction(
			contractWithSigner.claimRegularAccount,
			[
				claimAccount.proof,
				crypto.ed.getPublicKeyFromPrivateKey(privateKey),
				claimAccount.balanceBeddows,
				destinationAddress,
				[append0x(signature.substring(0, 64)), append0x(signature.substring(64))],
			],
			walletWithSigner,
			networkParams,
		);
	} else {
		// Multisig Claim
		const signedDestinationAddresses = result.signatures.reduce(
			(
				addresses: {
					name: string;
					value: string;
				}[],
				signature,
			) => {
				if (
					signature.lskAddress === claimAccount.lskAddress &&
					!addresses.find(address => address.value === signature.destination)
				) {
					addresses.push({
						name: signature.destination,
						value: signature.destination,
					});
				}
				return addresses;
			},
			[],
		);

		let destinationAddress = '';
		if (signedDestinationAddresses.length > 0) {
			destinationAddress = await select({
				message: 'Claim Destination Address',
				choices: signedDestinationAddresses.concat({
					name: 'Other Address',
					value: '',
				}),
			});
		}
		if (destinationAddress === '') {
			destinationAddress = await getInput({ message: 'Destination L2 Address' });
		}
		const signature = signMessage(claimAccount.hash, destinationAddress, privateKey);

		printPreview(claimAccount.lskAddress, destinationAddress, claimAccount.balanceBeddows);
		if (await confirm({ message: 'Confirm Signing this Claim', default: false })) {
			const submitResult = await fetchSubmitMultisig(
				claimAccount.lskAddress,
				destinationAddress,
				append0x(crypto.ed.getPublicKeyFromPrivateKey(privateKey).toString('hex')),
				append0x(signature.substring(0, 64)),
				append0x(signature.substring(64)),
				networkParams,
			);

			if (submitResult.success) {
				console.log('Success Submitted Signature to Claim API!');
			}

			if (
				submitResult.ready &&
				(await confirm({
					message: `Address: ${claimAccount.lskAddress} has reached sufficient signatures, proceed to publish?`,
				}))
			) {
				await publishMultisigClaim(networkParams, claimAccount.lskAddress);
			}
		}
	}
}
