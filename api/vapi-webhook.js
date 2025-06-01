export const config = {
  runtime: 'edge',
};

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY); // Store this in Vercel Environment Variables

const DEPARTMENT_EMAILS = {
  sales: 'sales@example.com',
  service: 'service@example.com',
  // future: parts: 'parts@example.com',
};

export async function POST(req) {
  try {
    const { Name, Phone, Message, Department, vehicle_info } = await req.json();

    // Basic validation
    if (!Name || !Phone || !Message || !Department) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    // Get recipient email based on department
    const recipientEmail = DEPARTMENT_EMAILS[Department.toLowerCase()];
    if (!recipientEmail) {
      return new Response(JSON.stringify({ error: 'Invalid department selected' }), { status: 400 });
    }

    // Format email content
    const subject = `New ${Department} Inquiry from ${Name}`;
    const body = `
      <p><strong>Name:</strong> ${Name}</p>
      <p><strong>Phone:</strong> ${Phone}</p>
      <p><strong>Message:</strong> ${Message}</p>
      <p><strong>Department:</strong> ${Department}</p>
      ${vehicle_info ? `<p><strong>Vehicle Info:</strong> ${vehicle_info}</p>` : ''}
    `;

    // Send the email
    await resend.emails.send({
      from: 'reception@yourdomain.com',
      to: recipientEmail,
      subject,
      html: body,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
    });

  } catch (err) {
    console.error('❌ Webhook Error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
