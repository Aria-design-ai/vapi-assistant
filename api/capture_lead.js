import { Resend } from "resend";
import { z } from "zod";

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Department email mapping
const departmentEmails = {
  car_sales: "aryansamnani09@gmail.com",
  car_service: "aryansamnani9@gmail.com",
  bike_sales: "amirsamnani13@gmail.com",
  bike_service: "amirsamnani84@gmail.com",
};

// Zod schema
const captureLeadSchema = z.object({
  Name: z.string().min(1),
  Phone: z.string().min(1),
  Message: z.string().min(1),
  Department: z.enum(["car_sales", "car_service", "bike_sales", "bike_service"]),
  vehicle_info: z.string().optional(),
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("➡️ Incoming body:", req.body);

    const toolCall = req.body?.toolCalls?.[0];
    let rawArgs = toolCall?.function?.arguments;

    console.log("🧩 Raw arguments:", rawArgs);

    // Attempt to parse stringified arguments if needed
    let args;
    try {
      args = typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs;
    } catch (e) {
      console.error("❌ Failed to parse arguments:", e);
      return res.status(400).json({ error: "Invalid JSON in arguments" });
    }

    // Validate using Zod
    const parsed = captureLeadSchema.safeParse(args);

    if (!parsed.success) {
      console.error("❌ Zod validation error:", parsed.error.format());
      return res.status(400).json({ error: "Invalid tool arguments", details: parsed.error.format() });
    }

    const { Name, Phone, Message, Department, vehicle_info = "Not provided" } = parsed.data;

    const toEmail = departmentEmails[Department];
    const subject = `New ${Department.replace("_", " ").toUpperCase()} Lead`;
    const html = `
      <p><strong>Name:</strong> ${Name}</p>
      <p><strong>Phone:</strong> ${Phone}</p>
      <p><strong>Message:</strong> ${Message}</p>
      <p><strong>Vehicle Info:</strong> ${vehicle_info}</p>
      <p><strong>Department:</strong> ${Department}</p>
    `;

    const { data, error } = await resend.emails.send({
      from: "Aria <aria@unidubstudios.com>",
      to: [toEmail],
      subject,
      html,
    });

    if (error) {
      console.error("❌ Resend email error:", error);
      return res.status(500).json({ error: "Failed to send email" });
    }

    return res.status(200).json({ success: true, emailId: data.id });
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
