import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { supabase } from "@/utils/supabaseClient";

export async function GET() {
    try {
        const { data, error } = await supabase
            .from("equipment")
            .select("equipment_name, count, status, Department");

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        // ✅ Load the Word Template
        const templatePath = path.join(process.cwd(), "public", "eq_template.docx");
        const templateContent = fs.readFileSync(templatePath, "binary");

        // ✅ Load the Template into PizZip
        const zip = new PizZip(templateContent);
        const doc = new Docxtemplater(zip);

        doc.render({ items: data });

        // ✅ Generate the Final Document
        const buffer = doc.getZip().generate({ type: "nodebuffer" });

        // ✅ Return the Document as a Downloadable Response
        return new Response(buffer, {
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "Content-Disposition": "attachment; filename=equipment_report.docx",
            },
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}
