import type { ContractFunctionParameters } from 'viem';

const counterContractAddress = '0x62ab94ef702e83263bf7eb2301d927a041d55879';
const counterContractAbi = [
  {
    type: 'function',
    name: 'increment',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;

export const calls: readonly ContractFunctionParameters[] = [
  {
    address: counterContractAddress,
    abi: counterContractAbi,
    functionName: 'increment',
    args: [],
  },
];
