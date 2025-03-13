// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract Exchange is ReentrancyGuard, Ownable {
    struct Order {
        address trader;
        bool isBuyOrder;
        uint256 amount;
        uint256 price;
        uint256 filled;
        bool isActive;
    }

    mapping(bytes32 => Order) public orders;
    mapping(address => mapping(address => uint256)) public balances;
    mapping(string => AggregatorV3Interface) public priceFeeds;

    event OrderCreated(bytes32 indexed orderId, address indexed trader, bool isBuyOrder, uint256 amount, uint256 price);
    event OrderFilled(bytes32 indexed orderId, address indexed maker, address indexed taker, uint256 amount, uint256 price);
    event OrderCancelled(bytes32 indexed orderId);

    constructor() Ownable(msg.sender) {}

    function createOrder(
        bool isBuyOrder,
        uint256 amount,
        uint256 price,
        address token
    ) external nonReentrant returns (bytes32) {
        require(amount > 0, "Amount must be greater than 0");
        require(price > 0, "Price must be greater than 0");

        bytes32 orderId = keccak256(
            abi.encodePacked(
                msg.sender,
                block.timestamp,
                isBuyOrder,
                amount,
                price
            )
        );

        if (isBuyOrder) {
            require(
                balances[msg.sender][address(0)] >= amount * price,
                "Insufficient balance"
            );
        } else {
            require(
                balances[msg.sender][token] >= amount,
                "Insufficient token balance"
            );
        }

        orders[orderId] = Order({
            trader: msg.sender,
            isBuyOrder: isBuyOrder,
            amount: amount,
            price: price,
            filled: 0,
            isActive: true
        });

        emit OrderCreated(orderId, msg.sender, isBuyOrder, amount, price);
        return orderId;
    }

    function cancelOrder(bytes32 orderId) external {
        Order storage order = orders[orderId];
        require(order.trader == msg.sender, "Not order owner");
        require(order.isActive, "Order not active");

        order.isActive = false;
        emit OrderCancelled(orderId);
    }

    function deposit() external payable {
        balances[msg.sender][address(0)] += msg.value;
    }

    function withdraw(uint256 amount) external nonReentrant {
        require(balances[msg.sender][address(0)] >= amount, "Insufficient balance");
        balances[msg.sender][address(0)] -= amount;
        payable(msg.sender).transfer(amount);
    }

    function depositToken(address token, uint256 amount) external {
        require(IERC20(token).transferFrom(msg.sender, address(this), amount), "Transfer failed");
        balances[msg.sender][token] += amount;
    }

    function withdrawToken(address token, uint256 amount) external nonReentrant {
        require(balances[msg.sender][token] >= amount, "Insufficient token balance");
        balances[msg.sender][token] -= amount;
        require(IERC20(token).transfer(msg.sender, amount), "Transfer failed");
    }

    function setPriceFeed(string memory symbol, address feed) external onlyOwner {
        priceFeeds[symbol] = AggregatorV3Interface(feed);
    }

    function getLatestPrice(string memory symbol) public view returns (int) {
        AggregatorV3Interface feed = priceFeeds[symbol];
        require(address(feed) != address(0), "Price feed not found");
        
        (
            uint80 roundID,
            int price,
            uint startedAt,
            uint timeStamp,
            uint80 answeredInRound
        ) = feed.latestRoundData();
        
        return price;
    }
}