"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { TBL } from "../comp/item-tables"
import { TBL2 } from "../comp/equipment-tbl";
import ReportsComponent from "../comp/reports"; 
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react"; // Icon for sidebar toggle

interface Item {
  id: number;
  Item_name: string;
  locker: number;
  unit: string;
  quantity: number;
  avail: number;
  created_at: string;
  stat: number;
  
}

interface Equipment  {
  id: number;
  equipment_name: string;
  Department: string;
  serial_num: string;
  count: number;
  status: string;
};

export default function BlackHeaderPage() {
  const [itemsData, setItemsData] = useState<Item[]>([]);
  const [equipmentData, setEquipmentData] = useState<Equipment[]>([]);
  const [activeTable, setActiveTable] = useState("equipment");
  
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Sidebar state
  const router = useRouter();


  useEffect(() => {
    
    const stat = localStorage.getItem("stat");
    if (stat !== "1") {
      router.push("/"); // Redirect to login page
    }
  }, [router]);

  // Function to fetch data from Supabase
  const fetchData = async (table: string) => {
    setLoading(true);
    const { data, error } = await supabase.from(table).select("*");
    if (error) console.error(`Error fetching ${table}:`, error.message);

    if (table === "ITEMS") {
      setItemsData(data || []);
    } else if (table === "equipment") {
      setEquipmentData(data || []);
    }

    setLoading(false);
   
  };

  useEffect(() => {
    fetchData(activeTable === "items" ? "ITEMS" : "equipment");

    const subscription = supabase
    .channel(`realtime:${activeTable}`)
    .on("postgres_changes", { event: "*", schema: "public", table: activeTable }, () =>
      fetchData(activeTable === "items" ? "ITEMS" : "equipment")
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
  }, [activeTable]);

  const logOut = async () => {
    localStorage.setItem("stat", "0"); // Set stat to 0
    router.push("/")
  };

  return (
    <div className="min-h-screen flex ">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-gray-900 text-white transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out p-5 z-50`}
      >
        <button
  onClick={() => setIsSidebarOpen(false)}
  className="absolute top-4 right-4 text-gray-300 hover:text-white bg-transparent hover:bg-red-600 transition-colors duration-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
>
  <X size={28} />
</button>

        <h2 className="text-xl font-bold mb-6 bg-clip-text drop-shadow-lg bg-gradient-to-r from-blue-500 to-purple-600 text-transparent">INVENTURI</h2>
        <ul className="space-y-4">
          <li>
          <button onClick={() => setActiveTable("equipment")} className="block w-full text-left p-2 rounded hover:bg-gray-700">
              Equipments
            </button>
          </li>
          <li>
          <button onClick={() => setActiveTable("items")} className="block w-full text-left p-2 rounded hover:bg-gray-700">
              Supplies
            </button>
          </li>
          <li>
          <button onClick={() => setActiveTable("reports")} className="block w-full text-left p-2 rounded hover:bg-gray-700">
              Reports
            </button>
          </li>
          <li>
          </li>
        </ul>
        <button
      onClick={logOut}
      className="absolute bottom-4 left-4 w-[calc(100%-2rem)] bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 transition-all flex items-center justify-center"
    >
      <X size={20} className="mr-2" /> Log Out
    </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-grow min-h-screen ">
        {/* Header */}
        <div className="flex items-center justify-between bg-black text-white p-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-white hover:text-gray-400"
          >
            <Menu size={28} />
          </button>
         
        </div>

        {/* Content Area */}
        <main className="flex-grow  p-6 flex justify-center items-center"
         style={{ backgroundImage: "url('/resources/bg.png')", backgroundSize: "cover", backgroundPosition: "center" }}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-opacity-75"></div>
            </div>
          ) : (
            <>
            {activeTable === "items" && <TBL data={itemsData} />}
            {activeTable === "equipment" && <TBL2 data={equipmentData} />}
            {activeTable === "reports" && <ReportsComponent itemsData={itemsData} equipmentData={equipmentData} />}
          </>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-gray-200 text-gray-700 text-center py-4">
          <p>Powered by Derick Ramsy</p>
        </footer>
      </div>
    </div>
  );
}
