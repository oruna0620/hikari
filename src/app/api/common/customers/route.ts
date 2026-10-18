import { NextResponse } from "next/server";
import { getCustomers } from "@/lib/di/container";
import { AppError } from "@/lib/errors/app-error";

export async function GET() {
  try {
    const customers = await getCustomers.execute();
    return NextResponse.json(customers);
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
