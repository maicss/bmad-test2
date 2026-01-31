import { NextRequest } from "next/server";
import { ErrorCodes, createErrorResponse } from "@/lib/constant";

export async function GET(request: NextRequest) {
  return Response.json(
    createErrorResponse(ErrorCodes.NOT_FOUND, `API endpoint not found: ${request.url}`),
    { status: 404 }
  );
}

export async function POST(request: NextRequest) {
  return Response.json(
    createErrorResponse(ErrorCodes.NOT_FOUND, `API endpoint not found: ${request.url}`),
    { status: 404 }
  );
}

export async function PUT(request: NextRequest) {
  return Response.json(
    createErrorResponse(ErrorCodes.NOT_FOUND, `API endpoint not found: ${request.url}`),
    { status: 404 }
  );
}

export async function DELETE(request: NextRequest) {
  return Response.json(
    createErrorResponse(ErrorCodes.NOT_FOUND, `API endpoint not found: ${request.url}`),
    { status: 404 }
  );
}

export async function PATCH(request: NextRequest) {
  return Response.json(
    createErrorResponse(ErrorCodes.NOT_FOUND, `API endpoint not found: ${request.url}`),
    { status: 404 }
  );
}

export async function HEAD(request: NextRequest) {
  return Response.json(
    createErrorResponse(ErrorCodes.NOT_FOUND, `API endpoint not found: ${request.url}`),
    { status: 404 }
  );
}

export async function OPTIONS(request: NextRequest) {
  return Response.json(
    createErrorResponse(ErrorCodes.NOT_FOUND, `API endpoint not found: ${request.url}`),
    { status: 404 }
  );
}
