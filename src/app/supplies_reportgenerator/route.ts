import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { supabase } from "@/utils/supabaseClient";





export async function GET() {

    try {
        // ✅ Fetch data from Supabase
        const { data, error } = await supabase
            .from("items")
            .select("Item_name, locker, unit, quantity");

            if (error) {
                console.error("Supabase Error:", error);
                return NextResponse.json({ error: error.message || "Unknown Supabase error" }, { status: 500 });
            }
            

        if (!data || data.length === 0) {
            return NextResponse.json({ error: "No data found" }, { status: 404 });
        }

        // ✅ Remove rows with completely null or empty values
        const cleanedData = data
            .map(item => ({
                item_name: item.Item_name?.trim() || "", 
                locker: item.locker?.trim() || "",
                unit: item.unit?.trim() || "",
                quantity: item.quantity !== null && item.quantity !== undefined ? item.quantity : ""
            }))
            .filter(item => Object.values(item).some(value => value !== "")); // Remove fully empty rows

        if (cleanedData.length === 0) {
            return NextResponse.json({ error: "No valid data after cleanup" }, { status: 404 });
        }

        // ✅ Load the Word template
        const templatePath = path.join(process.cwd(), "public", "item_template.docx");
        if (!fs.existsSync(templatePath)) {
            return NextResponse.json({ error: "Template file not found" }, { status: 500 });
        }

        const content = fs.readFileSync(templatePath, "binary");
        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip);

        // ✅ Render data into the template
        doc.render({ items: cleanedData });

        // ✅ Generate the document
        const buffer = doc.getZip().generate({ type: "nodebuffer" });

        // ✅ Return as downloadable file
        return new NextResponse(buffer, {
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "Content-Disposition": 'attachment; filename="item_report.docx"',
            },
        });
    } catch (error) {
        console.error("Error generating document:", error);

        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";

        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
