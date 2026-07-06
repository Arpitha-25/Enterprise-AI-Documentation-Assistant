import { LayoutDashboard, FileText, MessageSquare, User, Shield } from "lucide-react";
import { NavLink } from "react-router-dom";

const menuItems = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Documents", path: "/documents", icon: FileText },
  { name: "AI Chat", path: "/chat", icon: MessageSquare },
  { name: "Profile", path: "/profile", icon: User },
  { name: "Admin", path: "/admin", icon: Shield },
];

function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col p-5">
      <h1 className="text-2xl font-bold mb-10">NetPilot AI</h1>

      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-lg transition ${
                  isActive
                    ? "bg-blue-600"
                    : "hover:bg-slate-800"
                }`
              }
            >
              <Icon size={20} />
              {item.name}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;