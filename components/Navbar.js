import Link from "next/link";

const Navbar = ({ active, marketplace = true, create = true, profile = true }) => {
  return (
    <ul className="flex gap-x-6">
      {marketplace && (
        <li
          className={`${
            active === "marketplace" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-800"
          } rounded-full`}
        >
          <Link href="/">
            <a className="block px-6 py-3 text-xl">Marketplace</a>
          </Link>
        </li>
      )}
      {create && (
        <li
          className={`${active === "create" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-800"} rounded-full`}
        >
          <Link href="/create">
            <a className="block px-6 py-3 text-xl">Create</a>
          </Link>
        </li>
      )}
      {profile && (
        <li
          className={`${active === "profile" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-800"} rounded-full`}
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
