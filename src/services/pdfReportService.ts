import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface Poll {
  id: string;
  title: string;
  question: string;
  options: string[];
  deadline: string;
  targetDepartment: string;
  targetYear: string;
  targetSection: string;
  status: 'Active' | 'Closed';
  createdAt?: string;
}

export interface TrackingData {
  poll: Poll;
  stats: {
    totalStudents: number;
    respondedCount: number;
    pendingCount: number;
    participationRate: number;
  };
  respondedStudents: any[];
  pendingStudents: any[];
  optionsStats: Record<string, number>;
  responses?: {
    studentRollNumber: string;
    selectedOptions: string[];
    respondedAt: string;
  }[];
}

/**
 * PDF Generation Service for SC Smart Poll
 * Generates polished, institutional-grade PDF reports with metrics, charts,
 * tables, AI insights, and non-responder registers.
 */

// Helper to draw clean header banner
function drawHeader(doc: jsPDF, title: string, subtitle: string, isDefaulter = false) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Banner background
  if (isDefaulter) {
    doc.setFillColor(153, 27, 27); // Dark red banner
  } else {
    doc.setFillColor(15, 23, 42); // Dark slate banner
  }
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Gold accent bar
  doc.setFillColor(217, 119, 6);
  doc.rect(0, 28, pageWidth, 2, 'F');

  // Title text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('SC SMART POLL ACADEMIC SYSTEM', 14, 12);

  // Subtitle / Report Type
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  doc.text(title.toUpperCase(), 14, 20);

  // Date top right
  const dateStr = `Generated: ${new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })}`;
  doc.setFontSize(8);
  doc.text(dateStr, pageWidth - 14, 12, { align: 'right' });
  doc.text(subtitle, pageWidth - 14, 20, { align: 'right' });
}

// Helper to add page numbers and footer
function addFooter(doc: jsPDF) {
  const pageCount = (doc as any).internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);

    doc.text('SC TECH Academic Poll Analytics & Governance System', 14, pageHeight - 6);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 6, { align: 'right' });
  }
}

/**
 * 1. Download Full Comprehensive Poll Results Report (All metrics, option distribution, responses, non-responders)
 */
