"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {  useState,useEffect } from "react";
import { useRouter } from "next/navigation"; 
import { supabase } from "@/utils/supabaseClient";







// Define the schema for validation
const schema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// TypeScript type derived from the schema
type FormData = z.infer<typeof schema>;

export default function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
 
  const router = useRouter(); 

  useEffect(() => {
    
    const storedStat = localStorage.getItem("stat");
    if (storedStat === "1") {
      router.push("/main"); 
    }
  }, [router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setErrorMessage(""); // Clear previous errors

    
    const { data: userData, error } = await supabase
      .from("ACCOUNTS")
      .select("USERNAME, PASS") 
      .eq("USERNAME", data.username)
      .single();

    if (error || !userData) {
      setErrorMessage("Invalid username or password.");
      setLoading(false);
      return;
    }

   
    if (userData.PASS !== data.password) {
      setErrorMessage("Invalid username or password.");
      setLoading(false);
      return;
    }


    console.log("Login successful:", userData);
   
    localStorage.setItem("stat", "1")
    setLoading(false);
    router.push("/main"); 
  };

  return (
    
    <div className="flex min-h-screen items-center justify-center bg-gray-100"
    style={{ backgroundImage: "url('/resources/bg.png')", backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <div className="w-full max-w-md p-6 bg-white shadow-lg rounded-2xl">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Login</h2>
        {errorMessage && (
          <p className="text-red-500 text-center mb-4">{errorMessage}</p>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Username Field */}
          <div>
            <label className="block text-gray-700">Username</label>
            <input
              type="text"
              {...register("username")}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your username"
            />
            {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-gray-700">Password</label>
            <input
              type="password"
              {...register("password")}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={`w-full p-3 rounded-lg text-white ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 transition"
            }`}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
   
  );
}

