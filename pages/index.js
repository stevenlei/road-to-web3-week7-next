import Head from "next/head";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ethers } from "ethers";

import Header from "../components/Header";
import Navbar from "../components/Navbar";

const API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
import MarketplaceContract from "../contracts/Marketplace.json";
let copiedTimeoutHandler;

export default function Home() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [balance, setBalance] = useState(0);

  const [listedItems, setListedItems] = useState([]);

  const [copied, setCopied] = useState([]);

  useEffect(() => {
    checkIfWalletIsConnected();
    walletChangeListener();

    fetchListedItems();
  }, []);

  useEffect(() => {
    if (walletAddress) {
      fetchBalance();
    }
  }, [walletAddress]);

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

  const getThumbnail = (item) => {
    if (item.media.length > 0 && item.media[0].thumbnail) {
      return item.media[0].thumbnail;
    } else if (item.media.length > 0 && item.media[0].raw.includes("svg+xml")) {
      let source = item.media[0].raw;

      if (source.includes("svg+xml;utf8,")) {
        let raw = source.split("utf8,")[1];
        source = `data:image/svg+xml;base64,${btoa(raw)}`;
      }

      return source;
    } else if (item.metadata.image) {
      let image = item.metadata.image;

      if (image.includes("ipfs://")) {
        image = image.replace("ipfs://", "https://cloudflare-ipfs.com/ipfs/");
      }

      return image;
    } else {
      return "/images/NFT.png";
    }
  };

  const getTitle = (item) => {
    let tokenId = Number(item.id.tokenId);

    if (item.title && !item.title.includes("#")) {
      return `${item.title} #${tokenId}`;
    } else if (item.title) {
      return item.title;
    } else if (!item.title) {
      return `#${tokenId}`;
    } else {
      // unlikely
      return "Untitled NFT";
    }
  };

  const shortenAddress = (address) => {
    if (address.length === 0) {
      return "";
    }

    return `${address.substr(0, 6)}...${address.substr(address.length - 4, 4)}`;
  };

  const copy = (address, index) => {
    if (copiedTimeoutHandler) {
      clearTimeout(copiedTimeoutHandler);
      setCopied([]);
    }

    navigator.clipboard.writeText(address);

    let copied = [];
    copied[index] = true;

    setCopied(copied);

    copiedTimeoutHandler = setTimeout(() => {
      setCopied([]);
    }, 1500);
  };

  const fetchListedItems = async () => {
    setIsLoading(true);

    const provider = new ethers.providers.AlchemyProvider("goerli", process.env.NEXT_PUBLIC_ALCHEMY_API_KEY);
    const marketplace = new ethers.Contract(
      process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT,
      MarketplaceContract.abi,
      provider
    );

    const listedItems = await marketplace.getItems(true);

    console.log(listedItems);

    const items = await Promise.all(
      listedItems
        .filter((item) => item.contractAddress !== "0x0000000000000000000000000000000000000000")
        .map(async (item) => {
          return {
            contractAddress: item.contractAddress,
            tokenId: item.tokenId,
            price: ethers.utils.formatEther(item.price),
            isListed: item.isListed,
            metadata: await fetchMetadata(item.contractAddress, item.tokenId),
          };
        })
    );

    setListedItems(items);

    console.log(items);

    setIsLoading(false);
  };

  const fetchMetadata = async (contractAddress, tokenId) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_ALCHEMY_API_URL}/getNFTMetadata?contractAddress=${contractAddress}&tokenId=${tokenId}`
    );

    const metadata = await res.json();

    return metadata;
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
          <Navbar active="marketplace" create={!!walletAddress} profile={!!walletAddress} />
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

        <div className="p-4 md:p-6 lg:p-8 xl:p-8 bg-slate-100 rounded-xl mt-8">
          <div className="flex gap-y-8 flex-wrap">
            {listedItems.length === 0 && (
              <div className="text-center text-xl flex-1 text-slate-600">
                {isLoading ? loadingIcon("text-slate-600") : "No results"}
              </div>
            )}

            {listedItems.map((item, index) => (
              <div key={index} className="w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5 2xl:w-1/6 p-2">
                <a
                  href={`/nft/${item.contractAddress}/${Number(item.tokenId)}/`}
                  target="_blank"
                  rel="noreferrer"
                  className="group"
                >
                  <div className="block transition overflow-hidden rounded-md bg-white">
                    <img
                      src={getThumbnail(item.metadata)}
                      className="w-full group-hover:scale-125 transition duration-400"
                    />
                  </div>
                  <h4 className="mt-2 text-lg text-slate-700 font-bold group-hover:text-slate-900">
                    {getTitle(item.metadata)}
                  </h4>
                </a>
                <div className="flex justify-between">
                  <h5 className="text-md text-slate-500 group-hover:text-slate-600">
                    {shortenAddress(item.contractAddress)}

                    {!copied[index] && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="inline-block ml-2 relative cursor-pointer text-slate-500"
                        height="18"
                        viewBox="0 0 24 24"
                        width="18"
                        onClick={() => copy(item.contractAddress, index)}
                      >
                        <path d="M0 0h24v24H0V0z" fill="none"></path>
                        <path
                          fill="currentColor"
                          d="M15 1H4c-1.1 0-2 .9-2 2v13c0 .55.45 1 1 1s1-.45 1-1V4c0-.55.45-1 1-1h10c.55 0 1-.45 1-1s-.45-1-1-1zm4 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-1 16H9c-.55 0-1-.45-1-1V8c0-.55.45-1 1-1h9c.55 0 1 .45 1 1v12c0 .55-.45 1-1 1z"
                        ></path>
                      </svg>
                    )}

                    {copied[index] && (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                        className="inline-block ml-2 relative cursor-pointer text-slate-500"
                      >
                        <path fill="none" d="M0 0h24v24H0V0Z" />
                        <path
                          fill="currentColor"
                          d="M9 16.17L5.53 12.7c-.39-.39-1.02-.39-1.41 0 -.39.39-.39 1.02 0 1.41l4.18 4.18c.39.39 1.02.39 1.41 0L20.29 7.71c.39-.39.39-1.02 0-1.41 -.39-.39-1.02-.39-1.41 0L9 16.17Z"
                        />
                      </svg>
                    )}
                  </h5>
                  <h5 className="text-md text-blue-700 text-right group-hover:text-slate-600">{item.price} ETH</h5>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
