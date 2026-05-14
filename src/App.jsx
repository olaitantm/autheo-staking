import { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./App.css";
import dashboardImage from "./assets/autheo-stake-dashboard-design.png";
const TOKEN_ADDRESS = "0x483AF137568B773Ffaf2a7FC930a09bfE5a7A474";
const STAKING_ADDRESS = "0x3D859448BFCBCA30e3627cdE5FA03507c305Ecbd";
const CHAIN_ID = 785;
const RPC_URL = "https://testnet-rpc1.autheo.com";

const tokenAbi = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)",
];

const stakingAbi = [
  "function stake(uint256 amount) external",
  "function claim() external",
  "function balanceOf(address user) external view returns (uint256)",
  "function earned(address user) external view returns (uint256)",
];

function App() {
  const [wallet, setWallet] = useState("");
  const [amount, setAmount] = useState("");
  const [tokenBalance, setTokenBalance] = useState("0");
  const [stakedBalance, setStakedBalance] = useState("0");
  const [rewardBalance, setRewardBalance] = useState("0");
  const [loading, setLoading] = useState(false);
  const [tokenSymbol, setTokenSymbol] = useState("TOKEN");

  async function connectWallet() {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask");
        return;
      }

      await window.ethereum
        .request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: ethers.toBeHex(CHAIN_ID) }],
        })
        .catch(async () => {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: ethers.toBeHex(CHAIN_ID),
                chainName: "Autheo Testnet",
                nativeCurrency: {
                  name: "AUT",
                  symbol: "AUT",
                  decimals: 18,
                },
                rpcUrls: [RPC_URL],
              },
            ],
          });
        });

      const provider = new ethers.BrowserProvider(window.ethereum);

      const accounts = await provider.send("eth_requestAccounts", []);

      setWallet(accounts[0]);

      loadBalances(accounts[0]);
    } catch (err) {
      console.error(err);
      alert("Wallet connection failed");
    }
  }

  async function loadBalances(userAddress) {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);

      const token = new ethers.Contract(
        TOKEN_ADDRESS,
        tokenAbi,
        provider
      );

      const staking = new ethers.Contract(
        STAKING_ADDRESS,
        stakingAbi,
        provider
      );

      const [tokenBal, stakedBal, rewards, symbol] = await Promise.all([
        token.balanceOf(userAddress),
        staking.balanceOf(userAddress),
        staking.earned(userAddress),
        token.symbol(),
      ]);

      setTokenBalance(ethers.formatUnits(tokenBal, 18));
      setStakedBalance(ethers.formatUnits(stakedBal, 18));
      setRewardBalance(ethers.formatUnits(rewards, 18));
      setTokenSymbol(symbol);
    } catch (err) {
      console.error(err);
    }
  }

  async function stakeTokens() {
    try {
      if (!amount || Number(amount) <= 0) {
        alert("Enter a valid amount");
        return;
      }

      setLoading(true);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const token = new ethers.Contract(
        TOKEN_ADDRESS,
        tokenAbi,
        signer
      );

      const staking = new ethers.Contract(
        STAKING_ADDRESS,
        stakingAbi,
        signer
      );

      const parsedAmount = ethers.parseUnits(amount, 18);

      const approveTx = await token.approve(
        STAKING_ADDRESS,
        parsedAmount
      );

      await approveTx.wait();

      const stakeTx = await staking.stake(parsedAmount);

      await stakeTx.wait();

      alert("Stake successful");

      loadBalances(wallet);

      setAmount("");
    } catch (err) {
      console.error(err);
      alert("Stake failed");
    } finally {
      setLoading(false);
    }
  }

  async function claimRewards() {
    try {
      setLoading(true);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const staking = new ethers.Contract(
        STAKING_ADDRESS,
        stakingAbi,
        signer
      );

      const tx = await staking.claim();

      await tx.wait();

      alert("Rewards claimed");

      loadBalances(wallet);
    } catch (err) {
      console.error(err);
      alert("Claim failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (window.ethereum && wallet) {
      loadBalances(wallet);
    }
  }, [wallet]);
return (
  <div
    style={{
      minHeight: "100vh",
      backgroundImage: `url(${dashboardImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      color: "white",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "20px",
      fontFamily: "Arial",
    }}
  >
    <div
      style={{
        width: "420px",
        background: "rgba(15, 23, 42, 0.82)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "20px",
        padding: "30px",
        boxShadow: "0 0 30px rgba(0,0,0,0.4)",
      }}
    >
        <h1 style={{ textAlign: "center", marginBottom: "10px" }}>
          Autheo Staking
        </h1>

        <p style={{ textAlign: "center", color: "#94a3b8" }}>
          Stake your testnet tokens and earn rewards.
        </p>

        {!wallet ? (
          <button
            onClick={connectWallet}
            style={buttonStyle("#2563eb")}
          >
            Connect Wallet
          </button>
        ) : (
          <>
            <div style={cardStyle}>
              <p><strong>Wallet</strong></p>
              <p style={{ fontSize: "13px", wordBreak: "break-all" }}>
                {wallet}
              </p>
            </div>

            <div style={cardStyle}>
              <p><strong>Token Balance</strong></p>
              <h2>
                {Number(tokenBalance).toFixed(2)} {tokenSymbol}
              </h2>
            </div>

            <div style={cardStyle}>
              <p><strong>Staked Balance</strong></p>
              <h2>
                {Number(stakedBalance).toFixed(2)} {tokenSymbol}
              </h2>
            </div>

            <div style={cardStyle}>
              <p><strong>Pending Rewards</strong></p>
              <h2>
                {Number(rewardBalance).toFixed(2)} {tokenSymbol}
              </h2>
            </div>

            <input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "10px",
                border: "none",
                marginTop: "10px",
                boxSizing: "border-box",
              }}
            />

            <button
              onClick={stakeTokens}
              disabled={loading}
              style={buttonStyle("#2563eb")}
            >
              {loading ? "Processing..." : "Stake"}
            </button>

            <button
              onClick={claimRewards}
              disabled={loading}
              style={buttonStyle("#059669")}
            >
              {loading ? "Processing..." : "Claim Rewards"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const cardStyle = {
  background: "#1e293b",
  padding: "15px",
  borderRadius: "12px",
  marginTop: "15px",
};

function buttonStyle(color) {
  return {
    width: "100%",
    padding: "14px",
    marginTop: "15px",
    borderRadius: "10px",
    border: "none",
    background: color,
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "16px",
  };
}

export default App;
