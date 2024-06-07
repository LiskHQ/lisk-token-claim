import { BaseContractMethod, ethers, HDNodeWallet, Wallet } from 'ethers';
import { input, confirm } from '@inquirer/prompts';

export default async function confirmSendTransaction(
	contractMethod: BaseContractMethod,
	args: unknown[],
	walletWithSigner: Wallet | HDNodeWallet,
) {
	const provider = walletWithSigner.provider;
	if (!provider) {
		process.exit(1);
	}

	const feeData = await provider.getFeeData();
	const suggestedMaxFeePerGas = feeData.maxFeePerGas ?? BigInt(1);
	const maxFeePerGas = BigInt(
		await input({
			message: `Max Fee Per Gas (wei) (Suggested: ${suggestedMaxFeePerGas.toString()})`,
			default: suggestedMaxFeePerGas.toString(),
		}),
	);

	const suggestedMaxPriorityFeePerGas = feeData.maxPriorityFeePerGas ?? BigInt(1);
	const maxPriorityFeePerGas = BigInt(
		await input({
			message: `Max Priority Fee Per Gas (wei) (Suggested: ${suggestedMaxPriorityFeePerGas.toString()})`,
			default: suggestedMaxPriorityFeePerGas.toString(),
		}),
	);

	const estimatedGas = await contractMethod.estimateGas(...args);
	const estimatedFee = estimatedGas * maxFeePerGas;
	const ethBalance = await provider.getBalance(walletWithSigner.address);
	console.log(
		`> Estimated Network Fee (${estimatedGas} * ${maxFeePerGas} wei) = ${ethers.formatUnits(estimatedFee)} ETH.`,
	);
	console.log(`> Your Balance: ${ethers.formatUnits(ethBalance)} ETH`);
	if (estimatedFee > ethBalance) {
		console.log('Insufficient Balance for the Transaction.');
		process.exit(1);
	}
	if (!(await confirm({ message: 'Confirm to Send Transaction', default: false }))) {
		console.log('User Cancelled Submission.');
		process.exit(1);
	}

	const tx = await contractMethod(...args, {
		maxFeePerGas,
		maxPriorityFeePerGas,
	});
	console.log(`Successfully submitted transaction, tx: ${tx.hash}. Waiting for Confirmation ...`);

	const receipt = await tx.wait();
	console.log(`Transaction Confirmed at Block: ${receipt.blockNumber}!`);
}
