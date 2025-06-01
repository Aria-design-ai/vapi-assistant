import { NextResponse } from "next/server";
import { Resend } from "resend";

// Initialize Resend with your API key (store this securely)
const resend = new Resend(process.env.RESEND_API_KEY);

const departmentEmails = {
  car_sales: "aryansamnani09@gmail.com",
  car_service: "aryansamnani9@gmail.com",
  bike_sales: "amirsamnani13@gmail.com",
  bike_service: "amirsamnani84@gmail.com",
};

export async function POST(req) {
  try {
    const body = await req.json();

    const toolCall = body.toolCalls?.[0];
    const name = toolCall?.args?.name;
    const phone = toolCall?.args?.phone;
    const message = toolCall?.args?.message;
    const department = toolCall?.args?.department;
    const vehicle_info = toolCall?.args?.vehicle_info || "Not provided";

    if (!name || !phone || !message || !department) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const toEmail = departmentEmails[department];

    if (!toEmail) {
      return NextResponse.json({ error: "Invalid department" }, { status: 400 });
    }

    const emailSubject = `New ${department.replace("_", " ").toUpperCase()} Lead`;
    const emailBody = `
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Message:</strong> ${message}</p>
      <p><strong>Vehicle Info:</strong> ${vehicle_info}</p>
      <p><strong>Department:</strong> ${department}</p>
    `;

    const { data, error } = await resend.emails.send({
      from: "Aria <aria@unidubstudios.com>",
      to: [toEmail],
      subject: emailSubject,
      html: emailBody,
    });

    if (error) {
      console.error("Resend email error:", error);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true, emailId: data.id });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
