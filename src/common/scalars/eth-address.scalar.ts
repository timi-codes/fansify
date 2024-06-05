import { GraphQLScalarType } from 'graphql/type';
import { EthereumAddress } from '../types';
import { ethers } from 'ethers';

function validate(address: EthereumAddress): string | never {
    if (!ethers.isAddress(address)) {
        throw new Error(`Invalid ethereum address: ${address}`);
    }
    return address;
}

export const EthereumAddressScalar = new GraphQLScalarType({
    name: 'EthereumAddress',
    description: `The user ethereum address. must be a valid 0x prefixed ethereum address`,
    serialize: (value) => validate(value as EthereumAddress),
    parseValue: (value) => validate(value as EthereumAddress),
    parseLiteral: (ast) => validate(ast['value']),
});
