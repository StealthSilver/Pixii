import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { AEOConfig } from "@/lib/models/aeoConfig";

export async function GET() {
  try {
    await connectDB();
    const doc = await AEOConfig.findOne({ singletonKey: "default" }).lean();
    if (!doc) {
      return NextResponse.json({ config: null });
    }
    return NextResponse.json({
      config: {
        _id: String(doc._id),
        brandName: doc.brandName ?? "",
        productName: doc.productName ?? "",
        savedQueries: doc.savedQueries ?? [],
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      },
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to load AEO config";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

type ConfigBody = {
  brandName?: string;
  productName?: string;
  savedQueries?: string[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ConfigBody;
    const brandName =
      typeof body.brandName === "string" ? body.brandName.trim() : "";
    const productName =
      typeof body.productName === "string" ? body.productName.trim() : "";
    const savedQueries = Array.isArray(body.savedQueries)
      ? body.savedQueries.map((s) => String(s).trim()).filter(Boolean)
      : undefined;

    await connectDB();

    const $set: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    if (body.brandName !== undefined) {
      $set.brandName = brandName;
    }
    if (body.productName !== undefined) {
      $set.productName = productName;
    }
    if (savedQueries !== undefined) {
      $set.savedQueries = savedQueries.slice(0, 50);
    }

    const doc = await AEOConfig.findOneAndUpdate(
      { singletonKey: "default" },
      {
        $set,
        $setOnInsert: {
          singletonKey: "default",
          createdAt: new Date(),
        },
      },
      { upsert: true, new: true },
    ).lean();

    if (!doc) {
      return NextResponse.json(
        { error: "Could not persist config" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      config: {
        _id: String(doc._id),
        brandName: doc.brandName ?? "",
        productName: doc.productName ?? "",
        savedQueries: doc.savedQueries ?? [],
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      },
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to save AEO config";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
