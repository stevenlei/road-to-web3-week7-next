const Header = () => {
  return (
    <>
      <div className="flex flex-wrap md:flex-nowrap">
        <h1 className="text-5xl text-white w-full md:flex-1">
          Road to Web3
          <br />
          <strong>Week 7</strong>
        </h1>
        <a
          target="_blank"
          rel="noreferrer"
          href="https://twitter.com/stevenkin"
          className="mt-4 md:mt-0 bg-slate-800 text-slate-300 rounded-full text-sm self-start py-2 px-4 hover:bg-slate-700"
        >
          Follow me @stevenkin
        </a>
      </div>
      <p className="mt-4 text-lg text-slate-500">
        This is a practice project to learn Solidity and ethers.js. The seventh week is to &quot;Create an NFT
        Marketplace&quot; using Alchemy API.
        <br />
        <a
          href="https://docs.alchemy.com/docs/7-how-to-build-an-nft-marketplace-from-scratch"
          target="_blank"
          rel="noreferrer"
          className="inline-block bg-slate-800 rounded-md text-slate-300 mt-4 p-1 px-2 hover:bg-slate-700"
        >
          ➡️ Amazing tutorial here
        </a>
      </p>
    </>
  );
};

export default Header;
