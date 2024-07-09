import { BaseContractMethod, ethers, HDNodeWallet, Wallet } from 'ethers';
import { confirm } from '@inquirer/prompts';
import { getInput } from './get-prompts';
import { NetworkParams } from './network-params';

export async function confirmSendTransaction(
	contractMethod: BaseContractMethod,
	args: unknown[],
	walletWithSigner: Wallet | HDNodeWallet,
	networkParams: NetworkParams,
): Promise<void> {
	const provider = walletWithSigner.provider;
	if (!provider) {
		throw new Error('Provider not found.');
	}

	const feeData = await provider.getFeeData();
	const suggestedMaxFeePerGas = feeData.maxFeePerGas ?? networkParams.maxFeePerGas;
	const maxFeePerGas = BigInt(
		await getInput({
			message: `Max Fee Per Gas (wei) (Suggested: ${suggestedMaxFeePerGas.toString()})`,
			default: suggestedMaxFeePerGas.toString(),
		}),
	);

	const suggestedMaxPriorityFeePerGas =
		feeData.maxPriorityFeePerGas ?? networkParams.maxPriorityFeePerGas;
	const maxPriorityFeePerGas = BigInt(
		await getInput({
			message: `Max Priority Fee Per Gas (wei) (Suggested: ${suggestedMaxPriorityFeePerGas.toString()})`,
			default: suggestedMaxPriorityFeePerGas.toString(),
		}),
	);

	const estimatedGas = await contractMethod.estimateGas(...args);
	const estimatedFee = estimatedGas * maxFeePerGas;
	const ethBalance = await provider.getBalance(walletWithSigner.address);
	console.log(
		`Estimated Network Fee (${estimatedGas} * ${maxFeePerGas} wei) = ${ethers.formatUnits(estimatedFee)} ETH.`,
	);
	console.log(`Your Balance: ${ethers.formatUnits(ethBalance)} ETH.`);
	if (estimatedFee > ethBalance) {
		throw new Error('Insufficient Balance for the Transaction.');
	}
	if (!(await confirm({ message: 'Confirm to Send Transaction', default: false }))) {
		throw new Error('User Cancelled Submission.');
	}

	const tx = await contractMethod(...args, {
		maxFeePerGas,
		maxPriorityFeePerGas,
	});
	console.log(`Successfully submitted transaction, tx: ${tx.hash}. Waiting for Confirmation ...`);

	const receipt = await tx.wait();
	console.log(`Transaction Confirmed at Block: ${receipt.blockNumber}!`);
}
