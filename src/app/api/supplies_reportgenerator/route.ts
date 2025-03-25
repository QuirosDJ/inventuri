import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { supabase } from "@/utils/supabaseClient";

export async function GET() {
    try {
        // ✅ Fetch items data
        const { data: items, error: itemsError } = await supabase
            .from("items")
            .select("id, Item_name, unit, quantity, locker");

        if (itemsError) {
            return NextResponse.json({ success: false, error: itemsError.message }, { status: 500 });
        }

        if (!items.length) {
            return NextResponse.json({ success: false, error: "No items found" }, { status: 404 });
        }

        // ✅ Fetch historical data sorted by timestamp
        const itemIds = items.map(item => item.id);
        const { data: history, error: historyError } = await supabase
            .from("h_table")
            .select("item_id, quantity, created")
            .in("item_id", itemIds)
            .order("created", { ascending: true });

        if (historyError) {
            return NextResponse.json({ success: false, error: historyError.message }, { status: 500 });
        }

        // ✅ Compute trends
        const trends: Record<string, string> = {};

        // Group historical data by item_id
        const groupedHistory = history?.reduce<Record<string, { quantity: number, created: string }[]>>((acc, record) => {
            if (!acc[record.item_id]) acc[record.item_id] = [];
            acc[record.item_id].push({ quantity: record.quantity, created: record.created });
            return acc;
        }, {});

        for (const itemId in groupedHistory) {
            const records = groupedHistory[itemId];

            if (records.length < 2) {
                trends[itemId] = "Stable"; // Not enough data to detect trend
                continue;
            }

            // ✅ Consider only the last 3 data points for recent trend analysis
            const recentRecords = records.slice(-3);
            
            // ✅ Compute trend based on time intervals
            let increasingCount = 0;
            let decreasingCount = 0;

            for (let i = 1; i < recentRecords.length; i++) {
                const prev = recentRecords[i - 1];
                const current = recentRecords[i];

                if (current.quantity > prev.quantity) {
                    increasingCount++;
                } else if (current.quantity < prev.quantity) {
                    decreasingCount++;
                }
            }

            // ✅ Determine trend
            if (increasingCount > decreasingCount) {
                trends[itemId] = "Spiking";
            } else if (decreasingCount > increasingCount) {
                trends[itemId] = "Decreasing";
            } else {
                trends[itemId] = "Stable";
            }
        }

        // ✅ Merge trends with items
        const enrichedItems = items.map(item => ({
            ...item,
            trend: trends[item.id] || "Stable"
        }));

        // ✅ Load the Word Template
        const templatePath = path.join(process.cwd(), "public", "item_template.docx");
        const templateContent = fs.readFileSync(templatePath, "binary");
        const zip = new PizZip(templateContent);
        const doc = new Docxtemplater(zip);

        doc.render({ items: enrichedItems });

        // ✅ Generate the Final Document
        const buffer = doc.getZip().generate({ type: "nodebuffer" });

        // ✅ Return the Document as a Downloadable Response
        return new Response(buffer, {
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "Content-Disposition": "attachment; filename=items_report.docx",
            },
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}
