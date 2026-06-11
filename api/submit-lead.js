const { createClient } = require('@supabase/supabase-js');

const OWNER_EMAIL = process.env.OWNER_EMAIL || 'chandan@motionmatrix.studio';

const json = (res, status, body) => {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = status;
  res.end(JSON.stringify(body));
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.statusCode = 200; res.end(); return; }
  if (req.method !== 'POST') return json(res, 405, { error: 'Method Not Allowed' });

  // Check env vars — return clean JSON error if not configured yet
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return json(res, 503, { error: 'Backend not configured yet. Please contact us directly at chandan@motionmatrix.studio' });
  }

  try {
    const { name, email, company, phone, service, message, source } = req.body;

    if (!name || !email) {
      return json(res, 400, { error: 'Name and Email are required.' });
    }

    // Save lead to Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: lead, error: insertError } = await supabase
      .from('leads')
      .insert([{
        name,
        email,
        company:  company  || null,
        phone:    phone    || null,
        service:  service  || null,
        message:  message  || null,
        source:   source   || 'website_lead_form',
        created_at: new Date().toISOString()
      }])
      .select();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return json(res, 500, { error: 'Could not save your inquiry. Please try again.' });
    }

    // Send email notification via Resend (optional — skipped if key missing)
    const resendApiKey = process.env.RESEND_API_KEY;
    let emailStatus = 'skipped';

    if (resendApiKey) {
      try {
        const { Resend } = require('resend');
        const resend = new Resend(resendApiKey);
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

        const result = await resend.emails.send({
          from: `Motion Matrix Leads <${fromEmail}>`,
          to: OWNER_EMAIL,
          subject: `New Lead: ${name} — ${company || 'No Company'}`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;padding:24px;border:1px solid #eee">
              <h2 style="border-bottom:3px solid #C6FF3D;padding-bottom:8px;color:#0B0B0B">New Website Lead</h2>
              <table style="width:100%;border-collapse:collapse;margin-top:12px">
                <tr><td style="padding:8px 0;font-weight:700;width:140px">Name</td><td style="padding:8px 0">${name}</td></tr>
                <tr><td style="padding:8px 0;font-weight:700">Email</td><td style="padding:8px 0"><a href="mailto:${email}">${email}</a></td></tr>
                <tr><td style="padding:8px 0;font-weight:700">Company</td><td style="padding:8px 0">${company || '—'}</td></tr>
                <tr><td style="padding:8px 0;font-weight:700">Phone</td><td style="padding:8px 0">${phone || '—'}</td></tr>
                <tr><td style="padding:8px 0;font-weight:700">Service</td><td style="padding:8px 0">${service || '—'}</td></tr>
                <tr><td style="padding:8px 0;font-weight:700;vertical-align:top">Message</td><td style="padding:8px 0;white-space:pre-wrap">${message || '—'}</td></tr>
              </table>
              <p style="font-size:11px;color:#999;margin-top:24px">Sent by motionmatrix.studio</p>
            </div>
          `
        });

        if (result.error) {
          console.error('Resend delivery error:', JSON.stringify(result.error));
          emailStatus = `failed: ${result.error.message}`;
        } else {
          console.log('Email sent OK, id:', result.data?.id);
          emailStatus = 'sent';
        }
      } catch (mailErr) {
        console.error('Resend error:', mailErr.message);
        emailStatus = 'error';
      }
    }

    return json(res, 200, { success: true, leadId: lead[0].id, emailStatus });

  } catch (err) {
    console.error('Lead API error:', err);
    return json(res, 500, { error: 'Internal server error. Please try again.' });
  }
};
