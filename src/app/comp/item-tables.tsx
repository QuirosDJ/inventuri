"use client";

import * as React from "react";
import { useState } from "react";
import { Plus } from "lucide-react";
import { supabase } from "@/utils/supabaseClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

export function TBL({ data }: { data: Item[] }) {
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<number[]>([]); 
  const [localData, setLocalData] = useState<Item[]>(data);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    Item_name: "",
    locker: "",
    unit: "",
    quantity: "",
   
  });
  const formatDate = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0"); // Get month (0-based index)
    const day = String(now.getDate()).padStart(2, "0"); // Get day
    const year = String(now.getFullYear()).slice(-2); // Get last 2 digits of the year
    return `${month}-${day}-${year}`;
  };

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  

  const filteredData = localData.filter((item) =>
    item.Item_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const availableItems = filteredData.filter((item) => item.quantity > 0);
  const unavailableItems = filteredData.filter((item) => item.quantity <= 0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
  
    setFormData({
      ...formData,
      [name]: name === "Item_name" || name === "unit" ? value.toUpperCase() : value, 
    });
  };
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    const itemName = formData.Item_name.trim().toLowerCase(); // Normalize name for matching
    const inputQuantity = parseInt(formData.quantity);
  
    if (!itemName || isNaN(inputQuantity) || inputQuantity <= 0) {
      alert("Please enter a valid item name and quantity.");
      return;
    }
  
    // Check if item already exists in localData
    const existingItem = localData.find(
      (item) => item.Item_name.trim().toLowerCase() === itemName
    );
  
    if (existingItem) {
      // Update quantity for existing item
      const newQuantity = existingItem.quantity + inputQuantity;
  
      const { error } = await supabase
        .from("items")
        .update({ quantity: newQuantity })
        .eq("id", existingItem.id);
  
      if (error) {
        console.error("Error updating item:", error.message);
        alert(`Error updating item: ${error.message}`);
      } else {
        setLocalData((prevData) =>
          prevData.map((item) =>
            item.id === existingItem.id ? { ...item, quantity: newQuantity } : item
          )
        );
      }
    } else {
      // Insert new item
      const newItem = {
        Item_name: formData.Item_name,
        locker: parseInt(formData.locker),
        unit: formData.unit,
        quantity: inputQuantity,
        avail: 1,
        stat: 1,
        created_at: formatDate(),
      };
  
      const { data, error } = await supabase
        .from("items")
        .insert([newItem])
        .select("*");
  
      if (error) {
        console.error("Error inserting item:", error.message);
        alert(`Error inserting item: ${error.message}`);
      } else {
        setLocalData((prevData) => [
          ...prevData,
          { ...newItem, id: data[0].id, created_at: new Date().toISOString() },
        ]);
      }
    }
  
    setIsOpen(false);
  };
  const handleCheckboxChange = (id: number) => {
    setSelectedItems((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((item) => item !== id) // Remove if already selected
        : [...prevSelected, id] // Add if not selected
    );
  };

  const handleDeleteSelected = async () => {
        if (selectedItems.length === 0) {
          alert("No items selected for deletion.");
          return;
        }
    
        const { error } = await supabase
          .from("items")
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

  const handleEdit = (id: number, field: string) => {
    setEditingId(id);
    setEditingField(field);
  };

   const handleDownload = async () => {
        setLoading(true);

        try {
            const response = await fetch("/api/supplies_reportgenerator");

            if (!response.ok) {
                throw new Error("Failed to generate document");
            }

            // ✅ Convert response to blob (binary data)
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            // ✅ Create a temporary link to trigger download
            const a = document.createElement("a");
            a.href = url;
            a.download = "item_report.docx"; // File name
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error downloading document:", error);
            alert("Failed to download document.");
        } finally {
            setLoading(false);
        }
    };

  const handleUpdate = async (id: number, field: string, value: string | number) => {
    const { error } = await supabase.from("items").update({ [field]: value }).eq("id", id);
  
    if (error) {
      console.error("Error updating item:", error.message);
    } else {
      setLocalData((prevData) =>
        prevData.map((item) =>
          item.id === id
            ? { ...item, [field]: value, quantity: field === "quantity" ? Number(value) : item.quantity }
            : item
        )
      );
    }
    setEditingId(null);
    setEditingField(null);
  };
  

  return (
    <div className="relative bg-white/75 shadow-md rounded-lg p-4 w-[95vw] h-[90vh] mx-auto overflow-x-auto ">

      <h2 className="text-lg font-bold mb-4 flex justify-between items-center"><input
        type="text"
        placeholder="Search items..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-1/10 p-2 border border-gray-300 rounded-md mb-4"
      />
      <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        onClick={handleDownload} 
        disabled={loading} >
        Download Report
      </button>
      </h2>
      <button
        onClick={handleDeleteSelected}
        className="mb-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        disabled={selectedItems.length === 0}
      >
        Delete Selected
      </button>
      <div className="flex space-x-4">
      <table className="w-1/2 border-collapse border border-gray-300 text-left">
  <thead>
    <tr className="bg-gray-200">
    <th className="border border-gray-300 p-2">SELECT</th>
      <th className="border border-gray-300 p-2">NAME</th>
      <th className="border border-gray-300 p-2">LOCKER</th>
      <th className="border border-gray-300 p-2">UNIT</th>
      <th className="border border-gray-300 p-2">QUANTITY</th>
  
      <th className="border border-gray-300 p-2">LOG</th>
      
    </tr>
  </thead>
  <tbody>
  {filteredData.length > 0 ? (
            filteredData.map((item) => (
        <tr
          key={item.id}
          className={`text-center ${item.quantity <= 0 ? 'text-red-500 bg-red-200' : ''}`}
        >
             <td className="border border-gray-300 p-2">
             <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={() => handleCheckboxChange(item.id)}
                />
          </td>

          {/* Editable Name Field */}
          <td
            className="border border-gray-300 p-2 cursor-pointer"
            onClick={() => handleEdit(item.id, 'Item_name')}
          >
            {editingId === item.id && editingField === 'Item_name' ? (
              <input
                type="text"
                defaultValue={item.Item_name}
                onBlur={(e) => handleUpdate(item.id, 'Item_name', e.target.value)}
                autoFocus
                className="w-full p-1 border rounded"
              />
            ) : (
              item.Item_name
            )}
          </td>

          {/* Editable Locker Field */}
          <td
            className="border border-gray-300 p-2 cursor-pointer"
            onClick={() => handleEdit(item.id, 'locker')}
          >
            {editingId === item.id && editingField === 'locker' ? (
              <input
                type="text"
                defaultValue={item.locker}
                onBlur={(e) => handleUpdate(item.id, 'locker', e.target.value)}
                autoFocus
                className="w-full p-1 border rounded"
              />
            ) : (
              item.locker
            )}
          </td>

          {/* Editable Unit Field */}
          <td
            className="border border-gray-300 p-2 cursor-pointer"
            onClick={() => handleEdit(item.id, 'unit')}
          >
            {editingId === item.id && editingField === 'unit' ? (
              <input
                type="text"
                defaultValue={item.unit}
                onBlur={(e) => handleUpdate(item.id, 'unit', e.target.value)}
                autoFocus
                className="w-full p-1 border rounded"
              />
            ) : (
              item.unit
            )}
          </td>

          {/* Editable Quantity Field */}
          <td
            className="border border-gray-300 p-2 cursor-pointer"
            onClick={() => handleEdit(item.id, 'quantity')}
          >
            {editingId === item.id && editingField === 'quantity' ? (
              <input
                type="number"
                defaultValue={item.quantity}
                onBlur={(e) => handleUpdate(item.id, 'quantity', e.target.value)}
                autoFocus
                className="w-full p-1 border rounded"
              />
            ) : (
              item.quantity
            )}
          </td>

          
          <td className="border border-gray-300 p-2">{item.created_at}</td>

       
        </tr>
      ))
    ) : (
      <tr>
        <td colSpan={8} className="text-center text-gray-500 p-4">
          No data available
        </td>
      </tr>
    )}
  </tbody>
</table>

<div className="w-1 bg-gray-400 mx-4"></div>
<table className="w-1/2 border-collapse border border-gray-300 text-left">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-gray-300 p-2">AVAILABLE</th>
              <th className="border border-gray-300 p-2">UNAVAILABLE</th>
            </tr>
          </thead>
          <tbody>
  {Array.from({ length: Math.max(availableItems.length, unavailableItems.length) }).map((_, index) => (
    <tr key={index} className=" border border-gray-600">
      <td className="border border-gray-300 p-2">
      {availableItems[index] ? `${index + 1}. ${availableItems[index].Item_name}` : ""}
      </td>
      <td className="border border-gray-300 p-2 text-red-500 bg-red-200">
      {unavailableItems[index] ? `${index + 1}. ${unavailableItems[index].Item_name}` : ""}
      </td>
    </tr> 
  ))}
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
            {Object.keys(formData).map((key) => (
              <input
                key={key}
                type={key === "Item_name" || key === "unit" ? "text" : "number"}
                name={key}
                placeholder={key.replace("_", " ").toUpperCase()}
                className="w-full p-2 border rounded-md"
                value={formData[key as keyof typeof formData]}
                onChange={handleInputChange}
                required
              />
            ))}
            <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-all duration-300">
              Add Item
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
