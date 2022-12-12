# Guess Number Game

## Instructions

### Setup

npm i

#### 1. Initialize a Node.js project

In a terminal, initialize a project by running the following command:

```
npm init -y
```

#### 2. Full test

Run the test command to see the boilerplate contract in action.

```
npx hardhat test
```

#### 3. 玩法

1. 部屬合約時，輸入第一輪的終止日期(timestamp)
2. 參賽者可以調用 enter(uint256 _number)，選號並支付ETH作為參加費用 (預設參加費為0.0001e)
3. 調用 getEntriesForNumber(uint256 _number, uint256 _week)，可查詢特定輪次的某個號碼共有哪些人選擇
3. 當時間超過本輪終止日期，任何人皆可調用 closeWeek(uint256 _randomNumber)，參數為最終結果之數字
4. 獎金會在調用 closeWeek() 時，平分給所有猜中的用戶
5. 結束後繼續下一輪，每輪預設投注時長為一天
