import Head from "next/head";
import Link from "next/link";
import { useState, useEffect } from "react";
import axios from "axios";
import { ethers } from "ethers";
import Router from "next/router";

import Header from "../components/Header";
import Navbar from "../components/Navbar";

const API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
import MarketplaceContract from "../contracts/Marketplace.json";

let copiedTimeoutHandler;

export default function Home() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [balance, setBalance] = useState(0);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [royalty, setRoyalty] = useState("0");
  const [nftImageFile, setNftImageFile] = useState(null);
  const [nftImageIpfsHash, setNftImageIpfsHash] = useState(null);

  const [creatorFee, setCreatorFee] = useState("0");

  useEffect(() => {
    checkIfWalletIsConnected();
    walletChangeListener();
    fetchCreatorFee();
  }, []);

  useEffect(() => {
    if (walletAddress) {
      fetchBalance();
    }
  }, [walletAddress]);

  useEffect(() => {
    if (nftImageFile) {
      sendFileToIPFS();
    }
  }, [nftImageFile]);

  const checkIfWalletIsConnected = async () => {
    try {
      if (window.ethereum) {
        const { ethereum } = window;

        const accounts = await ethereum.request({
          method: "eth_accounts",
        });

        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        }
      }
    } catch (err) {
      console.error("Please install metamask");
    }
  };

  const connectWallet = async () => {
    return new Promise(async (resolve, reject) => {
      try {
        if (window.ethereum) {
          const { ethereum } = window;

          const accounts = await ethereum.request({
            method: "eth_requestAccounts",
          });

          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);

            resolve(accounts[0]);
          } else {
            alert("No address found");
          }
        }
      } catch (err) {
        console.error(err);
      }
    });
  };

  const walletChangeListener = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        ethereum.on("accountsChanged", async (accounts) => {
          if (accounts.length === 0) {
            // Disconnected
            setWalletAddress(null);
          } else {
            setWalletAddress(accounts[0]);
          }
        });
      }
    } catch (err) {}
  };

  const fetchBalance = async () => {
    const provider = new ethers.providers.AlchemyProvider("goerli", process.env.NEXT_PUBLIC_ALCHEMY_API_KEY);

    console.log(walletAddress);

    const balance = await provider.getBalance(walletAddress);

    setBalance(Number(ethers.utils.formatEther(balance)).toFixed(4));
  };

  const loadingIcon = (color = "text-white") => (
    <svg
      className={`animate-spin -mt-1 h-6 w-6 ${color} inline-block`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );

  const shortenAddress = (address) => {
    if (address.length === 0) {
      return "";
    }

    return `${address.substr(0, 6)}...${address.substr(address.length - 4, 4)}`;
  };

  const sendFileToIPFS = async (e) => {
    if (nftImageFile) {
      try {
        setIsUploading(true);

        const formData = new FormData();
        formData.append("file", nftImageFile);

        const resFile = await axios({
          method: "post",
          url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
          data: formData,
          headers: {
            pinata_api_key: `${process.env.NEXT_PUBLIC_PINATA_API_KEY}`,
            pinata_secret_api_key: `${process.env.NEXT_PUBLIC_PINATA_API_SECRET}`,
            "Content-Type": "multipart/form-data",
          },
        });

        const imageHash = resFile.data.IpfsHash;

        setNftImageIpfsHash(imageHash);
      } catch (error) {
        console.log("Error sending File to IPFS: ");
        console.log(error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const fetchCreatorFee = async () => {
    const provider = new ethers.providers.AlchemyProvider("goerli", process.env.NEXT_PUBLIC_ALCHEMY_API_KEY);
    const markatplace = new ethers.Contract(
      process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT,
      MarketplaceContract.abi,
      provider
    );

    const creatorFee = await markatplace.creatorFee();

    setCreatorFee(ethers.utils.formatUnits(creatorFee, "ether"));
  };

  const createNft = async (e) => {
    try {
      setIsLoading(true);

      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT,
          MarketplaceContract.abi,
          signer
        );

        let tokenURI = `data:application/json;base64,${btoa(
          JSON.stringify({
            name: name,
            description: description,
            image: `ipfs://${nftImageIpfsHash}`,
          })
        )}`;

        let royaltyRate = ethers.utils.parseUnits((royalty / 100).toString(), "gwei");

        const tx = await contract.createNFT(tokenURI, royaltyRate, {
          value: ethers.utils.parseEther(creatorFee),
        });

        const receipt = await tx.wait();

        const mintedTokenId = Number(receipt.events[0].topics[3]);

        Router.push(`/nft/${process.env.NEXT_PUBLIC_CREATOR_CONTRACT}/${mintedTokenId}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Head>
        <title>Road to Web3 - Week 7</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="px-6 py-12 md:p-20">
        <Header />

        <div className="bg-slate-50 p-8 mt-8 flex justify-between rounded-xl shadow-xl shadow-slate-900 gap-x-8 flex-wrap lg:flex-nowrap">
          <Navbar active="create" create={!!walletAddress} profile={!!walletAddress} />
          <ul className="flex gap-x-6">
            {!walletAddress && (
              <li className="bg-blue-600 text-white rounded-full hover:bg-blue-700">
                <button onClick={connectWallet} className="block px-6 py-3 text-xl">
                  Connect Wallet
                </button>
              </li>
            )}
            {walletAddress && (
              <li className="text-right text-lg">
                <p className="text-slate-600">
                  Connected <strong>{shortenAddress(walletAddress)}</strong>
                </p>
                <p className="text-slate-400 text-md">Balance: {balance} ETH</p>
              </li>
            )}
          </ul>
        </div>

        <div className="p-4 md:p-6 lg:p-8 xl:p-12 bg-slate-100 rounded-xl mt-8">
          <h2 className="text-3xl font-bold">Create NFT</h2>

          <div className="flex gap-x-8 flex-wrap md:flex-nowrap">
            <div className="flex-1">
              <div className="my-4 mt-8">
                <label htmlFor="name" className="text-lg font-bold mb-2">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  className="w-full px-4 py-2 mt-1 border rounded-lg shadow-sm focus:outline-none focus:shadow-outline"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="my-4">
                <label htmlFor="description" className="text-lg font-bold mb-2">
                  Description
                </label>
                <input
                  id="description"
                  type="text"
                  className="w-full px-4 py-2 mt-1 border rounded-lg shadow-sm focus:outline-none focus:shadow-outline"
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="my-4">
                <label htmlFor="description" className="text-lg font-bold mb-2">
                  Royalty %
                </label>
                <input
                  id="royalty"
                  type="text"
                  className="w-full px-4 py-2 mt-1 border rounded-lg shadow-sm focus:outline-none focus:shadow-outline"
                  placeholder="Royalty %"
                  value={royalty}
                  onChange={(e) => setRoyalty(e.target.value)}
                />
              </div>
              <div className="my-4">
                <label htmlFor="description" className="text-lg font-bold mb-2">
                  Creator Contract Address (From this Marketplace)
                </label>
                <h6 className="w-full px-4 py-2 mt-1 border rounded-lg bg-slate-200 text-slate-800">
                  {process.env.NEXT_PUBLIC_CREATOR_CONTRACT}
                </h6>
              </div>
              <div className="my-4">
                <label htmlFor="description" className="text-lg font-bold mb-2">
                  Creation Fee
                </label>
                <h6 className="w-full px-4 py-2 mt-1 border rounded-lg bg-slate-200 text-slate-800">
                  {creatorFee} ETH
                </h6>
              </div>
            </div>
            <div className="w-full sm:w-48 md:w-64 xl:w-72">
              <div className="my-8">
                <label className="text-lg font-bold mb-2">Image</label>
                <div className="mt-1 bg-white rounded-lg border px-4 shadow-sm flex flex-col justify-center items-center">
                  <div className="pt-4 pb-8 flex justify-center items-center flex-col">
                    {nftImageIpfsHash && (
                      <>
                        <img src={`https://cloudflare-ipfs.com/ipfs/${nftImageIpfsHash}`} className="w-full" />

                        <p className="px-4 pt-4">
                          <a
                            href={`https://cloudflare-ipfs.com/ipfs/${nftImageIpfsHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-700"
                          >
                            Image Uploaded, might not be appeared immediately, click here to view.
                          </a>
                        </p>
                      </>
                    )}
                    {isUploading && <div className="mt-6">{loadingIcon("text-slate-800")}</div>}
                  </div>
                  <form>
                    <label
                      htmlFor="nftImage"
                      className="inline-block cursor-pointer px-6 py-3 text-md bg-slate-800 hover:bg-slate-700 rounded-full text-white"
                    >
                      Select Image to Upload
                    </label>
                    <input
                      type="file"
                      id="nftImage"
                      className="hidden"
                      onChange={(e) => setNftImageFile(e.target.files[0])}
                      required
                    />
                  </form>
                  <p className="mt-10 px-4 pb-10">
                    <strong>Important:</strong>
                    <br />
                    Selected image will be uploaded to an IPFS network, which is public.
                  </p>
                </div>
              </div>
              <div className="text-right mt-6">
                <button
                  className="px-6 py-3 text-xl bg-slate-800 rounded-full text-white"
                  onClick={createNft}
                  disabled={isLoading}
                >
                  {isLoading ? loadingIcon() : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
