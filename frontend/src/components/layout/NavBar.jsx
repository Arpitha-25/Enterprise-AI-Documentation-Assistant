function Navbar() {
  return (
    <header className="bg-white h-16 shadow flex justify-between items-center px-8">
      <h2 className="text-xl font-semibold">
        Network Documentation Assistant
      </h2>

      <div className="flex items-center gap-4">
        <button className="text-xl">🔔</button>

        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
          A
        </div>
      </div>
    </header>
  );
}

export default Navbar;