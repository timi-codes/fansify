// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/*
    🤖 Feed free to write your code the way you want to. We only expect
    that you satisfy the following requirements:

        - Should be Ownable
        - Should be ERC1155
*/

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract WavesERC1155Token is Initializable, ERC1155Upgradeable, OwnableUpgradeable {
    uint256 public maxWavePerCreator;
    mapping(address => mapping(uint256 => uint256)) public tokensMintedByCreator;

    function initialize(string memory _uri, address account, uint256 _maxWavePerCreator) public initializer {
        __ERC1155_init(_uri);
        __Ownable_init(account);
        maxWavePerCreator = _maxWavePerCreator;
    }

    function mint(address account, uint256 id, uint256 amount, bytes memory data) public onlyOwner {
        // Check if the creator has reached the maximum number of waves
        require(tokensMintedByCreator[account][id] + amount <= maxWavePerCreator, "Exceeds maximum mintable waves");
        _mint(account, id, amount, data);
        tokensMintedByCreator[account][id] += amount;
    }

    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) public onlyOwner {
        _mintBatch(to, ids, amounts, data);
        for (uint256 i = 0; i < ids.length; i++) {
            tokensMintedByCreator[to][ids[i]] += amounts[i];
        }
    }

    function setMaxWavePerCreator(uint256 _maxWavePerCreator) external onlyOwner {
        maxWavePerCreator = _maxWavePerCreator;
    }

    function uri(uint256 id) public view override returns (string memory) {
        return string(abi.encodePacked(super.uri(id), ".json"));
    }

    function setURI(string memory newuri) external onlyOwner {
        _setURI(newuri);
    }

    function burn(address account, uint256 id, uint256 amount) external onlyOwner {
        _burn(account, id, amount);
    }
}