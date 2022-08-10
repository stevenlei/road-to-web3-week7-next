import { getJsonWalletAddress } from "ethers/lib/utils";
import Head from "next/head";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { ethers } from "ethers";

import Header from "../../../components/Header";
import Navbar from "../../../components/Navbar";

import MarketplaceContract from "../../../contracts/Marketplace.json";

const Info = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isListing, setIsListing] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [isUnlisting, setIsUnlisting] = useState(false);
  const [nft, setNft] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [listInfo, setListInfo] = useState(null);

  const [balance, setBalance] = useState(0);

  const [sellingPrice, setSellingPrice] = useState("");

  const router = useRouter();
  const { contract, token } = router.query;

  useEffect(() => {
    checkIfWalletIsConnected();
    walletChangeListener();
  }, []);

  useEffect(() => {
    if (contract && token) {
      fetchNft();
      fetchIsOwner();
      fetchListInfo();
    }
  }, [contract, token]);

  useEffect(() => {
    if (walletAddress) {
      fetchIsOwner();
      fetchBalance();
    }
  }, [walletAddress]);

  useEffect(() => {
    if (isOwner) {
      fetchIsApproved();
    }
  }, [isOwner]);

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

  const shortenAddress = (address) => {
    if (address.length === 0) {
      return "";
    }

    return `${address.substr(0, 6)}...${address.substr(address.length - 4, 4)}`;
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

  const fetchNft = async () => {
    setIsLoading(true);

    try {
      const baseURL = `${process.env.NEXT_PUBLIC_ALCHEMY_API_URL}/getNFTMetadata/`;
      let requestOptions = {
        method: "GET",
      };

      let fetchURL;
      fetchURL = `${baseURL}?contractAddress=${contract}&tokenId=${token}`;

      nft = await fetch(fetchURL, requestOptions).then((data) => data.json());

      console.log(nft);
      setNft(nft);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

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

  const copy = (address) => {
    navigator.clipboard.writeText(address);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1500);
  };

  const fetchIsOwner = async () => {
    if (!walletAddress) return;

    try {
      const provider = new ethers.providers.AlchemyProvider("goerli", process.env.NEXT_PUBLIC_ALCHEMY_API_KEY);
      const nftContract = new ethers.Contract(
        contract,
        ["function ownerOf(uint256 _tokenId) external view returns (address)"],
        provider
      );

      const ownerAddress = await nftContract.ownerOf(token);

      setIsOwner(ownerAddress.toLowerCase() === walletAddress.toLowerCase());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchIsApproved = async () => {
    const provider = new ethers.providers.AlchemyProvider("goerli", process.env.NEXT_PUBLIC_ALCHEMY_API_KEY);
    const nftContract = new ethers.Contract(
      contract,
      ["function getApproved(uint256 _tokenId) external view returns (address)"],
      provider
    );

    const approvedAddress = await nftContract.getApproved(token);

    setIsApproved(approvedAddress.toLowerCase() === process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT.toLowerCase());
  };

  const correctSellingPrice = () => {
    if (!sellingPrice) return false;

    if (
      listInfo &&
      listInfo.isListed &&
      listInfo.price &&
      ethers.utils.formatUnits(listInfo.price, "ether") === sellingPrice
    ) {
      return false;
    }

    return true;
  };

  const approve = async () => {
    try {
      setIsApproving(true);

      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const nftContract = new ethers.Contract(
          contract,
          ["function approve(address _approved, uint256 _tokenId) external payable"],
          signer
        );

        const tx = await nftContract.approve(process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT, token);
        await tx.wait();

        await fetchIsApproved();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsApproving(false);
    }
  };

  const fetchListInfo = async () => {
    const provider = new ethers.providers.AlchemyProvider("goerli", process.env.NEXT_PUBLIC_ALCHEMY_API_KEY);
    const marketplace = new ethers.Contract(
      process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT,
      MarketplaceContract.abi,
      provider
    );

    const index = await marketplace.indexOfItem(contract, token);

    if (index.toNumber() === 0) {
      return;
    }

    const item = await marketplace.getItem(index);

    setListInfo(item);

    setSellingPrice(ethers.utils.formatUnits(item.price, "ether"));
  };

  const listItem = async () => {
    try {
      setIsListing(true);

      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const marketplace = new ethers.Contract(
          process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT,
          MarketplaceContract.abi,
          signer
        );

        let tx;

        if (listInfo && listInfo.isListed) {
          tx = await marketplace.updatePrice(contract, token, ethers.utils.parseEther(sellingPrice));
        } else {
          tx = await marketplace.listItem(contract, token, ethers.utils.parseEther(sellingPrice));
        }

        await tx.wait(2);

        // Update info after listing
        await fetchListInfo();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsListing(false);
    }
  };

  const unlist = async () => {
    try {
      setIsUnlisting(true);

      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const marketplace = new ethers.Contract(
          process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT,
          MarketplaceContract.abi,
          signer
        );

        const tx = await marketplace.unlistItem(contract, token);

        await tx.wait(2);

        // Update info after listing
        await fetchListInfo();
        await fetchIsOwner();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUnlisting(false);
    }
  };

  const purchase = async () => {
    try {
      setIsBuying(true);

      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const marketplace = new ethers.Contract(
          process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT,
          MarketplaceContract.abi,
          signer
        );

        const tx = await marketplace.sale(contract, token, {
          value: listInfo.price,
        });
        await tx.wait();

        // Update info after listing
        await fetchListInfo();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsBuying(false);
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

        <div className="p-4 md:p-6 lg:p-8 xl:p-12 bg-slate-100 rounded-xl mt-8">
          <div className="flex md:mt-4 flex-wrap md:flex-nowrap">
            {!nft && <div className="text-center py-12 w-full">{loadingIcon("text-slate-600")}</div>}
            {nft && (
              <>
                <div className="block rounded-md bg-white w-full md:w-1/3 lg:w-1/3 2xl:w-1/4 self-start">
                  <img
                    src={getThumbnail(nft)}
                    className="w-full group-hover:scale-125 transition duration-400 rounded-md"
                  />
                </div>
                <div className="mt-8 md:mt-0 md:ml-12 flex-1">
                  <h4 className="text-4xl text-slate-700 font-bold group-hover:text-slate-900">{getTitle(nft)}</h4>
                  <ul className="mt-10 text-xl text-slate-500">
                    <li className="flex mt-2 flex-wrap">
                      <span className="block w-full lg:w-60">Contract Address</span>
                      <span className="block flex-1 text-slate-700 break-word break-all">
                        <a
                          href={`https://etherscan.io/address/${nft.contract.address}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-slate-900"
                        >
                          {nft.contract.address}
                        </a>
                        {!copied && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="inline-block ml-4 -top-1 relative cursor-pointer text-slate-500"
                            height="24"
                            viewBox="0 0 24 24"
                            width="24"
                            onClick={() => copy(nft.contract.address)}
                          >
                            <path d="M0 0h24v24H0V0z" fill="none"></path>
                            <path
                              fill="currentColor"
                              d="M15 1H4c-1.1 0-2 .9-2 2v13c0 .55.45 1 1 1s1-.45 1-1V4c0-.55.45-1 1-1h10c.55 0 1-.45 1-1s-.45-1-1-1zm4 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-1 16H9c-.55 0-1-.45-1-1V8c0-.55.45-1 1-1h9c.55 0 1 .45 1 1v12c0 .55-.45 1-1 1z"
                            ></path>
                          </svg>
                        )}

                        {copied && (
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                            className="inline-block ml-4 -top-1 relative cursor-pointer text-slate-500"
                          >
                            <path fill="none" d="M0 0h24v24H0V0Z" />
                            <path
                              fill="currentColor"
                              d="M9 16.17L5.53 12.7c-.39-.39-1.02-.39-1.41 0 -.39.39-.39 1.02 0 1.41l4.18 4.18c.39.39 1.02.39 1.41 0L20.29 7.71c.39-.39.39-1.02 0-1.41 -.39-.39-1.02-.39-1.41 0L9 16.17Z"
                            />
                          </svg>
                        )}
                      </span>
                    </li>
                    <li className="flex mt-2">
                      <span className="block w-full lg:w-60">Token ID</span>
                      <span className="block flex-1 text-slate-700">#{Number(nft.id.tokenId)}</span>
                    </li>
                    {listInfo && listInfo.isListed && (
                      <>
                        {listInfo.royalty.toNumber() !== 0 && (
                          <>
                            <li className="flex mt-8">
                              <span className="block w-full lg:w-60">Royalty Address</span>
                              <span className="block flex-1 text-slate-700">{listInfo.royaltyAddress}</span>
                            </li>
                            <li className="flex mt-2">
                              <span className="block w-full lg:w-60">Royalty Rate</span>
                              <span className="block flex-1 text-slate-700">
                                {+ethers.utils.formatUnits(listInfo.royalty, "gwei") * 100}%
                              </span>
                            </li>
                          </>
                        )}
                        <li className="flex mt-8">
                          <span className="block w-full lg:w-60">Seller</span>
                          <span className="block flex-1 text-slate-700">{listInfo.seller}</span>
                        </li>
                        <li className="flex mt-2">
                          <span className="block w-full lg:w-60">Selling Price</span>
                          <span className="block flex-1 text-slate-700 font-bold text-3xl">
                            {ethers.utils.formatEther(listInfo.price)} ETH
                          </span>
                        </li>
                        {walletAddress && (
                          <li className="flex mt-8">
                            <span className="block w-full lg:w-60"></span>
                            <span className="block flex-1 text-slate-700">
                              <button
                                disabled={walletAddress.toLowerCase() === listInfo.seller.toLowerCase() || isBuying}
                                className="w-60 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 self-end py-2 text-xl rounded-full text-white"
                                onClick={purchase}
                              >
                                {isBuying ? loadingIcon() : "Buy Now"}
                              </button>
                            </span>
                          </li>
                        )}
                      </>
                    )}
                  </ul>
                  {nft.metadata.attributes && nft.metadata.attributes.length > 0 && (
                    <>
                      <h4 className="mt-12 text-slate-700 text-2xl">Attributes</h4>
                      <ul className="flex gap-4 md:gap-6 mt-4 flex-wrap">
                        {nft.metadata.attributes.map((item, index) => (
                          <li
                            key={index}
                            className="px-4 py-2 md:px-6 md:py-4 bg-white rounded-xl ring-2 ring-slate-200"
                          >
                            <span className="uppercase block text-slate-400 text-sm">{item.trait_type}</span>
                            <span className="text-slate-700 text-xl">{item.value}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {isOwner && (
                    <div className="flex-1 p-8 bg-white mt-12 rounded-lg shadow-sm border">
                      <h4 className="font-bold text-xl text-slate-600">
                        {listInfo && listInfo.isListed ? "Update Listing" : "List this NFT"}
                      </h4>
                      <div className="my-4 mt-8 flex gap-x-4">
                        {isApproved ? (
                          <>
                            <div className="flex-1">
                              <label htmlFor="sellingPrice" className="text-lg font-bold mb-2">
                                Price
                              </label>
                              <input
                                id="sellingPrice"
                                type="text"
                                disabled={isListing || isUnlisting}
                                className="w-full px-4 disabled:bg-slate-100 py-2 mt-1 border rounded-lg shadow-sm focus:outline-none focus:shadow-outline"
                                placeholder="Selling Price in ETH"
                                value={sellingPrice}
                                onChange={(e) => setSellingPrice(e.target.value)}
                              />
                            </div>
                            <button
                              disabled={!isApproved || !correctSellingPrice() || isListing}
                              className="w-60 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 self-end py-2 text-lg rounded-full text-white"
                              onClick={listItem}
                            >
                              {isListing ? (
                                loadingIcon()
                              ) : (
                                <>{listInfo && listInfo.isListed ? "Update Listing" : "Confirm Listing"}</>
                              )}
                            </button>
                            {listInfo && listInfo.isListed && (
                              <button
                                disabled={isUnlisting}
                                className="w-60 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-200 disabled:text-slate-400 self-end py-2 text-lg rounded-full text-white"
                                onClick={unlist}
                              >
                                {isUnlisting ? loadingIcon() : "Unlist"}
                              </button>
                            )}
                          </>
                        ) : (
                          <button
                            disabled={isApproved || isApproving}
                            className="w-60 bg-yellow-500 hover:bg-yellow-600 disabled:bg-slate-200 disabled:text-slate-400 self-end py-2 text-lg rounded-full text-white"
                            onClick={approve}
                          >
                            {isApproving ? loadingIcon() : "Approve"}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Info;
