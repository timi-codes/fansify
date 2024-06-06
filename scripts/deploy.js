async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);

  const WavesERC1155Token =
    await ethers.getContractFactory('WavesERC1155Token');
  const DEFAULT_WAVE_PER_CREATOR = 20;

  const wavesERC1155Token = await upgrades.deployProxy(WavesERC1155Token, ["https://ipfs.io/ipfs/bafybeihjjkwdrxxjnuwevlqtqmh3iegcadc32sio4wmo7bv2gbf34qs34a/{id}.json", deployer.address, DEFAULT_WAVE_PER_CREATOR], { initializer: 'initialize' });
  console.log('WavesERC1155Token deployed to:', wavesERC1155Token.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