export function downloadFullPollReportPDF(data: TrackingData, aiSummary?: string) {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 36;

  // Header
  drawHeader(doc, 'COMPREHENSIVE POLL RESULTS REPORT', `Poll ID: ${data.poll.id.substring(0, 8)}`);

  // Section 1: Poll Overview Metadata Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y, pageWidth - 28, 32, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(data.poll.title, 18, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  const questionLines = doc.splitTextToSize(`Question: ${data.poll.question}`, pageWidth - 36);
  doc.text(questionLines, 18, y + 14);

  const targetStr = `Target Group: Dept ${data.poll.targetDepartment} | Year ${data.poll.targetYear} | Section ${data.poll.targetSection}  |  Status: ${data.poll.status}`;
  doc.text(targetStr, 18, y + 22);

  const deadlineStr = `Deadline: ${data.poll.deadline}`;
  doc.text(deadlineStr, 18, y + 27);

  y += 38;

  // Section 2: Key Metrics Grid
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('EXECUTIVE PARTICIPATION METRICS', 14, y);
  y += 4;

  const cardWidth = (pageWidth - 28 - 9) / 4;
  const metrics = [
    { label: 'TOTAL STUDENTS', value: `${data.stats.totalStudents}`, color: [30, 41, 59] },
    { label: 'RESPONDED', value: `${data.stats.respondedCount}`, color: [5, 150, 105] },
    { label: 'PENDING', value: `${data.stats.pendingCount}`, color: [217, 119, 6] },
    { label: 'PARTICIPATION', value: `${data.stats.participationRate}%`, color: [124, 58, 237] },
  ];

  metrics.forEach((m, idx) => {
    const cx = 14 + idx * (cardWidth + 3);
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cx, y, cardWidth, 18, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(m.label, cx + cardWidth / 2, y + 6, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(m.color[0], m.color[1], m.color[2]);
    doc.text(m.value, cx + cardWidth / 2, y + 14, { align: 'center' });
  });

  y += 24;

  // Section 3: Option Distribution Table & Visualization
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('OPTION DISTRIBUTION BREAKDOWN', 14, y);
  y += 4;

  let maxVotes = 0;
  let topOption = '';

  const distributionRows = data.poll.options.map((opt) => {
    const votes = data.optionsStats[opt] || 0;
    if (votes > maxVotes) {
      maxVotes = votes;
      topOption = opt;
    }
    const percent =
      data.stats.respondedCount > 0
        ? Math.round((votes / data.stats.respondedCount) * 100)
        : 0;

    // Visual bar in text representation
    const barLength = Math.round(percent / 5);
    const visualBar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);

    return [opt, `${votes} vote(s)`, `${percent}%`, visualBar];
  });

  autoTable(doc, {
    startY: y,
    head: [['Option Choice', 'Vote Count', 'Percentage', 'Visual Distribution']],
    body: distributionRows,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 70, fontStyle: 'bold' },
      1: { cellWidth: 25, halign: 'right' },
      2: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
      3: { cellWidth: 50, font: 'courier' },
    },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Top selection callout badge
  if (topOption && maxVotes > 0) {
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(167, 243, 208);
    doc.roundedRect(14, y, pageWidth - 28, 10, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(6, 95, 70);
    doc.text(
      `Highest Voted Choice: "${topOption}" with ${maxVotes} votes (${Math.round(
        (maxVotes / (data.stats.respondedCount || 1)) * 100
      )}% share)`,
      18,
      y + 6.5
    );

    y += 14;
  }

  // Section 4: AI Insights (if available)
  if (aiSummary) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('GEMINI AI SMART ANALYTICS & INSIGHTS', 14, y);
    y += 4;

    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(191, 219, 254);

    const summaryTextLines = doc.splitTextToSize(aiSummary, pageWidth - 36);
    const boxHeight = summaryTextLines.length * 4.5 + 8;

    doc.roundedRect(14, y, pageWidth - 28, boxHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 58, 138);
    doc.text(summaryTextLines, 18, y + 6);

    y += boxHeight + 8;
  }

  // Section 5: Responded Students Log
  if (data.respondedStudents && data.respondedStudents.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);

    // Check if space needed for header & table
    if (y > 230) {
      doc.addPage();
      y = 36;
      drawHeader(doc, 'RESPONDED STUDENTS REGISTER', `Poll ID: ${data.poll.id.substring(0, 8)}`);
    }

    doc.text(`RESPONDED STUDENTS LOG (${data.respondedStudents.length} Students)`, 14, y);
    y += 4;

    const respondedRows = data.respondedStudents.map((st, idx) => {
      const resp = data.responses?.find((r) => r.studentRollNumber === st.rollNumber);
      const chosenText = resp ? resp.selectedOptions.join(', ') : 'Responded';
      const timeText = resp && resp.respondedAt ? new Date(resp.respondedAt).toLocaleDateString() : '-';

      return [
        `${idx + 1}`,
        st.rollNumber,
        st.studentName,
        `${st.department || ''}-${st.section || ''}`,
        chosenText,
        timeText,
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [['S.No', 'Roll No', 'Student Name', 'Dept-Sec', 'Selected Response', 'Date']],
      body: respondedRows,
      theme: 'grid',
      headStyles: {
        fillColor: [5, 150, 105],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [51, 65, 85],
      },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 28, fontStyle: 'bold' },
        2: { cellWidth: 45 },
        3: { cellWidth: 22, halign: 'center' },
        4: { cellWidth: 50, fontStyle: 'bold' },
        5: { cellWidth: 25, halign: 'center' },
      },
      margin: { left: 14, right: 14 },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Section 6: Non-Responders Register
  if (data.pendingStudents && data.pendingStudents.length > 0) {
    if (y > 230) {
      doc.addPage();
      y = 36;
      drawHeader(doc, 'NON RESPONDERS DEFAULTERS LIST', `Poll ID: ${data.poll.id.substring(0, 8)}`);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(180, 83, 9);
    doc.text(`NON-RESPONDERS PENDING DEFAULTERS LIST (${data.pendingStudents.length} Students)`, 14, y);
    y += 4;

    const pendingRows = data.pendingStudents.map((st, idx) => [
      `${idx + 1}`,
      st.rollNumber,
      st.registerNumber || '-',
      st.studentName,
      `${st.department || ''}-${st.section || ''}`,
      st.email || '-',
      st.phoneNumber || '-',
      'PENDING',
    ]);

    autoTable(doc, {
      startY: y,
      head: [['S.No', 'Roll No', 'Reg No', 'Student Name', 'Dept-Sec', 'Email', 'Phone', 'Status']],
      body: pendingRows,
      theme: 'striped',
      headStyles: {
        fillColor: [217, 119, 6],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [51, 65, 85],
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 25, fontStyle: 'bold' },
        2: { cellWidth: 25 },
        3: { cellWidth: 40 },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 35 },
        6: { cellWidth: 22 },
        7: { cellWidth: 18, fontStyle: 'bold', textColor: [180, 83, 9] },
      },
      margin: { left: 14, right: 14 },
    });
  }

  addFooter(doc);

  const filename = `SC_Smart_Poll_${data.poll.title.replace(/[^a-zA-Z0-9]/g, '_')}_Report.pdf`;
  doc.save(filename);
}

/**
 * 2. Download Executive Summary PDF Report
 */
