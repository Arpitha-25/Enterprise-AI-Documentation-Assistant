import { Card, CardContent } from "@/components/ui/card";

function StatCard({ title, value, color }) {
  return (
    <Card className="shadow-md hover:shadow-xl transition">
      <CardContent className="p-6">
        <div className={`w-3 h-3 rounded-full ${color} mb-4`} />

        <h2 className="text-gray-500">{title}</h2>

        <h1 className="text-3xl font-bold mt-2">
          {value}
        </h1>
      </CardContent>
    </Card>
  );
}

export default StatCard;