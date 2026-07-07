import { Outlet } from "react-router-dom";
import Sidebar from "./SideBar";
import Navbar from "./NavBar";

function MainLayout() {
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-250">
      <Sidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;