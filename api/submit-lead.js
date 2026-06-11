const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Resend Client
const resendApiKey = process.env.RESEND_API_KEY;
const resend = new Resend(resendApiKey);

// Target notification email
const OWNER_EMAIL = 'chandan@motionmatrix.studio';

module.exports = async (req, res) => {
  // Allow CORS from local development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  try {
    const { name, email, company, phone, service, message, source } = req.body;

    // Validation
    if (!name || !email) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Name and Email are required fields.' }));
      return;
    }

    const timestamp = new Date().toISOString();

    // 1. Save Lead to Supabase
    const { data: lead, error: insertError } = await supabase
      .from('leads')
      .insert([
        {
          name,
          email,
          company: company || null,
          phone: phone || null,
          service: service || null,
          message: message || null,
          source: source || 'website_lead_form',
          created_at: timestamp
        }
      ])
      .select();

    if (insertError) {
      console.error('Supabase lead insertion error:', insertError);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Database insertion failed.' }));
      return;
    }

    // 2. Send Email Notification via Resend
    let emailStatus = 'skipped';
    
    if (resendApiKey) {
      try {
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
        
        const emailResult = await resend.emails.send({
          from: `Motion Matrix Leads <${fromEmail}>`,
          to: OWNER_EMAIL,
          subject: `New Lead Captured: ${name} (${company || 'No Company'})`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #eee;">
              <h2 style="color: #0B0B0B; border-bottom: 2px solid #C6FF3D; padding-bottom: 10px;">New Website Lead</h2>
              <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; width: 150px;">Name:</td>
                  <td style="padding: 8px 0;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Email:</td>
                  <td style="padding: 8px 0;"><a href="mailto:${email}">${email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Company:</td>
                  <td style="padding: 8px 0;">${company || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Phone:</td>
                  <td style="padding: 8px 0;">${phone || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Selected Service:</td>
                  <td style="padding: 8px 0;">${service || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; vertical-align: top;">Message:</td>
                  <td style="padding: 8px 0; white-space: pre-wrap;">${message || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Source:</td>
                  <td style="padding: 8px 0; font-family: monospace;">${source || 'website_lead_form'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Timestamp:</td>
                  <td style="padding: 8px 0; font-size: 12px; color: #666;">${new Date(timestamp).toLocaleString()}</td>
                </tr>
              </table>
              <div style="margin-top: 30px; font-size: 11px; color: #888; border-top: 1px solid #eee; padding-top: 10px; text-align: center;">
                Sent automatically by Motion Matrix Serverless API handler.
              </div>
            </div>
          `
        });

        if (emailResult.error) {
          console.error('Resend email delivery error:', emailResult.error);
          emailStatus = `failed: ${emailResult.error.message}`;
        } else {
          emailStatus = 'sent';
        }
      } catch (mailErr) {
        console.error('Error executing Resend email dispatch:', mailErr);
        emailStatus = `error: ${mailErr.message}`;
      }
    } else {
      console.warn('Resend API key is missing. Email dispatch skipped.');
    }

    // Respond with success
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: true, 
      leadId: lead[0].id,
      emailStatus: emailStatus 
    }));

  } catch (err) {
    console.error('Lead submission server error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal Server Error' }));
  }
};
