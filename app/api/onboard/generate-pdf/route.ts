import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { jsPDF } from 'jspdf';

export async function GET(req: NextRequest) {
  const applicationId = req.nextUrl.searchParams.get('id');
  if (!applicationId) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  try {
    const supabase = createServerClient();

    // Fetch all related data
    const [appResult, refsResult, sigsResult, docsResult] = await Promise.all([
      supabase.from('applications').select('*').eq('id', applicationId).single(),
      supabase.from('application_references').select('*').eq('application_id', applicationId),
      supabase.from('signatures').select('*').eq('application_id', applicationId).order('signed_at', { ascending: false }),
      supabase.from('documents').select('*').eq('application_id', applicationId),
    ]);

    const app = appResult.data;
    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const refs = refsResult.data || [];
    const sigs = sigsResult.data || [];
    const docs = docsResult.data || [];

    const today = new Date();
    const dateStr = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
    const defendantName = `${app.defendant_first} ${app.defendant_last}`.toUpperCase();
    const premium = app.premium ? `$${Number(app.premium).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$_________';
    const bondAmount = app.bond_amount ? `$${Number(app.bond_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$_________';
    const downPayment = app.down_payment ? `$${Number(app.down_payment).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$_________';
    const paymentAmt = app.payment_amount ? `$${Number(app.payment_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$_________';

    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
    const W = doc.internal.pageSize.getWidth();
    const margin = 50;
    const contentW = W - margin * 2;

    // Helper functions
    function bold(text: string, x: number, y: number, size = 10) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(size);
      doc.text(text, x, y);
    }

    function normal(text: string, x: number, y: number, size = 9) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(size);
      doc.text(text, x, y);
    }

    function wrappedText(text: string, x: number, y: number, maxWidth: number, size = 9): number {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(size);
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return y + lines.length * (size + 3);
    }

    function sectionHeader(text: string, y: number): number {
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.line(margin, y, W - margin, y);
      bold(text, margin, y + 14, 10);
      return y + 24;
    }

    function fieldRow(label: string, value: string, x: number, y: number, width: number): number {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(label, x, y);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(value || '', x + 2, y + 12);
      doc.setDrawColor(180);
      doc.setLineWidth(0.3);
      doc.line(x, y + 15, x + width, y + 15);
      return y + 22;
    }

    // ────────────────────────────────────────────────
    // PAGE 1: BAIL BOND AGREEMENT
    // ────────────────────────────────────────────────
    bold('BAIL BOND AGREEMENT, INDEMNITY AGREEMENT, AND CONTRACT', margin, 50, 13);
    doc.setFont('helvetica', 'normal');

    let y = 75;
    y = wrappedText(
      `THIS AGREEMENT, entered into, on the ${today.getDate()} day of ${today.toLocaleString('en-US', { month: 'long' })}, 20${today.getFullYear().toString().slice(2)}, by and between Elite Bail Bonds dba Bailbonds Financed (Hereinafter referred to as "COMPANY") and ${defendantName} (Hereinafter referred to collectively as "INDEMNITOR"), who, for and in consideration of the covenants hereinafter stated, agree as follows:`,
      margin, y, contentW, 9
    );

    y = sectionHeader('PREMIUM AND PAYMENT', y + 6);
    y = wrappedText(
      `1. The Defendant and Indemnitor agree to pay to the Company the full and true sum of ${premium} in consideration for the Company providing a bail bond for ${defendantName}, the Defendant, who is charged in the ${app.court_name || '_______________'} Court, for the Parish of St. Tammany, State of Louisiana, in the matter of ${defendantName} (Defendant) of said court. The surety bonds are insured through Palmetto Surety Corporation (Insurance Company) and by its Power of Attorney Number(s) _______________. The aforesaid amount is due and payable upon the posting of the surety bond(s) and shall be immediately and fully earned by the Company upon the signing of this contract and/or the posting of the herein identified bond(s) at the jail/court, regardless of whether such bond(s) results in the actual release of the defendant from jail, or if the bond(s) are revoked anytime thereafter in accordance with this contract or likewise.`,
      margin, y, contentW, 8
    );

    y = wrappedText(
      `2. If for whatever reason the bond is accepted, not accepted, or cannot be posted at the jail, the defendant and/or indemnitor(s) herein specifically authorize that any sums paid herein may be applied to any outstanding balance that is owed to the Company on the oldest account of the defendant first, or the account of any indemnitor herein, otherwise a refund less any fees not returned by the sheriff, shall be refunded to the client once all surety bonds posted are returned to the Company, without execution, and along with the return of the related payment receipt issued by the Company.`,
      margin, y + 4, contentW, 8
    );

    y = sectionHeader('DISCLOSURE REQUIREMENTS', y + 4);
    y = wrappedText(
      `3. Failure of the defendant and/or its indemnitor(s) to notify Company, prior to the posting of surety bond, that the defendant is a non-U.S. citizen, or likewise, may result in all of the following: apprehension and surrender of defendant; surrender of surety bonds; forfeit of sums pay; unpaid balance will be paid to Company on demand.`,
      margin, y, contentW, 8
    );
    y = wrappedText(
      `4. Failure of the defendant and/or indemnitor(s) to notify Company, prior to the posting of surety bond that a defendant is currently on probation and/or parole, may result in all of the following: apprehension and surrender of defendant; surrender of surety bonds; forfeit of sums pay; unpaid balance will be paid to Company on demand.`,
      margin, y + 4, contentW, 8
    );

    y = sectionHeader("DEFENDANT'S OBLIGATION TO APPEAR", y + 4);
    y = wrappedText(
      `5. The Defendant and Indemnitor(s) assume the affirmative obligation and guarantee that the Defendant will appear without fail at every proceeding, hearing and court date in this matter; and he/she will abide by and honor all subpoenas, notices, and/or orders of the court, pursuant to the charge(s) for which a surety bond(s) is/are undertaking.`,
      margin, y, contentW, 8
    );

    y = sectionHeader('INDEMNIFICATION AND LIABILITY', y + 4);
    y = wrappedText(
      `6. The Defendant and its Indemnitor(s) agree to pay and indemnify the Company and its agents against any and all liability, loss, damages, attorneys' fees, notice, judgment of bond forfeiture, administration fees and/or expenses, whatsoever, as it relates to the surety bond(s) posted. These liabilities/losses/fees/cost include, but are not limited to, the following:`,
      margin, y, contentW, 8
    );
    y = wrappedText(`A. Any and all costs and expenses incur and/or deemed by Company in the investigating, locating and/or apprehension efforts, successful or otherwise, of the Defendant.`, margin + 20, y + 4, contentW - 20, 8);
    y = wrappedText(`B. The full sum of ${bondAmount}, representing the face value of the bail bond(s) herein, in addition to any and all court costs, attorneys' fees, judicial interest, legal interest associated with any forfeiture.`, margin + 20, y + 2, contentW - 20, 8);
    y = wrappedText(`C. Any and all fees, charges, duties or taxes due to any governmental agency.`, margin + 20, y + 2, contentW - 20, 8);
    y = wrappedText(`D. Any and all costs, expenses and attorneys' fees incurred for collection. Attorneys' fees shall be no less than $250.00 or up to 25% of total amount sought, whichever is greater.`, margin + 20, y + 2, contentW - 20, 8);
    y = wrappedText(`E. At Company's discretion, a bond may be reinstated at a fee of up to $150.00.`, margin + 20, y + 2, contentW - 20, 8);
    y = wrappedText(`F. The issuing of a Notice of warrant/attachment shall result in a fee of $150.00.`, margin + 20, y + 2, contentW - 20, 8);

    // ────────────────────────────────────────────────
    // PAGE 2: COLLATERAL, DEFAULT, REVOCATION
    // ────────────────────────────────────────────────
    doc.addPage();
    y = 50;
    y = sectionHeader('COLLATERAL AND SECURITY', y);
    y = wrappedText(
      `7. As security for the faithful performance of this contract, the Indemnitor(s) agrees to deposit with the Company the cash sum of $_________ or to execute another, or other security device(s) in which the Company finds acceptable. There shall be a fee of up to (4%) of any collateral paid in the form of credit card or debit card.`,
      margin, y, contentW, 8
    );

    y = sectionHeader('DEFAULT PROVISIONS', y + 6);
    y = wrappedText(
      `8. The parties hereto agree that the following acts shall constitute default under this contract:`,
      margin, y, contentW, 8
    );
    const defaults = [
      'A. The failure of the Defendant to appear at any proceeding, hearing or required court appearance.',
      'B. The failure of the Defendant to refrain from engaging in any conduct that constitutes a violation of law during the duration of the surety bond.',
      'C. The failure of the Defendant to notify the Company of any change in phone number, address, or employment.',
      'D. The failure of the Defendant to retain an attorney within fifteen (15) days of entering into this agreement.',
      'E. The Defendant leaving the jurisdiction of the court without written permission from the Company.',
      'F. The granting or issuing of any notice of warrant/attachment.',
      'G. The Defendant and/or Indemnitor(s) failure to notify the Company of any changes in personal status/information.',
      'H. The making of any false or untrue statement by the Defendant or an Indemnitor.',
      'I. If the bond(s) is/are revoked for any reason by the presiding judge after a Defendant has been released.',
    ];
    for (const d of defaults) {
      y = wrappedText(d, margin + 20, y + 3, contentW - 20, 8);
    }

    y = sectionHeader('REVOCATION AND SURRENDER', y + 6);
    y = wrappedText(
      `9. The Defendant and the Indemnitor(s) further agree to abide by the above conditions and understand that a violation may result in immediate revocation of the bond(s), surrender of the Defendant, and any monies previously paid are non-refundable.`,
      margin, y, contentW, 8
    );
    y = wrappedText(
      `10. The Company as surety shall have control and jurisdiction over the Defendant during the term for which the bond is executed and has the right to surrender the Defendant at any time.`,
      margin, y + 4, contentW, 8
    );

    y = sectionHeader('BAIL ENFORCEMENT AND SEARCH AUTHORIZATION', y + 6);
    y = wrappedText(
      `11. The Defendant agrees that if in default, he/she authorizes his/her name and/or photo to be placed in any publications the Company deems appropriate.`,
      margin, y, contentW, 8
    );
    y = wrappedText(
      `12. The Defendant and Indemnitor(s) agree that bail enforcement agents may enter residences for the purpose of conducting a search for the Defendant. No search warrant is required.`,
      margin, y + 4, contentW, 8
    );

    y = sectionHeader('ADDITIONAL OBLIGATIONS AND FEES', y + 6);
    y = wrappedText(`13. The Defendant must notify the Company of case resolution within thirty (30) days. Failure results in a fee up to $100.00.`, margin, y, contentW, 8);
    y = wrappedText(`14. Any returned payment may result in: apprehension; $25.00 returned payment fee; and/or attorneys' fee of up to $500.`, margin, y + 4, contentW, 8);
    y = wrappedText(`15. Company may add G.P.S. ankle/bracelet monitoring conditions during the duration of the surety bond.`, margin, y + 4, contentW, 8);

    y = sectionHeader('GENERAL PROVISIONS', y + 6);
    y = wrappedText(`16. The Indemnitor(s) agree to be bound by all terms jointly, severally and in solido.`, margin, y, contentW, 8);
    y = wrappedText(`17. The Indemnitor(s) have read this agreement in its entirety and fully understand the terms and conditions.`, margin, y + 4, contentW, 8);
    y = wrappedText(`18. If any provision is found illegal, only that provision shall be severed. All other provisions remain in full force.`, margin, y + 4, contentW, 8);
    y = wrappedText(`19. This contract shall inure to the benefit of all parties, their successors, heirs and/or assigns.`, margin, y + 4, contentW, 8);

    // ────────────────────────────────────────────────
    // PAGE 3: ELECTRONIC RECORDS, PRIVACY, SIGNATURES
    // ────────────────────────────────────────────────
    doc.addPage();
    y = 50;
    y = sectionHeader('ELECTRONIC RECORDS AND IMAGING', y);
    y = wrappedText(
      `20. Defendant and Indemnitor(s) acknowledge that Company may image the original paper contract electronically and may destroy such paper originals. The Imaged Documents shall be valid, binding, and enforceable to the same extent as the original paper documents.`,
      margin, y, contentW, 8
    );

    y = sectionHeader('PRIVACY AND INVESTIGATIVE AUTHORIZATION', y + 6);
    y = wrappedText(
      `21. I understand that investigative inquiries are to be made on myself, including consumer, criminal, driving, credit and other reports, in accordance with the PRIVACY ACT, FREEDOM OF INFORMATION ACT and FAIR CREDIT REPORTING LAWS. I hereby authorize any party(ies) or agency(ies) contacted to furnish such information.`,
      margin, y, contentW, 8
    );

    y = sectionHeader('VOLUNTARY EXECUTION', y + 6);
    y = wrappedText(
      `22. I/we have neither been coerced, forced, threatened, or placed under duress and I/we have placed my/our signature(s) herein at my/our own free will.`,
      margin, y, contentW, 8
    );

    y = sectionHeader('EXECUTION AND HOLD HARMLESS', y + 6);
    y = wrappedText(
      `23. In witness whereof we have subscribed our names on the date and month first above written.`,
      margin, y, contentW, 8
    );
    y = wrappedText(
      `24. The undersigned principal hereby agrees to indemnify and/or hold harmless the Company, its Surety or its agents for any and all losses not otherwise prohibited by law. The Defendant hereby waives his/her rights with respect to the Privacy Act.`,
      margin, y + 4, contentW, 8
    );

    // Signature block
    y += 30;
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);

    // Draw defendant signature
    if (sigs.length > 0 && sigs[0].signature_data) {
      try {
        doc.addImage(sigs[0].signature_data, 'PNG', margin, y - 25, 150, 40);
      } catch { /* signature image failed, skip */ }
    }

    doc.line(margin, y + 20, margin + 200, y + 20);
    normal('DEFENDANT SIGNATURE', margin, y + 30, 8);
    doc.line(W - margin - 200, y + 20, W - margin, y + 20);
    normal('INDEMNITOR SIGNATURE', W - margin - 200, y + 30, 8);

    y += 45;
    bold(defendantName, margin, y, 9);
    doc.line(margin, y + 3, margin + 140, y + 3);
    normal('DEFENDANT PRINT', margin, y + 13, 8);
    normal(dateStr, margin + 160, y, 9);
    doc.line(margin + 160, y + 3, margin + 220, y + 3);
    normal('DATE', margin + 160, y + 13, 8);

    doc.line(W - margin - 200, y + 3, W - margin - 60, y + 3);
    normal('INDEMNITOR PRINT', W - margin - 200, y + 13, 8);
    doc.line(W - margin - 50, y + 3, W - margin, y + 3);
    normal('DATE', W - margin - 50, y + 13, 8);

    // ────────────────────────────────────────────────
    // PAGE 4: DEFENDANT INFORMATION FORM
    // ────────────────────────────────────────────────
    doc.addPage();
    y = 50;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    (doc as unknown as { text: (text: string, x: number, y: number, options?: { align?: string }) => void }).text('DEFENDANT INFORMATION', W / 2, y, { align: 'center' });

    y = 75;
    // Personal Information section
    doc.setFillColor(220, 220, 220);
    doc.rect(margin, y, contentW, 16, 'F');
    bold('PERSONAL INFORMATION', margin + 4, y + 12, 9);
    y += 22;

    const col1 = margin;
    const col2 = margin + contentW * 0.5;
    const col3 = margin + contentW * 0.75;

    y = fieldRow('Full Name:', defendantName, col1, y, contentW * 0.45);
    fieldRow('Date:', dateStr, col3, y - 22, contentW * 0.25);

    y = fieldRow('Address:', app.defendant_address || '', col1, y, contentW * 0.8);
    y = fieldRow('City:', app.defendant_city || '', col1, y, contentW * 0.3);
    fieldRow('State:', app.defendant_state || 'LA', col2 - 60, y - 22, contentW * 0.15);
    fieldRow('Zip:', app.defendant_zip || '', col2 + 40, y - 22, contentW * 0.15);

    y = fieldRow('Cell Phone:', app.defendant_phone || '', col1, y, contentW * 0.45);
    fieldRow('Home Phone:', '', col2, y - 22, contentW * 0.45);

    y = fieldRow('Social Security #:', app.defendant_ssn_last4 ? `XXX-XX-${app.defendant_ssn_last4}` : '', col1, y, contentW * 0.45);
    fieldRow('Date of Birth:', app.defendant_dob || '', col2, y - 22, contentW * 0.45);

    y = fieldRow('Email:', app.defendant_email || '', col1, y, contentW * 0.45);
    fieldRow("Driver's License #:", app.defendant_dl_number || '', col2, y - 22, contentW * 0.45);

    // Employment section
    y += 8;
    doc.setFillColor(220, 220, 220);
    doc.rect(margin, y, contentW, 16, 'F');
    bold('EMPLOYMENT INFORMATION:', margin + 4, y + 12, 9);
    y += 22;

    y = fieldRow('Employer:', app.employer_name || '', col1, y, contentW * 0.45);
    fieldRow('Occupation:', '', col2, y - 22, contentW * 0.45);
    y = fieldRow('Employer Phone:', app.employer_phone || '', col1, y, contentW * 0.45);

    // Bond/Case section
    y += 8;
    doc.setFillColor(220, 220, 220);
    doc.rect(margin, y, contentW, 16, 'F');
    bold('BOND INFORMATION:', margin + 4, y + 12, 9);
    y += 22;

    y = fieldRow('Bond Amount:', bondAmount, col1, y, contentW * 0.3);
    fieldRow('Charges:', app.charge_description || '', col2 - 60, y - 22, contentW * 0.55);
    y = fieldRow('Court:', app.court_name || '', col1, y, contentW * 0.3);
    fieldRow('Court Date:', app.court_date || '', col2 - 60, y - 22, contentW * 0.25);
    fieldRow('Case #:', app.case_number || '', col3 - 20, y - 22, contentW * 0.25);
    y = fieldRow('Jail Location:', app.jail_location || '', col1, y, contentW * 0.45);

    // References section
    y += 8;
    doc.setFillColor(220, 220, 220);
    doc.rect(margin, y, contentW, 16, 'F');
    bold('REFERENCES:', margin + 4, y + 12, 9);
    y += 22;

    for (let i = 0; i < 3; i++) {
      const ref = refs[i];
      y = fieldRow('Name:', ref?.full_name || '', col1, y, contentW * 0.45);
      fieldRow('Relationship:', ref?.relationship || '', col2, y - 22, contentW * 0.45);
      y = fieldRow('Phone:', ref?.phone || '', col1, y, contentW * 0.45);
      fieldRow('Address:', ref?.address || '', col2, y - 22, contentW * 0.45);
    }

    // Warranty & signature
    y += 15;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    const warrantyLines = doc.splitTextToSize(
      'THE DEFENDANT HEREBY WARRANTS THAT ALL OF THE ABOVE INFORMATION IS TRUE AND CORRECT AND THERE HAS BEEN NO FALSE STATEMENTS AND/OR MATERIAL OMISSIONS OF INFORMATION REQUIRED.',
      contentW
    );
    doc.text(warrantyLines, margin, y);
    y += warrantyLines.length * 10 + 15;

    if (sigs.length > 0 && sigs[0].signature_data) {
      try {
        doc.addImage(sigs[0].signature_data, 'PNG', margin, y - 15, 120, 30);
      } catch { /* skip */ }
    }
    doc.setLineWidth(0.5);
    doc.line(margin, y + 18, margin + 200, y + 18);
    normal('DEFENDANT SIGNATURE', margin, y + 28, 8);
    bold(defendantName, margin, y + 42, 9);
    normal(dateStr, margin + 160, y + 42, 9);

    // ────────────────────────────────────────────────
    // PAGE 5: PROMISSORY NOTE
    // ────────────────────────────────────────────────
    doc.addPage();
    y = 50;
    bold('PROMISSORY NOTE & INSTALLMENT PAYMENT PLAN FOR UNPAID PREMIUM', margin, y, 12);
    y += 30;

    // Payment table
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.rect(margin, y, contentW, 50);
    doc.line(margin + contentW / 3, y, margin + contentW / 3, y + 50);
    doc.line(margin + (contentW * 2) / 3, y, margin + (contentW * 2) / 3, y + 50);
    doc.line(margin, y + 25, margin + contentW, y + 25);

    normal('Bond Amount', margin + 5, y + 10, 8);
    bold(bondAmount, margin + 5, y + 20, 10);
    normal('Down Payment', margin + contentW / 3 + 5, y + 10, 8);
    bold(downPayment, margin + contentW / 3 + 5, y + 20, 10);
    normal('Payment Amount', margin + (contentW * 2) / 3 + 5, y + 10, 8);
    bold(paymentAmt, margin + (contentW * 2) / 3 + 5, y + 20, 10);

    normal('Power Number', margin + 5, y + 35, 8);
    normal('Remaining Balance', margin + contentW / 3 + 5, y + 35, 8);
    normal('Payment Frequency', margin + (contentW * 2) / 3 + 5, y + 35, 8);
    bold(app.payment_plan || '_________', margin + (contentW * 2) / 3 + 5, y + 45, 9);

    y += 70;
    normal('(Premium & Fees)', margin, y, 8);
    y += 14;
    y = wrappedText(
      `PROMISE TO PAY. I promise to pay to the order of Elite Bail Bonds dba Bailbonds Financed ("Lender") on demand the sum of ${premium} bearing interest at the rate of ( ____% ) per annum from date of demand until this Note is paid in full.`,
      margin, y, contentW, 8
    );

    y += 10;
    normal('(Bond Liability)', margin, y, 8);
    y += 14;
    y = wrappedText(
      `PROMISE TO PAY. I promise to pay to the order of Elite Bail Bonds dba Bailbonds Financed ("Lender") on demand the sum of ${bondAmount} bearing interest at the rate of ( ____% ) per annum from date of demand until this Note is paid in full.`,
      margin, y, contentW, 8
    );

    y += 10;
    y = sectionHeader('GENERAL PROVISIONS', y);
    y = wrappedText(
      `1. I and all guarantors of this Note severally waive presentment for payment, protest and notice of protest and nonpayment, and agree that our liability under this Note will be on a "joint and several" basis.`,
      margin, y, contentW, 8
    );
    y = wrappedText(
      `2. The entire outstanding balance shall become due and payable immediately upon: (a) Defendant's failure to appear; (b) forfeiture of the Bond; or (c) if any payment is not received within ten days following its due date.`,
      margin, y + 4, contentW, 8
    );
    y = wrappedText(
      `3. All obligations remain in full force and are not affected by revocation of the bond or any change in court proceedings.`,
      margin, y + 4, contentW, 8
    );

    y += 10;
    bold('ADDITIONAL INTEREST.', margin, y, 8);
    y = wrappedText('If I default, Lender may increase the interest rate to 18.000% per annum until paid in full.', margin + 110, y, contentW - 110, 8);

    bold("ATTORNEYS' FEES.", margin, y + 4, 8);
    y = wrappedText("If referred to attorney for collection, I agree to pay reasonable attorneys' fees not exceeding 25.000% of unpaid debt.", margin + 100, y + 4, contentW - 100, 8);

    bold('GOVERNING LAW.', margin, y + 4, 8);
    y = wrappedText('This Note shall be governed under the laws of the State of Louisiana. Subject to the Louisiana Consumer Credit Law (La. R.S. 9:3510. et seq.).', margin + 105, y + 4, contentW - 105, 8);

    y += 20;
    bold('PRIOR TO SIGNING THIS NOTE, I READ AND UNDERSTOOD ALL THE PROVISIONS OF THIS NOTE', margin, y, 8);

    y += 30;
    if (sigs.length > 0 && sigs[0].signature_data) {
      try { doc.addImage(sigs[0].signature_data, 'PNG', margin, y - 15, 120, 30); } catch { /* skip */ }
    }
    doc.line(margin, y + 18, margin + 200, y + 18);
    normal('DEFENDANT SIGNATURE', margin, y + 28, 8);
    bold(defendantName, margin, y + 42, 9);
    normal(dateStr, margin + 160, y + 42, 9);

    // ────────────────────────────────────────────────
    // PAGE 6+: ID PHOTOS (if uploaded)
    // ────────────────────────────────────────────────
    if (docs.length > 0) {
      for (const d of docs) {
        try {
          const { data: fileData } = await supabase.storage
            .from('documents')
            .download(d.storage_path);

          if (fileData) {
            const arrayBuffer = await fileData.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            const mime = d.mime_type || 'image/jpeg';
            const imgData = `data:${mime};base64,${base64}`;

            doc.addPage();
            y = 50;
            const label = (d.doc_type as string).replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
            bold(`${label} — ${defendantName}`, margin, y, 12);
            bold(`Application: ${applicationId}`, margin, y + 16, 8);
            normal(`Uploaded: ${new Date(d.uploaded_at).toLocaleString()}`, margin, y + 28, 8);

            doc.addImage(imgData, margin, y + 45, contentW, contentW * 0.75);
          }
        } catch {
          // Photo download failed — skip this doc page
        }
      }
    }

    // Output
    const pdfBuffer = doc.output('arraybuffer');
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="bail-application-${app.defendant_last}-${app.defendant_first}.pdf"`,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'PDF generation failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
