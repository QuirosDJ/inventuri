"use client";

import * as React from "react";
import { useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Equipment = {
  id: number;
  equipment_name: string;
  Department: string;
  serial_num: string;
  count: number;
  status: string;
};

export function TBL2({ data }: { data: Equipment[] }) {
  const [selectedItems, setSelectedItems] = useState<number[]>([]); 
  const [selectedStatus, setSelectedStatus] = useState("All"); // Status filter
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [localData, setLocalData] = useState<Equipment[]>(data);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
   const [formData, setFormData] = useState({
      equipment_name: "",
      Department: "",
      serial_num: "",
      count: "",
      status: "",
     
    });
     const [searchQuery, setSearchQuery] = useState("");
     const statuses = ["All", "Good", "Need Repair", "Need Maintenance"];
     const departments = ["All", ...new Set(data.map((item) => item.Department))];

     const handleCheckboxChange = (id: number) => {
      setSelectedItems((prevSelected) =>
        prevSelected.includes(id)
          ? prevSelected.filter((item) => item !== id) // Remove if already selected
          : [...prevSelected, id] // Add if not selected
      );
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    const filteredData = localData.filter(
      (item) =>
        item.equipment_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (selectedDepartment === "All" || item.Department === selectedDepartment) &&
    (selectedStatus === "All" || item.status === selectedStatus)
    );

    const handleDeleteSelected = async () => {
      if (selectedItems.length === 0) {
        alert("No items selected for deletion.");
        return;
      }
  
      const { error } = await supabase
        .from("equipment")
        .delete()
        .in("id", selectedItems);
  
      if (error) {
        console.error("Error deleting items:", error.message);
        alert(`Error deleting items: ${error.message}`);
      } else {
        // Remove deleted items from local state
        setLocalData((prevData) =>
          prevData.filter((item) => !selectedItems.includes(item.id))
        );
        setSelectedItems([]); // Clear selection
      }
    };
    

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
    
      const eqName = formData.equipment_name.trim().toLowerCase(); // Normalize name for matching
      const inputCount = parseInt(formData.count);
    
      if (!eqName || isNaN(inputCount) || inputCount <= 0) {
        alert("Please enter a valid item name and quantity.");
        return;
      }
    
      // Check if item with the same name and serial number already exists in localData
      const existingItem = localData.find(
        (item) =>
          item.equipment_name.trim().toLowerCase() === eqName &&
          item.serial_num.trim().toLowerCase() === formData.serial_num.trim().toLowerCase()
      );
    
      if (existingItem) {
        // Update quantity for existing item
        const newCount = existingItem.count + inputCount;
    
        const { error } = await supabase
          .from("equipment")
          .update({ count: newCount })
          .eq("id", existingItem.id);
    
        if (error) {
          console.error("Error updating item:", error.message);
          alert(`Error updating item: ${error.message}`);
        } else {
          setLocalData((prevData) =>
            prevData.map((item) =>
              item.id === existingItem.id ? { ...item, count: newCount } : item
            )
          );
        }
      } else {
        // Insert new item since either the name is new or serial number is different
        const newItem = {
          equipment_name: formData.equipment_name,
          Department: formData.Department,
          serial_num: formData.serial_num,
          count: inputCount,
          status: formData.status,
        };
    
        const { data, error } = await supabase.from("equipment").insert([newItem]).select("*");
    
        if (error) {
          console.error("Error inserting item:", error.message);
          alert(`Error inserting item: ${error.message}`);
        } else {
          setLocalData((prevData) => [
            ...prevData,
            { ...newItem, id: data[0].id },
          ]);
        }
      }
    
      setIsOpen(false);
    };
    

  const handleEdit = (id: number, field: string) => {
    setEditingId(id);
    setEditingField(field);
  };

  const handleUpdate = async (id: number, field: string, value: string | number) => {
    const { error } = await supabase.from("equipment").update({ [field]: value }).eq("id", id);

    if (error) {
      console.error("Error updating item:", error.message);
    } else {
      setLocalData((prevData) =>
        prevData.map((item) =>
          item.id === id ? { ...item, [field]: value, count: field === "count" ? Number(value) : item.count } : item
        )
      );
    }
    setEditingId(null);
    setEditingField(null);
  };

  

  return (
    <div className="relative bg-white shadow-md rounded-lg p-4 w-[95vw] h-[90vh] mx-auto overflow-x-auto">
      <h2 className="text-lg font-bold mb-4">
      <input
        type="text"
        placeholder="Search equipment..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-1/10 p-2 border border-gray-300 rounded-md mb-4"
      /><select
      value={selectedDepartment}
      onChange={(e) => setSelectedDepartment(e.target.value)}
      className="w-1/3 p-2 border border-gray-300 rounded-md bg-white"
    >
      {departments.map((dept) => (
        <option key={dept} value={dept}>
          {dept}
        </option>
      ))}
    </select>
    <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="w-1/3 p-2 border border-gray-300 rounded-md bg-white ml-2"
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <button
        onClick={handleDeleteSelected}
        className="mb-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        disabled={selectedItems.length === 0}
      >
        Delete Selected
      </button>
      </h2>
      <div className="flex space-x-4">
        <table className="w-full border-collapse border border-gray-300 text-left">
          <thead>
            <tr className="bg-gray-200">
            <th className="border border-gray-300 p-2">Select</th>
              <th className="border border-gray-300 p-2">No.</th>
              <th className="border border-gray-300 p-2">Equipment</th>
              <th className="border border-gray-300 p-2">Office/Department</th>
              <th className="border border-gray-300 p-2">Serial Number</th>
              <th className="border border-gray-300 p-2">Count</th>
              <th className="border border-gray-300 p-2">Status</th>
            </tr>
          </thead>
          <tbody>
          {filteredData.length > 0 ? (
                  filteredData.map((item, index) => (
                <tr
                  key={item.id}
                  className={`${
                    item.status.toLowerCase() === "need repair"
                      ? "text-red-500 bg-red-200"
                      : item.status.toLowerCase() === "need maintenance"
                      ? "text-yellow-600 bg-yellow-200"
                      : ""
                  }`}
                >
              <td className="border border-gray-300 p-2 text-center">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={() => handleCheckboxChange(item.id)}
                />
              </td>
                  <td className="border border-gray-300 p-2"> {index + 1}. </td>
                  <td className="border border-gray-300 p-2" onClick={() => handleEdit(item.id, "equipment_name")}>
                    {editingId === item.id && editingField === "equipment_name" ? (
                      <input
                        type="text"
                        defaultValue={item.equipment_name}
                        onBlur={(e) => handleUpdate(item.id, "equipment_name", e.target.value)}
                        autoFocus
                        className="w-full p-1 border rounded"
                      />
                    ) : (
                      item.equipment_name
                    )}
                  </td>
                  <td className="border border-gray-300 p-2" onClick={() => handleEdit(item.id, "Department")}>
                    {editingId === item.id && editingField === "Department" ? (
                      <input
                        type="text"
                        defaultValue={item.Department}
                        onBlur={(e) => handleUpdate(item.id, "Department", e.target.value)}
                        autoFocus
                        className="w-full p-1 border rounded"
                      />
                    ) : (
                      item.Department
                    )}
                  </td>
                  <td className="border border-gray-300 p-2" onClick={() => handleEdit(item.id, "serial_num")}>
                    {editingId === item.id && editingField === "serial_num" ? (
                      <input
                        type="text"
                        defaultValue={item.serial_num}
                        onBlur={(e) => handleUpdate(item.id, "serial_num", e.target.value)}
                        autoFocus
                        className="w-full p-1 border rounded"
                      />
                    ) : (
                      item.serial_num
                    )}
                  </td>
                  <td className="border border-gray-300 p-2" onClick={() => handleEdit(item.id, "count")}>
                    {editingId === item.id && editingField === "count" ? (
                      <input
                        type="number"
                        defaultValue={item.count}
                        onBlur={(e) => handleUpdate(item.id, "count", e.target.value)}
                        autoFocus
                        className="w-full p-1 border rounded"
                      />
                    ) : (
                      item.count
                    )}
                  </td>
                  <td className="border border-gray-300 p-2" onClick={() => handleEdit(item.id, "status")}>
                    {editingId === item.id && editingField === "status" ? (
                      <select
                        defaultValue={item.status}
                        onChange={(e) => handleUpdate(item.id, "status", e.target.value)}
                        autoFocus
                        className="w-full p-1 border rounded bg-white"
                      >
                        <option value="Good">Good</option>
                        <option value="Need Repair">Need Repair</option>
                        <option value="Need Maintenance">Need Maintenance</option>
                      </select>
                    ) : (
                      item.status
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center text-gray-500 p-4">
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <button className="fixed bottom-10 right-10 bg-blue-500 text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform">
            <Plus size={24} />
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {Object.keys(formData).map((key) =>
              key !== "status" ? (
                <input
                  key={key}
                  type={key === "count" ? "number" : "text"}
                  name={key}
                  placeholder={key.replace("_", " ").toUpperCase()}
                  className="w-full p-2 border rounded-md"
                  value={formData[key as keyof typeof formData]}
                  onChange={handleInputChange}
                  required
                />
              ) : (
                <select
                  key={key}
                  name={key}
                  className="w-full p-2 border rounded-md bg-white"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                >
                  
                  <option value="" disabled>Select Status</option> {/* Placeholder option */}
                  <option value="Good">Good</option>
                  <option value="Need Repair">Need Repair</option>
                  <option value="Need Maintenance">Need Maintenance</option>
                </select>
              )
            )}
            <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600">
              Add Item
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
