import { NextRequest, NextResponse } from "next/server";
import { searchProducts } from "@/lib/di/container";
import { AppError } from "@/lib/errors/app-error";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") ?? undefined;
    const products = await searchProducts.execute(query);
    return NextResponse.json(products);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
