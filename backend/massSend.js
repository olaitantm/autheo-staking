require("dotenv").config();
const { ethers } = require("ethers");
const recipients = require("./wallets.json");

async function main() {

  // Provider
  const provider = new ethers.JsonRpcProvider(
    process.env.RPC_URL
  );

  // Admin wallet
  const wallet = new ethers.Wallet(
    process.env.PRIVATE_KEY,
    provider
  );

  // ERC20 token contract
  const token = new ethers.Contract(
    process.env.TOKEN_ADDRESS,
    [
      "function transfer(address to, uint amount) public returns (bool)",
      "function decimals() view returns (uint8)",
      "function balanceOf(address owner) view returns (uint)"
    ],
    wallet
  );

  const decimals = await token.decimals();

  console.log("Sender Wallet:", wallet.address);

  const balance = await token.balanceOf(wallet.address);

  console.log(
    "Token Balance:",
    ethers.formatUnits(balance, decimals)
  );

  // Loop through recipients
  for (const user of recipients) {

    try {

      console.log(
        `\nSending ${user.amount} tokens to ${user.address}`
      );

      const tx = await token.transfer(
        user.address,
        ethers.parseUnits(user.amount, decimals)
      );

      console.log("Transaction Sent:", tx.hash);

      await tx.wait();

      console.log("Transfer Successful");

    } catch (err) {

      console.error(
        `Failed sending to ${user.address}`
      );

      console.error(err.message);
    }
  }

  console.log("\nAll transfers completed");
}

main().catch(console.error);
