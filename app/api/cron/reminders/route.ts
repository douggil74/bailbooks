import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getResend } from '@/lib/resend-server';
import { sendSMS, sendCheckinRequest } from '@/lib/twilio-server';
import {
  courtReminderEmail,
  paymentReminderEmail,
  checkinReminderEmail,
} from '@/lib/email-templates';

function dateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return dateString(d);
}

export async function GET(req: NextRequest) {
  // Auth
  const authHeader = req.headers.get('authorization');
  const expected = process.env.CRON_SECRET;
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerClient();
  const resend = getResend();
  const today = dateString(new Date());
  const targetDays = [1, 3, 7];
  const targetDates = targetDays.map((d) => ({ days: d, date: addDays(d) }));

  let courtSent = 0;
  let paymentSent = 0;
  let checkinSent = 0;

  // ── Court Reminders ──
  const courtResults = await Promise.allSettled(
    targetDates.map(async ({ days, date }) => {
      const { data: cases } = await supabase
        .from('applications')
        .select('id, defendant_first, defendant_last, defendant_phone, defendant_email, court_name, court_date, sms_consent')
        .in('status', ['approved', 'active'])
        .eq('court_date', date);

      if (!cases || cases.length === 0) return;

      for (const c of cases) {
        const reminderType = `court_${days}d_${date}`;

        // Dedup check
        const { data: existing } = await supabase
          .from('reminders_sent')
          .select('id')
          .eq('application_id', c.id)
          .eq('reminder_type', reminderType)
          .limit(1);

        if (existing && existing.length > 0) continue;

        const emailTemplate = courtReminderEmail({
          defendantFirst: c.defendant_first,
          courtDate: date,
          courtName: c.court_name || 'See your paperwork',
          daysUntil: days,
        });

        // SMS
        if (c.sms_consent && c.defendant_phone) {
          try {
            const urgency = days <= 1 ? 'TOMORROW' : `in ${days} days`;
            await sendSMS(
              c.defendant_phone,
              `Reminder: Your court date at ${c.court_name || 'court'} is ${urgency} (${date}). Do NOT miss it. -Bailbonds Financed`
            );
            await supabase.from('sms_log').insert({
              application_id: c.id,
              phone: c.defendant_phone,
              direction: 'outbound',
              message: `Court reminder (${days}d)`,
              status: 'sent',
            });
            await supabase.from('reminders_sent').insert({
              application_id: c.id,
              reminder_type: reminderType,
              channel: 'sms',
            });
            courtSent++;
          } catch (err) {
            console.error(`Court SMS failed for ${c.id}:`, err);
          }
        }

        // Email
        if (c.defendant_email) {
          try {
            await resend.emails.send({
              from: 'Bailbonds Financed <reminders@resend.dev>',
              to: c.defendant_email,
              subject: emailTemplate.subject,
              html: emailTemplate.html,
            });
            await supabase.from('reminders_sent').insert({
              application_id: c.id,
              reminder_type: reminderType,
              channel: 'email',
            });
            courtSent++;
          } catch (err) {
            console.error(`Court email failed for ${c.id}:`, err);
          }
        }
      }
    })
  );

  // ── Payment Reminders ──
  const paymentResults = await Promise.allSettled(
    targetDates.map(async ({ days, date }) => {
      const { data: cases } = await supabase
        .from('applications')
        .select('id, defendant_first, defendant_last, defendant_phone, defendant_email, payment_amount, next_payment_date, sms_consent')
        .in('status', ['approved', 'active'])
        .eq('next_payment_date', date);

      if (!cases || cases.length === 0) return;

      for (const c of cases) {
        const reminderType = `payment_${days}d_${date}`;

        const { data: existing } = await supabase
          .from('reminders_sent')
          .select('id')
          .eq('application_id', c.id)
          .eq('reminder_type', reminderType)
          .limit(1);

        if (existing && existing.length > 0) continue;

        const emailTemplate = paymentReminderEmail({
          defendantFirst: c.defendant_first,
          paymentAmount: c.payment_amount || 0,
          paymentDueDate: date,
          daysUntil: days,
        });

        // SMS
        if (c.sms_consent && c.defendant_phone) {
          try {
            const urgency = days <= 1 ? 'tomorrow' : `in ${days} days`;
            const amt = c.payment_amount ? `$${Number(c.payment_amount).toLocaleString()}` : 'your payment';
            await sendSMS(
              c.defendant_phone,
              `Reminder: ${amt} is due ${urgency} (${date}). Please pay on time. -Bailbonds Financed`
            );
            await supabase.from('sms_log').insert({
              application_id: c.id,
              phone: c.defendant_phone,
              direction: 'outbound',
              message: `Payment reminder (${days}d)`,
              status: 'sent',
            });
            await supabase.from('reminders_sent').insert({
              application_id: c.id,
              reminder_type: reminderType,
              channel: 'sms',
            });
            paymentSent++;
          } catch (err) {
            console.error(`Payment SMS failed for ${c.id}:`, err);
          }
        }

        // Email
        if (c.defendant_email) {
          try {
            await resend.emails.send({
              from: 'Bailbonds Financed <reminders@resend.dev>',
              to: c.defendant_email,
              subject: emailTemplate.subject,
              html: emailTemplate.html,
            });
            await supabase.from('reminders_sent').insert({
              application_id: c.id,
              reminder_type: reminderType,
              channel: 'email',
            });
            paymentSent++;
          } catch (err) {
            console.error(`Payment email failed for ${c.id}:`, err);
          }
        }
      }
    })
  );

  // ── Check-in Reminders ──
  const checkinResults = await Promise.allSettled([
    (async () => {
      const { data: cases } = await supabase
        .from('applications')
        .select('id, defendant_first, defendant_last, defendant_phone, defendant_email, sms_consent, checkin_frequency')
        .in('status', ['approved', 'active'])
        .eq('sms_consent', true);

      if (!cases || cases.length === 0) return;

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bailbondsfinanced.com';

      for (const c of cases) {
        if (!c.checkin_frequency) continue;

        // Get last check-in
        const { data: lastCheckins } = await supabase
          .from('checkins')
          .select('checked_in_at')
          .eq('application_id', c.id)
          .order('checked_in_at', { ascending: false })
          .limit(1);

        if (!lastCheckins || lastCheckins.length === 0) continue;

        const lastDate = new Date(lastCheckins[0].checked_in_at);
        const freqDays = c.checkin_frequency === 'weekly' ? 7 : c.checkin_frequency === 'biweekly' ? 14 : 30;
        const nextDue = new Date(lastDate.getTime() + freqDays * 24 * 60 * 60 * 1000);
        const nextDueStr = dateString(nextDue);

        // Only send if due today or overdue
        if (nextDueStr > today) continue;

        const reminderType = `checkin_${today}`;

        const { data: existing } = await supabase
          .from('reminders_sent')
          .select('id')
          .eq('application_id', c.id)
          .eq('reminder_type', reminderType)
          .limit(1);

        if (existing && existing.length > 0) continue;

        const checkinUrl = `${siteUrl}/checkin?id=${c.id}`;

        // SMS via sendCheckinRequest
        if (c.defendant_phone) {
          try {
            await sendCheckinRequest(c.id, c.defendant_phone);
            await supabase.from('sms_log').insert({
              application_id: c.id,
              phone: c.defendant_phone,
              direction: 'outbound',
              message: 'Check-in reminder (automated)',
              status: 'sent',
            });
            await supabase.from('reminders_sent').insert({
              application_id: c.id,
              reminder_type: reminderType,
              channel: 'sms',
            });
            checkinSent++;
          } catch (err) {
            console.error(`Checkin SMS failed for ${c.id}:`, err);
          }
        }

        // Email
        if (c.defendant_email) {
          try {
            const emailTemplate = checkinReminderEmail({
              defendantFirst: c.defendant_first,
              checkinUrl,
            });
            await resend.emails.send({
              from: 'Bailbonds Financed <reminders@resend.dev>',
              to: c.defendant_email,
              subject: emailTemplate.subject,
              html: emailTemplate.html,
            });
            await supabase.from('reminders_sent').insert({
              application_id: c.id,
              reminder_type: reminderType,
              channel: 'email',
            });
            checkinSent++;
          } catch (err) {
            console.error(`Checkin email failed for ${c.id}:`, err);
          }
        }
      }
    })(),
  ]);

  // Log any top-level failures
  for (const r of [...courtResults, ...paymentResults, ...checkinResults]) {
    if (r.status === 'rejected') {
      console.error('Reminder batch error:', r.reason);
    }
  }

  return NextResponse.json({
    court_sent: courtSent,
    payment_sent: paymentSent,
    checkin_sent: checkinSent,
  });
}
