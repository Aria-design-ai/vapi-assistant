// Vercel Edge Function - webhook for Vapi assistant tool
export const config = {
  runtime: 'edge',
};

// CORS preflight handler
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// Helper to send email (you'll need to integrate with a real email service)
async function sendEmail(to, subject, body) {
  // Placeholder — replace with real integration (e.g., SendGrid, Resend, Mailgun)
  console.log(`📧 Sending email to ${to}...\nSubject: ${subject}\nBody: ${body}`);
}

// Main POST handler
export async function POST(req) {
  try {
    const { tool_call_id, tool_name, parameters } = await req.json();

    if (tool_name !== 'capture_lead') {
      return new Response('Tool not handled by this endpoint', { status: 400 });
    }

    const { Name, Phone, Message, Department, vehicle_info } = parameters;

    const departments = {
      car_sales: 'aryansamnani09@gmail.com',
      car_service: 'aryansamnani9@gmail.com',
      bike_sales: 'amirsamnani13@gmail.com',
      bike_service: 'amirsamnani84@gmail.com',
    };

    const recipient = departments[Department];

    if (!recipient) {
      console.error(`❌ Unknown department: ${Department}`);
      return new Response('Unknown department', { status: 400 });
    }

    const subject = `📞 New Lead: ${Department.replace('_', ' ').toUpperCase()}`;
    const body = `
Name: ${Name}
Phone: ${Phone}
Department: ${Department}
Message: ${Message}
Vehicle Info: ${vehicle_info || 'N/A'}
    `;

    await sendEmail(recipient, subject, body);

    return new Response(
      JSON.stringify({ success: true, message: 'Lead captured and emailed successfully.' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err) {
    console.error('❌ Error handling webhook:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
