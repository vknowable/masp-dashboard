function Header() {
  return (
    <div className="flex items-center justify-start bg-inherit gap-4 p-4">
      <img
        src="/images/masp.png"
        alt="Masp logo"
        className="w-[55px] h-[55px] rounded-lg"
      />
      <h1 className="font-xl text-[24px] leading-[2.8rem] tracking-[0.1px] text-black dark:text-[#FFFF00]">
        {"Namada Shielded Metrics".toUpperCase()}
      </h1>
      {/* <button className="bg-gray-300 text-white px-4 py-2 rounded-md" disabled={true}>
        Connect Keychain
      </button> */}
    </div>
  );
}

export default Header;
