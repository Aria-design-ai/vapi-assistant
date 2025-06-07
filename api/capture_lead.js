import { Resend } from "resend";
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY);

const departmentEmails = {
  car_sales: "aryansamnani09@gmail.com",
  car_service: "aryansamnani9@gmail.com",
  bike_sales: "amirsamnani13@gmail.com",
  bike_service: "amirsamnani84@gmail.com",
};

const captureLeadSchema = z.object({
  Name: z.string().min(1, "Name is required"),
  Phone: z.string().min(1, "Phone is required"),
  Message: z.string().min(1, "Message is required"),
  Department: z.enum(["car_sales", "car_service", "bike_sales", "bike_service"]),
  vehicle_info: z.string().optional(),
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    console.log("✅ Full req.body:", JSON.stringify(body, null, 2));

    const toolCall = body.toolCalls?.[0];
    console.log("🔧 toolCalls[0]:", JSON.stringify(toolCall, null, 2));

    const rawArgs = toolCall?.function?.arguments;
    console.log("📦 Raw arguments:", rawArgs);

    if (!rawArgs) {
      return res.status(400).json({ error: "Missing function.arguments" });
    }

    let args;
    try {
      args = typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs;
      console.log("✅ Parsed arguments:", args);
    } catch (e) {
      console.error("❌ Failed to parse arguments:", e.message);
      return res.status(400).json({ error: "Invalid JSON in arguments" });
    }

    const parsed = captureLeadSchema.safeParse(args);
    if (!parsed.success) {
      console.error("❌ Zod validation error:", parsed.error.format());
      return res.status(400).json({ error: "Invalid tool arguments", details: parsed.error.format() });
    }

    console.log("✅ Zod validation successful");

    const { Name, Phone, Message, Department, vehicle_info = "Not provided" } = parsed.data;
    const toEmail = departmentEmails[Department];

    const emailSubject = `New ${Department.replace("_", " ").toUpperCase()} Lead`;
    const emailBody = `
      <p><strong>Name:</strong> ${Name}</p>
      <p><strong>Phone:</strong> ${Phone}</p>
      <p><strong>Message:</strong> ${Message}</p>
      <p><strong>Vehicle Info:</strong> ${vehicle_info}</p>
      <p><strong>Department:</strong> ${Department}</p>
    `;

    const { data, error } = await resend.emails.send({
      from: "Aria <aria@unidubstudios.com>",
      to: [toEmail],
      subject: emailSubject,
      html: emailBody,
    });

    if (error) {
      console.error("❌ Resend email error:", error);
      return res.status(500).json({ error: "Failed to send email" });
    }

    console.log("✅ Email sent. ID:", data.id);
    return res.status(200).json({ success: true, emailId: data.id });

  } catch (err) {
    console.error("💥 Unexpected error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
