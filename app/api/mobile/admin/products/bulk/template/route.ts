import { NextRequest } from "next/server";
import { getAuthenticatedAdmin, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";

const CATEGORY_TEMPLATES: Record<string, { filename: string; name: string; csvContent: string }> = {
  all: {
    name: "Master All-in-One Template",
    filename: "intrihub_all_categories_master_template.csv",
    csvContent: `Category,Product_Name,Brand_Name,Caption_Tagline,MRP_Price,Selling_Price,Stock_Qty,Unit,Material,Dimensions_H_W_D,Thickness_mm,Volume_Litres,Wire_Gauge_sqmm,Grade,Finish,Specifications,Images,Description
tiles-granite,"Kajaria Statuario Grand Gloss Vitrified Tile",Kajaria,"Italian White Marble Look High-Gloss Tile",3400,2650,200,Box,Vitrified Ceramic,800x800mm,9.5 mm,,,High Gloss,"Anti-Skid: Medium; Water Absorption: <0.05%",https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800,"Premium high-gloss mirror finish vitrified tiles for luxury living rooms and showrooms."
electrical,"Roma Classic 6 Module Modular Plate",Anchor Panasonic,"Sleek Polycarbonate Modular Grid Plate",320,240,150,Piece,Polycarbonate,200x85x15 mm,,,,Gloss,"Type: Modular Switch Plate; Warranty: 5 Years",https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800,"Premium flame retardant polycarbonate modular switch plate with sleek gloss finish."
electrical-wires,"Havells LifeLine Plus 1.5 sq mm Wire",Havells,"100% Electrolytic Copper High Safety House Wire",2850,2250,80,Coil,Pure Copper,90m Coil,,1.5 sq mm,,FR PVC,"Conductor: Pure Copper; Voltage: 1100V",https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=800,"High safety 90-meter house wiring copper cable engineered with oxygen-free copper."
paints,"Asian Paints Royale Luxury Interior Matt",Asian Paints,"Ultra-sheen Teflon Anti-fungal Wall Paint",4800,3950,60,Bucket,Emulsion Paint,4 Litres,,4 Litres,,Matt,"Dry Time: 30 Mins; Coats Required: 2",https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800,"Luxury interior emulsion paint with Teflon surface protector for high washability."
plywood,"CenturyPly Club Prime BWP Marine Plywood",CenturyPly,"Boiling Water Proof Marine Grade Plywood",4200,3450,100,Sheet,Gurjan Hardwood,8x4 ft,19 mm,,BWP Marine Grade (IS 710),Smooth,"Warranty: 25 Years; Termite Proof: Yes",https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800,"Heavy-duty boiling water proof plywood sheet with high density Gurjan hardwood core."`,
  },
  "tiles-granite": {
    name: "Tiles & Granite",
    filename: "intrihub_tiles_and_granite_template.csv",
    csvContent: `Category,Product_Name,Brand_Name,Caption_Tagline,MRP_Price,Selling_Price,Stock_Qty,Unit,Size,Thickness_mm,Finish,Material,Look,Sqft_Per_Box,Pieces_Per_Box,Specifications,Images,Description
tiles-granite,"Kajaria Statuario Grand Gloss Vitrified Tile",Kajaria,"Italian White Marble Look High-Gloss Vitrified Tile",3400,2650,200,Box,800x800mm,9.5 mm,High Gloss,Vitrified Ceramic,Italian Marble,15.5,3,"Water Absorption: <0.05%; Anti-Skid: Medium",https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800,"Premium high-gloss mirror finish vitrified tiles for luxury living rooms and showrooms."
tiles-granite,"Black Galaxy Premium Polished Granite Slab",South Granites,"Mirror Finish Golden Flakes Natural Granite",180,145,500,Sqft,10x4 ft Slab,18 mm,Polished Mirror,Natural Granite,Granite Galaxy,1,1,"Density: High; Application: Kitchen Countertops",https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800,"Durable mirror polished black granite with sparkling golden mica flakes for countertops."`,
  },
  electrical: {
    name: "Electrical (Switchboards & Panels)",
    filename: "intrihub_electrical_switchboards_template.csv",
    csvContent: `Category,Product_Name,Brand_Name,Caption_Tagline,MRP_Price,Selling_Price,Stock_Qty,Unit,Material,Dimensions_H_W_D,Specifications,Images,Description
electrical,"Roma Classic 6 Module Modular Grid Plate",Anchor Panasonic,"Sleek Polycarbonate Modular Grid Plate",320,240,150,Piece,Polycarbonate,200x85x15 mm,"Type: Modular Switch Plate; Warranty: 5 Years",https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800,"Premium flame retardant polycarbonate modular switch plate with sleek gloss finish."
electrical,"Schneider Electric 16A 1-Way Power Switch",Schneider Electric,"Heavy Duty 16A Modular Power Switch with Indicator",190,145,300,Piece,Polycarbonate & Brass,45x45x40 mm,"Current Rating: 16A; Voltage: 240V; Warranty: 10 Years",https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800,"Heavy load 16A modular switch suitable for ACs, Geysers, and heavy appliances."`,
  },
  "electrical-wires": {
    name: "Electrical (Wires & Cables)",
    filename: "intrihub_electrical_wires_cables_template.csv",
    csvContent: `Category,Product_Name,Brand_Name,Caption_Tagline,MRP_Price,Selling_Price,Stock_Qty,Unit,Wire_Gauge_sqmm,Coil_Length_m,Voltage_Rating,Flame_Retardant,Specifications,Images,Description
electrical-wires,"Havells LifeLine Plus 1.5 sq mm House Wire",Havells,"100% Electrolytic Copper High Safety House Wire",2850,2250,80,Coil,1.5 sq mm,90 m,1100V,Yes - Grade FR-LSH,"Conductor: Pure Copper; Insulation: Flame Retardant PVC",https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=800,"High safety 90-meter house wiring copper cable engineered with oxygen-free copper."`,
  },
  paints: {
    name: "Paints & Emulsions",
    filename: "intrihub_paints_emulsions_template.csv",
    csvContent: `Category,Product_Name,Brand_Name,Caption_Tagline,MRP_Price,Selling_Price,Stock_Qty,Volume_Litres,Sheen_Finish,Usage_Area,Coverage_Sqft,Specifications,Images,Description
paints,"Asian Paints Royale Luxury Interior Matt Emulsion",Asian Paints,"Ultra-sheen Teflon Anti-fungal Washable Wall Paint",4800,3950,60,4 Litres,Soft Sheen Matt,Interior Walls,280 sq.ft,"Dry Time: 30 Mins; Coats Required: 2",https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800,"Luxury interior emulsion paint with Teflon surface protector for high washability."`,
  },
  plywood: {
    name: "Plywood & Laminates",
    filename: "intrihub_plywood_laminates_template.csv",
    csvContent: `Category,Product_Name,Brand_Name,Caption_Tagline,MRP_Price,Selling_Price,Stock_Qty,Dimensions_L_W,Thickness_mm,Grade,Wood_Core,Specifications,Images,Description
plywood,"CenturyPly Club Prime BWP Marine Grade Plywood",CenturyPly,"Boiling Water Proof Marine Grade Plywood Sheet",4200,3450,100,8x4 ft,19 mm,BWP Marine Grade (IS 710),Gurjan Core Hardwood,"Warranty: 25 Years; Borer & Termite Proof: Yes",https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800,"Heavy-duty boiling water proof plywood sheet with high density Gurjan hardwood core."`,
  },
};

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || "all";
    const selectedTemplate = CATEGORY_TEMPLATES[category] || CATEGORY_TEMPLATES["all"];

    return mobileApiResponse({
      success: true,
      category,
      template: selectedTemplate,
      availableCategories: Object.keys(CATEGORY_TEMPLATES).map((k) => ({
        key: k,
        name: CATEGORY_TEMPLATES[k].name,
        filename: CATEGORY_TEMPLATES[k].filename,
      })),
    });
  } catch (error: any) {
    console.error("[Mobile Admin Bulk Template Error]", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to fetch template" },
      500
    );
  }
}
