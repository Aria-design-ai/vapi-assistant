import { Resend } from "resend";

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

const departmentEmails = {
  car_sales: "aryansamnani09@gmail.com",
  car_service: "aryansamnani9@gmail.com",
  bike_sales: "amirsamnani13@gmail.com",
  bike_service: "amirsamnani84@gmail.com",
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body;
    console.log("Incoming request body:", body);
    console.log("Tool call object:", body.toolCalls?.[0]);
    
    const toolCall = body.toolCalls?.[0];
    
    const name = toolCall?.args?.name;
    const phone = toolCall?.args?.phone;
    const message = toolCall?.args?.message;
    const department = toolCall?.args?.department;
    const vehicle_info = toolCall?.args?.vehicle_info || "Not provided";

    if (!name || !phone || !message || !department) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const toEmail = departmentEmails[department];
    if (!toEmail) {
      return res.status(400).json({ error: "Invalid department" });
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
      return res.status(500).json({ error: "Failed to send email" });
    }

    res.status(200).json({ success: true, emailId: data.id });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
