import { Resend } from "resend";
import { z } from "zod";

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Define department to email mapping
const departmentEmails = {
  car_sales: "aryansamnani09@gmail.com",
  car_service: "aryansamnani9@gmail.com",
  bike_sales: "amirsamnani13@gmail.com",
  bike_service: "amirsamnani84@gmail.com",
};

// Zod schema for validation
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
    const body = req.body;
    console.log("Incoming body:", JSON.stringify(body, null, 2));

    const toolCall = body.toolCalls?.[0];
    if (!toolCall) {
      return res.status(400).json({ error: "Missing toolCalls[0]" });
    }

    const rawArgs = toolCall.function?.arguments;
    if (!rawArgs) {
      return res.status(400).json({ error: "Missing function.arguments" });
    }

    // Handle both object and stringified object
    let args;
    try {
      args = typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs;
    } catch (e) {
      return res.status(400).json({ error: "Invalid JSON in arguments" });
    }

    const parsed = captureLeadSchema.safeParse(args);
    if (!parsed.success) {
      console.error("Zod validation failed:", parsed.error.format());
      return res.status(400).json({ error: "Invalid tool arguments", details: parsed.error.format() });
    }

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
      console.error("Resend error:", error);
      return res.status(500).json({ error: "Failed to send email" });
    }

    res.status(200).json({ success: true, emailId: data.id });
  } catch (err) {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
