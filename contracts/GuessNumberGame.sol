// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@api3/airnode-protocol/contracts/rrp/requesters/RrpRequesterV0.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract GuessNumberGame is RrpRequesterV0, Ownable  {
    // Defining the Parameters for the request
    bytes public parameters = abi.encode(
        bytes32("1SSSS"),  // 這行定義有幾個 parameters，例如這邊有4個，就是4個S
        bytes32("symbol"),
        "TSLA",
        bytes32("event"),
        "Trade",
        bytes32("_path"),
        "Trade.TSLA.price",
        bytes32("_type"),
        "int256"
    ); 

    // Global Variables
    uint256 public endTime; // 目前輪次結束時間
    uint256 public interval; // 輪次間隔時長
    uint256 public ticketPrice = 0.0001 ether; // 門票
    uint256 public round = 1; // 當前輪次
    uint256 public pot = 0; // 當前輪次彩池獎金

    address public constant airnodeAddress = 0x4f15d2ECFc6b960eB5a4C22075788e7Ac9326437;
    bytes32 public constant endpointId = 0x070b496e7aa9aff248b803c7c3ac6a55f52893ae14f0d841c9ccf3b205ca5865;
    address payable public sponsorWallet;
    
    uint256 public constant MAX_NUMBER = 10000; // 最大號碼

    // Errors
    error EndTimeReached(uint256 endTime);

    // Mappings
    mapping(uint256 => mapping(uint256 => address[])) public tickets; // 輪次 => 號碼 => [選這號碼的地址們]
    mapping(uint256 => uint256) public winningNumber; // 輪次 => 該輪中獎號碼
    mapping(bytes32 => bool) public pendingRequestIds; // mapping to store pending request ids

     // Events
    event RequestedRandomNumber(bytes32 indexed requestId);
    event ReceivedRandomNumber(bytes32 indexed requestId, uint256 randomNumber);

    /// @param _endTime 第一輪結束時間
    /// @param _interval 輪次間隔時長
    constructor(uint256 _endTime, uint256 _interval, address _airnodeRrpAddress)
        RrpRequesterV0(_airnodeRrpAddress)
    {
        if (_endTime <= block.timestamp) revert EndTimeReached(_endTime);
        endTime = _endTime; // store the end time of the lottery
        interval = _interval;
    }

    function setSponsorWallet(address payable _sponsorWallet)
        external
        onlyOwner
    {
        sponsorWallet = _sponsorWallet;
    }

    /// @notice 處理轉進來的錢
    receive() external payable {
        pot += msg.value;
    }

    /// @notice 取得所有已選擇 該輪、該號碼 的地址
    /// @param _round 輪次
    /// @param _number 號碼
    function getEntriesForNumber(uint256 _number, uint256 _round) public view returns (address[] memory) {
        return tickets[_round][_number];
    }

    /// @notice 買票並參與選號
    /// @param _number 要選的號碼
    function enter(uint256 _number) external payable {
        require(_number <= MAX_NUMBER, 'Number must be 1-MAX_NUMBER');
        if (block.timestamp >= endTime) revert EndTimeReached(endTime);
        require(msg.value == ticketPrice, 'Ticket price is 0.0001 ether');
        tickets[round][_number].push(msg.sender);
        pot += ticketPrice;
    }

    //
    function getWinningNumberAndCloseRound() external payable {
        require(msg.value >= 0.01 ether, "Please top up sponsor wallet"); // user needs to send 0.01 ether with the transaction
        bytes32 requestId = airnodeRrp.makeFullRequest(
            airnodeAddress,
            endpointId,
            address(this),
            sponsorWallet,
            address(this),
            this.closeRound.selector,
            ""
        );
        pendingRequestIds[requestId] = true;
        emit RequestedRandomNumber(requestId);
        sponsorWallet.call{value: msg.value}(""); // Send funds to sponsor wallet
    }

    // 給 rrp 回調的函式
    function closeRound(bytes32 requestId, bytes calldata data)
        external
        onlyAirnodeRrp
    {
        require(pendingRequestIds[requestId], "No such request made");
        delete pendingRequestIds[requestId];

        uint256 _randomNumber = abi.decode(data, (uint256)) % MAX_NUMBER;
        emit ReceivedRandomNumber(requestId, _randomNumber);

        winningNumber[round] = _randomNumber;
        address[] memory winners = tickets[round][_randomNumber];
        unchecked {
            ++round;
        }
        endTime +=  1 days;
        if (winners.length > 0) {
            uint256 earnings = pot / winners.length;
            pot = 0; // reset pot
            for (uint256 i = 0; i < winners.length; ) {
                payable(winners[i]).call{value: earnings}(""); 
                unchecked {
                    ++i;
                }
            }
        }
    }
}
