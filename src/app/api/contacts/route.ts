import { NextResponse } from "next/server";
import {
  getContactsForOrganization,
  saveContactsForOrganization,
  type ContactDefinition,
} from "@/lib/stores/contact-store";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing authorization" }, { status: 401 });
    }

    const contacts = await getContactsForOrganization("demo");
    return NextResponse.json(contacts);
  } catch (error) {
    console.error("GET Contacts Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing authorization" }, { status: 401 });
    }

    const payload = await request.json();
    if (!Array.isArray(payload)) {
      return NextResponse.json(
        { error: "Invalid payload format. Expected an array of contacts." },
        { status: 400 },
      );
    }

    const validated: Omit<ContactDefinition, "id">[] = payload;
    for (const item of validated) {
      if (!item.name || typeof item.name !== "string") {
        return NextResponse.json(
          { error: "Contact name is required and must be a string." },
          { status: 400 },
        );
      }
    }

    const updated = await saveContactsForOrganization("demo", payload as ContactDefinition[]);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT Contacts Error:", error);
    return NextResponse.json(
      { error: "Failed to save contacts" },
      { status: 500 },
    );
  }
}
