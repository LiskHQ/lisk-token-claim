import { ethers, ZeroHash } from 'ethers';
import { select } from '@inquirer/prompts';

import L2ClaimAbi from '../abi/L2Claim';
import {
	NetworkParams,
	fetchCheckEligibility,
	getETHWallet,
	confirmSendTransaction,
	printPreview,
	getInput,
} from '../utils/';

export default async function publishMultisigClaim(
	networkParams: NetworkParams,
	address: string | null = null,
): Promise<void> {
	const provider = new ethers.JsonRpcProvider(networkParams.rpc);
	const lskAddress = address || (await getInput({ message: 'Multisig Address to be published' }));
	const result = await fetchCheckEligibility(lskAddress, networkParams);
	if (!result.account) {
		throw new Error(`Address ${lskAddress} has no eligibility.`);
	}

	if (!result.account.ready) {
		throw new Error(
			`Address ${lskAddress} is not a Multisig address, or has insufficient signatures.`,
		);
	}

	const claimContract = new ethers.Contract(networkParams.l2Claim, L2ClaimAbi, provider);
	const claimedTo = await claimContract.claimedTo(result.account.address);
	if (claimedTo !== ethers.ZeroAddress) {
		throw new Error(`Address ${lskAddress} has already been claimed.`);
	}

	const wallet = await getETHWallet();
	const walletWithSigner = wallet.connect(provider);
	console.log('Representing LSK L2 Address:', wallet.address);

	const signaturesGroupByDestinationAddress = result.signatures.reduce(
		(
			destinationGroup: {
				[destination: string]: {
					r: string;
					s: string;
				}[];
			},
			signature,
		) => {
			if (result.account.lskAddress !== signature.lskAddress) {
				return destinationGroup;
			}
			if (!destinationGroup[signature.destination]) {
				destinationGroup[signature.destination] = new Array(
					result.account.mandatoryKeys.length + result.account.optionalKeys.length,
				).fill({
					r: ZeroHash,
					s: ZeroHash,
				});
			}

			if (result.account.mandatoryKeys.indexOf(signature.signer) >= 0) {
				destinationGroup[signature.destination][
					result.account.mandatoryKeys.indexOf(signature.signer)
				] = {
					r: signature.r,
					s: signature.s,
				};
			} else {
				destinationGroup[signature.destination][
					result.account.mandatoryKeys.length +
						result.account.optionalKeys.indexOf(signature.signer)
				] = {
					r: signature.r,
					s: signature.s,
				};
			}
			return destinationGroup;
		},
		{},
	);

	const destinationWithSufficientSignatures = Object.keys(
		signaturesGroupByDestinationAddress,
	).filter(destination => {
		const signatures = signaturesGroupByDestinationAddress[destination];

		// If one of mandatory Keys is ZeroHash, return false
		for (const signature of signatures.slice(0, result.account.mandatoryKeys.length)) {
			if (signature.r === ZeroHash) {
				return false;
			}
		}

		// Count non-Zero optional Keys
		const nonZeroOptionalKeys = signatures
			.slice(result.account.mandatoryKeys.length + 1)
			.reduce(
				(nonZeroOptionalKeys, signature) =>
					nonZeroOptionalKeys + signature.r === ethers.ZeroHash ? 0 : 1,
				0,
			);
		return (
			nonZeroOptionalKeys ===
			result.account.numberOfSignatures - result.account.mandatoryKeys.length
		);
	});

	const destinationIndex =
		destinationWithSufficientSignatures.length > 1
			? await select({
					message: 'Destination',
					choices: destinationWithSufficientSignatures.map((destination, index) => ({
						name: destination,
						value: index,
					})),
				})
			: 0;

	const destination = destinationWithSufficientSignatures[destinationIndex];
	const signatures = signaturesGroupByDestinationAddress[destination];

	const contractWithSigner = claimContract.connect(walletWithSigner) as ethers.Contract;

	printPreview(result.account.lskAddress, destination, result.account.balanceBeddows);
	await confirmSendTransaction(
		contractWithSigner.claimMultisigAccount,
		[
			result.account.proof,
			result.account.address,
			result.account.balanceBeddows,
			[result.account.mandatoryKeys, result.account.optionalKeys],
			destination,
			signatures.map(signature => [signature.r, signature.s]),
		],
		walletWithSigner,
		networkParams,
	);
}
