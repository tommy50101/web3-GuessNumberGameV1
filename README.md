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

#### 4. 備註

有分支 v2，開彩決果是透過 Airnode 取得隨機數，但尚未成功
已有有透過 AWS, dxFeed, ChainAPI, API3(Airnode) 實際部屬一個能接收鏈下 API 的 Requester 合約在 goerli 鏈上，線上調用也有成功取得隨機數
- requester contract: 0xcf52a2ebd2c8ef4cc531ebaeda2d8629f56c4ee7 
- sponsor wallet: 0x24f436D655c09Bc7920Bea7e461d7A2Da3713c2C
- sponsor: 0xcf52a2ebd2c8ef4cc531ebaeda2d8629f56c4ee7 
- airnode: 0x4f15d2ECFc6b960eB5a4C22075788e7Ac9326437
- endpointId: 0x070b496e7aa9aff248b803c7c3ac6a55f52893ae14f0d841c9ccf3b205ca5865

但是在 hardhat 裡一直沒法成功實現這個 Requester 功能，還在努力嘗試中
所以目前 master 分支版本的取得隨機數比較不安全，等我 v2 嘗試成功後會在 merge 進去