export function downloadExecutiveSummaryPDF(data: TrackingData, aiSummary?: string) {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 36;

  drawHeader(doc, 'EXECUTIVE SUMMARY REPORT', `Target: ${data.poll.targetDepartment}`);

  // Title Box
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y, pageWidth - 28, 26, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(data.poll.title, 18, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Question: ${data.poll.question}`, 18, y + 15);
  doc.text(
    `Target: Dept ${data.poll.targetDepartment}, Year ${data.poll.targetYear}, Sec ${data.poll.targetSection}  |  Deadline: ${data.poll.deadline}`,
    18,
    y + 21
  );

  y += 32;

  // Key Metrics
  const cardWidth = (pageWidth - 28 - 9) / 4;
  const metrics = [
    { label: 'TOTAL STUDENTS', value: `${data.stats.totalStudents}`, color: [30, 41, 59] },
    { label: 'RESPONDED', value: `${data.stats.respondedCount}`, color: [5, 150, 105] },
    { label: 'PENDING', value: `${data.stats.pendingCount}`, color: [217, 119, 6] },
    { label: 'PARTICIPATION RATE', value: `${data.stats.participationRate}%`, color: [124, 58, 237] },
  ];

  metrics.forEach((m, idx) => {
    const cx = 14 + idx * (cardWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cx, y, cardWidth, 20, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(m.label, cx + cardWidth / 2, y + 7, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(m.color[0], m.color[1], m.color[2]);
    doc.text(m.value, cx + cardWidth / 2, y + 15, { align: 'center' });
  });

  y += 26;

  // Option Distribution Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('VOTING RESULTS BREAKDOWN', 14, y);
  y += 4;

  const distributionRows = data.poll.options.map((opt) => {
    const votes = data.optionsStats[opt] || 0;
    const percent =
      data.stats.respondedCount > 0
        ? Math.round((votes / data.stats.respondedCount) * 100)
        : 0;

    return [opt, `${votes}`, `${percent}%`];
  });

  autoTable(doc, {
    startY: y,
    head: [['Option Choice', 'Votes Received', 'Percentage Share']],
    body: distributionRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'right' },
      2: { halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // AI Summary Card
  if (aiSummary) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('AI EXECUTIVE ANALYTICAL SUMMARY', 14, y);
    y += 4;

    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(191, 219, 254);

    const summaryTextLines = doc.splitTextToSize(aiSummary, pageWidth - 36);
    const boxHeight = summaryTextLines.length * 4.5 + 8;

    doc.roundedRect(14, y, pageWidth - 28, boxHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 58, 138);
    doc.text(summaryTextLines, 18, y + 6);
  }

  addFooter(doc);

  const filename = `SC_Smart_Poll_${data.poll.title.replace(/[^a-zA-Z0-9]/g, '_')}_Exec_Summary.pdf`;
  doc.save(filename);
}

/**
 * 3. Download Non-Responders Defaulters PDF Report
 */
export function downloadNonRespondersPDF(data: TrackingData) {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 36;

  drawHeader(doc, 'NON-RESPONDER DEFAULTERS REGISTER', 'ACTION REQUIRED', true);

  // Warning Header Box
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(252, 165, 165);
  doc.roundedRect(14, y, pageWidth - 28, 24, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(153, 27, 27);
  doc.text(`Poll Title: ${data.poll.title}`, 18, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(127, 29, 29);
  doc.text(
    `Target: Dept ${data.poll.targetDepartment}, Year ${data.poll.targetYear}, Sec ${data.poll.targetSection}  |  Deadline: ${data.poll.deadline}`,
    18,
    y + 13
  );

  doc.setFont('helvetica', 'bold');
  doc.text(
    `Total Defaulters: ${data.pendingStudents.length} Students Pending out of ${data.stats.totalStudents} total students`,
    18,
    y + 19
  );

  y += 30;

  // Defaulters Table
  const pendingRows = (data.pendingStudents || []).map((st, idx) => [
    `${idx + 1}`,
    st.rollNumber,
    st.registerNumber || '-',
    st.studentName,
    st.department || '-',
    st.section || '-',
    st.phoneNumber || '-',
    'PENDING',
  ]);

  autoTable(doc, {
    startY: y,
    head: [['S.No', 'Roll No', 'Reg No', 'Student Name', 'Dept', 'Sec', 'Phone', 'Status']],
    body: pendingRows,
    theme: 'striped',
    headStyles: {
      fillColor: [153, 27, 27],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 28, fontStyle: 'bold' },
      2: { cellWidth: 28 },
      3: { cellWidth: 45, fontStyle: 'bold' },
      4: { cellWidth: 16, halign: 'center' },
      5: { cellWidth: 14, halign: 'center' },
      6: { cellWidth: 25 },
      7: { cellWidth: 18, fontStyle: 'bold', textColor: [180, 83, 9] },
    },
    margin: { left: 14, right: 14 },
  });

  addFooter(doc);

  const filename = `SC_Smart_Poll_${data.poll.title.replace(/[^a-zA-Z0-9]/g, '_')}_Defaulters_List.pdf`;
  doc.save(filename);
}
