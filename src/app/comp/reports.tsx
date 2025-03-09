"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["#4CAF50", "#FF9800", "#F44336", "#2196F3", "#9C27B0", "#00BCD4", "#8BC34A", "#FFEB3B"]; // Extended color palette

type Item = {
  id: number;
  Item_name: string;
  locker: number;
  unit: string;
  quantity: number;
  avail: number;
  created_at: string;
  stat: number;
};

type Equipment = {
  id: number;
  equipment_name: string;
  Department: string;
  serial_num: string;
  count: number;
  status: string;
};

export default function ReportsComponent({
  itemsData,
  equipmentData,
}: {
  itemsData: Item[];
  equipmentData: Equipment[];
}) {
  // Prepare Data for Bar Chart (Items)
  const itemChartData = itemsData.map(item => ({
    name: item.Item_name,
    quantity: item.quantity,
  }));

  // Prepare Data for Pie Chart (Equipment Status)
  const statusCounts = equipmentData.reduce((acc, equipment) => {
    acc[equipment.status] = (acc[equipment.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const equipmentStatusData = Object.keys(statusCounts).map(status => ({
    name: status,
    value: statusCounts[status],
  }));

  // Prepare Data for Bar Chart (Departments & Status Count with Dynamic Colors)
  const departmentStatusCounts = equipmentData.reduce((acc, equipment) => {
    const key = `${equipment.Department} (${equipment.status})`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const departmentStatusData = Object.keys(departmentStatusCounts).map((dep, index) => ({
    name: dep,
    count: departmentStatusCounts[dep],
    fill: COLORS[index % COLORS.length], // Assigning dynamic colors
  }));

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">📊 Reports</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Items Report */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">📦 Supplies Report</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={itemChartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="quantity" fill="#4CAF50" barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Equipment Report */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">🛠️ Equipment Report</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={equipmentStatusData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label
              >
                {equipmentStatusData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Department Status Bar Chart */}
        <div className="bg-white shadow-lg rounded-lg p-6 col-span-1 md:col-span-2">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">🏢 Department Equipment Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentStatusData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" barSize={40}>
                {departmentStatusData.map((entry, index) => (
                  <Cell key={`bar-cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
