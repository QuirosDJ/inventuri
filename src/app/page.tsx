"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createContext, useContext, useState,useEffect } from "react";
import { useRouter } from "next/navigation"; 
import { supabase } from "@/utils/supabaseClient";



const StatContext = createContext<{ stat: number; setStat: (value: number) => void } | null>(null);

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
  const [stat, setStat] = useState(0);
  const router = useRouter(); 

  useEffect(() => {
    
    const storedStat = localStorage.getItem("stat");
    if (storedStat === "1") {
      router.push("/main"); 
    }
  }, []);

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

    // Fetch user data where username matches input
    const { data: userData, error } = await supabase
      .from("ACCOUNTS")
      .select("USERNAME, PASS") // Select only necessary fields
      .eq("USERNAME", data.username)
      .single(); // Expect only one result

    if (error || !userData) {
      setErrorMessage("Invalid username or password.");
      setLoading(false);
      return;
    }

    // Check if password matches (WARNING: Plain-text passwords should NOT be used in production)
    if (userData.PASS !== data.password) {
      setErrorMessage("Invalid username or password.");
      setLoading(false);
      return;
    }


    console.log("Login successful:", userData);
    setStat(1); 
    localStorage.setItem("stat", "1")
    setLoading(false);
    router.push("/main"); // Redirect to main page
  };

  return (
    <StatContext.Provider value={{ stat, setStat }}>
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
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

        {/* Additional Links */}
        <p className="text-gray-600 text-center mt-4">
          Don't have an account? <a href="#" className="text-blue-600">Sign up</a>
        </p>
      </div>
    </div>
    </StatContext.Provider>
  );
}

export const useStat = () => {
  const context = useContext(StatContext);
  if (!context) {
    throw new Error("useStat must be used within a StatContext.Provider");
  }
  return context;
};