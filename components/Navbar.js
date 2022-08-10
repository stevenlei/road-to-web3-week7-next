import Link from "next/link";

const Navbar = ({ active, marketplace = true, create = true, profile = true }) => {
  return (
    <ul className="flex gap-x-6 flex-wrap md:flex-nowarp">
      {marketplace && (
        <li
          className={`${
            active === "marketplace" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-800"
          } rounded-full w-full md:w-auto text-center md:text-left mb-4 md:mb-0`}
        >
          <Link href="/">
            <a className="block px-6 py-3 text-xl">Marketplace</a>
          </Link>
        </li>
      )}
      {create && (
        <li
          className={`${
            active === "create" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-800"
          } rounded-full w-full md:w-auto text-center md:text-left mb-4 md:mb-0`}
        >
          <Link href="/create">
            <a className="block px-6 py-3 text-xl">Create</a>
          </Link>
        </li>
      )}
      {profile && (
        <li
          className={`${
            active === "profile" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-800"
          } rounded-full w-full md:w-auto text-center md:text-left mb-4 md:mb-0`}
        >
          <Link href="/profile">
            <a className="block px-6 py-3 text-xl">My Profile</a>
          </Link>
        </li>
      )}
    </ul>
  );
};

export default Navbar;
