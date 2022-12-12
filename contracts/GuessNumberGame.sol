// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract GuessNumberGame {
    // Global Variables
    uint256 public endTime; // 目前輪次結束時間
    uint256 public interval; // 輪次間隔時長
    uint256 public ticketPrice = 0.0001 ether; // 門票
    uint256 public round = 1; // 當前輪次
    uint256 public pot = 0; // 當前輪次彩池獎金
    
    uint256 public constant MAX_NUMBER = 10000; // 最大號碼

    // Errors
    error EndTimeReached(uint256 endTime);

    // Mappings
    mapping(uint256 => mapping(uint256 => address[])) public tickets; // 輪次 => 號碼 => [選這號碼的地址們]
    mapping(uint256 => uint256) public winningNumber; // 輪次 => 該輪中獎號碼

    /// @param _endTime 第一輪結束時間
    /// @param _interval 輪次間隔時長
    constructor(uint256 _endTime, uint256 _interval) {
        require(_endTime > block.timestamp, 'End time must be in the future');
        endTime = _endTime;
        interval = _interval;
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

    /// @notice 超過本輪結束時間後，可由任何人呼叫，並帶入一組數字做為中獎號碼
    /// @param _randomNumber 中獎號碼
    function closeRound(uint256 _randomNumber) external {
        require(block.timestamp > endTime, 'Game has not ended');
        winningNumber[round] = _randomNumber;
        address[] memory winners = tickets[round][_randomNumber];
        round++;
        endTime += interval;
        if (winners.length > 0) {
            // 平分本輪彩金給所有中獎者
            uint256 earnings = pot / winners.length;
            pot = 0;
            for (uint256 i = 0; i < winners.length; i++) {
                (bool success, ) = payable(winners[i]).call{value: earnings}('');
                require(success, "receiver rejected ETH transfer");
            }
        }
    }
}
