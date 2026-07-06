import StatCard from "@/components/dashboard/StatCard";
import {
  stats,
  recentDocuments,
  recentChats,
} from "@/data/dashboardData";

function Dashboard() {
  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-3xl font-bold">
          Dashboard
        </h1>

        <p className="text-gray-500">
          Welcome back to NetPilot AI.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {stats.map((item) => (
          <StatCard
            key={item.title}
            {...item}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">

        <div className="bg-white rounded-xl shadow p-6">

          <h2 className="font-semibold text-xl mb-4">
            Recent Documents
          </h2>

          {recentDocuments.map((doc) => (
            <p
              key={doc}
              className="py-2 border-b"
            >
              {doc}
            </p>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow p-6">

          <h2 className="font-semibold text-xl mb-4">
            Recent AI Chats
          </h2>

          {recentChats.map((chat) => (
            <p
              key={chat}
              className="py-2 border-b"
            >
              {chat}
            </p>
          ))}
        </div>

      </div>

    </div>
  );
}

export default Dashboard;