// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract MarginTrading is ReentrancyGuard, Ownable {
    struct Position {
        address trader;
        bool isLong;
        uint256 size;
        uint256 collateral;
        uint256 entryPrice;
        uint256 liquidationPrice;
        bool isOpen;
    }

    mapping(bytes32 => Position) public positions;
    mapping(address => uint256) public margins;
    uint256 public leverageLimit = 10;
    uint256 public maintenanceMargin = 5; // 5%
    uint256 public liquidationFee = 2; // 2%

    event PositionOpened(bytes32 indexed positionId, address indexed trader, bool isLong, uint256 size, uint256 collateral);
    event PositionClosed(bytes32 indexed positionId, address indexed trader, uint256 pnl);
    event PositionLiquidated(bytes32 indexed positionId, address indexed trader, address liquidator);

    constructor() Ownable(msg.sender) {}

    function openPosition(
        bool isLong,
        uint256 size,
        uint256 leverage,
        uint256 price
    ) external nonReentrant returns (bytes32) {
        require(leverage <= leverageLimit, "Leverage exceeds limit");
        require(size > 0, "Size must be greater than 0");

        uint256 requiredCollateral = (size * 1e18) / leverage;
        require(margins[msg.sender] >= requiredCollateral, "Insufficient margin");

        bytes32 positionId = keccak256(
            abi.encodePacked(
                msg.sender,
                block.timestamp,
                isLong,
                size
            )
        );

        uint256 liquidationPrice = calculateLiquidationPrice(
            isLong,
            price,
            leverage,
            maintenanceMargin
        );

        positions[positionId] = Position({
            trader: msg.sender,
            isLong: isLong,
            size: size,
            collateral: requiredCollateral,
            entryPrice: price,
            liquidationPrice: liquidationPrice,
            isOpen: true
        });

        margins[msg.sender] -= requiredCollateral;

        emit PositionOpened(positionId, msg.sender, isLong, size, requiredCollateral);
        return positionId;
    }

    function closePosition(bytes32 positionId, uint256 currentPrice) external nonReentrant {
        Position storage position = positions[positionId];
        require(position.trader == msg.sender, "Not position owner");
        require(position.isOpen, "Position not open");

        uint256 pnl = calculatePnL(position, currentPrice);
        position.isOpen = false;
        
        if (pnl > 0) {
            margins[msg.sender] += position.collateral + pnl;
        } else {
            uint256 remainingCollateral = position.collateral > pnl ? position.collateral - pnl : 0;
            margins[msg.sender] += remainingCollateral;
        }

        emit PositionClosed(positionId, msg.sender, pnl);
    }

    function liquidatePosition(bytes32 positionId, uint256 currentPrice) external nonReentrant {
        Position storage position = positions[positionId];
        require(position.isOpen, "Position not open");
        require(
            isLiquidatable(position, currentPrice),
            "Position cannot be liquidated"
        );

        position.isOpen = false;
        uint256 liquidationReward = (position.collateral * liquidationFee) / 100;
        margins[msg.sender] += liquidationReward;
        margins[position.trader] += position.collateral - liquidationReward;

        emit PositionLiquidated(positionId, position.trader, msg.sender);
    }

    function calculateLiquidationPrice(
        bool isLong,
        uint256 entryPrice,
        uint256 leverage,
        uint256 maintenanceMarginPct
    ) public pure returns (uint256) {
        if (isLong) {
            return entryPrice - ((entryPrice * (100 - maintenanceMarginPct)) / (leverage * 100));
        } else {
            return entryPrice + ((entryPrice * (100 - maintenanceMarginPct)) / (leverage * 100));
        }
    }

    function calculatePnL(Position memory position, uint256 currentPrice) public pure returns (uint256) {
        if (position.isLong) {
            return currentPrice > position.entryPrice ? 
                   ((currentPrice - position.entryPrice) * position.size) / position.entryPrice :
                   ((position.entryPrice - currentPrice) * position.size) / position.entryPrice;
        } else {
            return currentPrice < position.entryPrice ?
                   ((position.entryPrice - currentPrice) * position.size) / position.entryPrice :
                   ((currentPrice - position.entryPrice) * position.size) / position.entryPrice;
        }
    }

    function isLiquidatable(Position memory position, uint256 currentPrice) public pure returns (bool) {
        return position.isLong ? 
               currentPrice <= position.liquidationPrice :
               currentPrice >= position.liquidationPrice;
    }

    function depositMargin() external payable {
        margins[msg.sender] += msg.value;
    }

    function withdrawMargin(uint256 amount) external nonReentrant {
        require(margins[msg.sender] >= amount, "Insufficient margin balance");
        margins[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
    }
}