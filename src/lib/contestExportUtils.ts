import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { CodingContest, ContestParticipant } from '../types';

export function exportContestPdf(contest: CodingContest, participants: ContestParticipant[]) {
  const cleanTitle = (contest.title || 'Official Contest').trim();
  const pdfFileName = `${cleanTitle}.pdf`;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 36, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('SC SkillTrack AI', 14, 14);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text('Official Competitive Programming Contest Report', 14, 21);

  // Metadata Block
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);

  const startY = 44;
  doc.text(`Contest Name: ${contest.title}`, 14, startY);
  doc.text(`Platform: ${contest.platform}`, 14, startY + 5);
  doc.text(`Contest Date: ${contest.contestDate || new Date(contest.startTime).toLocaleDateString()}`, 14, startY + 10);
  doc.text(`Total Participants: ${participants.length}`, 14, startY + 15);

  // Divider Line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, startY + 19, 196, startY + 19);

  // Table
  const tableData = participants.map((p, idx) => [
    p.currentRank || p.contestRank || idx + 1,
    p.studentName || 'N/A',
    p.registerNumber || 'N/A',
    p.department || 'AI&DS',
    p.problemsSolved ?? 0,
    p.contestRank ? `#${p.contestRank}` : `#${idx + 1}`,
    p.score ?? (p.problemsSolved ? p.problemsSolved * 100 : 0),
    p.penalty || '00:00',
    p.profileUrl || p.contestUrl || '#'
  ]);

  autoTable(doc, {
    startY: startY + 22,
    head: [['Rank', 'Student Name', 'Register Number', 'Department', 'Problems Solved', 'Contest Rank', 'Score', 'Penalty', 'Profile Link']],
    body: tableData.length > 0 ? tableData : [['-', 'No verified contest submissions found.', '-', '-', '-', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      valign: 'middle'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { fontStyle: 'bold', cellWidth: 32 },
      2: { cellWidth: 26 },
      3: { cellWidth: 20 },
      4: { halign: 'center', cellWidth: 20 },
      5: { halign: 'center', cellWidth: 20 },
      6: { halign: 'center', cellWidth: 16 },
      7: { halign: 'center', cellWidth: 16 },
      8: { fontSize: 7, cellWidth: 22 }
    },
    margin: { left: 14, right: 14 }
  });

  // Footer Page Numbering
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`SC SkillTrack AI - Verified Official Contest Record | Page ${i} of ${pageCount}`, 14, 287);
  }

  doc.save(pdfFileName);
}

export function exportContestExcel(contest: CodingContest, participants: ContestParticipant[]) {
  const cleanTitle = (contest.title || 'Official Contest').trim();
  const excelFileName = `${cleanTitle}.xlsx`;

  const rows = participants.map((p) => {
    const probTitles = (p.submissions || []).map(s => `${s.problemName} (${s.verdict})`).join('; ') || 'N/A';
    const subTimes = (p.submissions || []).map(s => `${s.problemName}: ${s.submissionTime}`).join('; ') || 'N/A';

    return {
      'Contest Name': contest.title,
      'Platform': contest.platform,
      'Contest Date': contest.contestDate || new Date(contest.startTime).toLocaleDateString(),
      'Student Name': p.studentName,
      'Register Number': p.registerNumber,
      'Department': p.department || 'AI&DS',
      'Year': p.year || 'II',
      'Section': p.section || 'A',
      'Contest Rank': p.contestRank || p.currentRank || 1,
      'Problems Attempted': p.problemsAttempted ?? (p.problemsSolved ? p.problemsSolved : 0),
      'Problems Solved': p.problemsSolved ?? 0,
      'Penalty': p.penalty || '00:00',
      'Score': p.score ?? (p.problemsSolved ? p.problemsSolved * 100 : 0),
      'Problem List': probTitles,
      'Submission Time': subTimes,
      'Profile URL': p.profileUrl || '',
      'Contest URL': p.contestUrl || contest.url || ''
    };
  });

  if (rows.length === 0) {
    rows.push({
      'Contest Name': contest.title,
      'Platform': contest.platform,
      'Contest Date': contest.contestDate || new Date(contest.startTime).toLocaleDateString(),
      'Student Name': 'No verified contest submissions found.',
      'Register Number': '',
      'Department': '',
      'Year': '',
      'Section': '',
      'Contest Rank': 0,
      'Problems Attempted': 0,
      'Problems Solved': 0,
      'Penalty': '',
      'Score': 0,
      'Problem List': '',
      'Submission Time': '',
      'Profile URL': '',
      'Contest URL': contest.url || ''
    });
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Contest Results');

  XLSX.writeFile(workbook, excelFileName);
}

export function exportContestCsv(contest: CodingContest, participants: ContestParticipant[]) {
  const cleanTitle = (contest.title || 'Official Contest').trim();
  const csvFileName = `${cleanTitle}.csv`;

  const headers = [
    'Contest Name',
    'Platform',
    'Contest Date',
    'Student Name',
    'Register Number',
    'Department',
    'Year',
    'Section',
    'Contest Rank',
    'Problems Attempted',
    'Problems Solved',
    'Penalty',
    'Score',
    'Problem List',
    'Submission Time',
    'Profile URL',
    'Contest URL'
  ];

  const escapeCsv = (str: any) => {
    if (str === null || str === undefined) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const lines: string[] = [headers.map(escapeCsv).join(',')];

  if (participants.length === 0) {
    lines.push([
      escapeCsv(contest.title),
      escapeCsv(contest.platform),
      escapeCsv(contest.contestDate || new Date(contest.startTime).toLocaleDateString()),
      escapeCsv('No verified contest submissions found.'),
      '""', '""', '""', '""', '"0"', '"0"', '"0"', '""', '"0"', '""', '""', '""',
      escapeCsv(contest.url || '')
    ].join(','));
  } else {
    participants.forEach((p) => {
      const probTitles = (p.submissions || []).map(s => `${s.problemName} (${s.verdict})`).join('; ') || 'N/A';
      const subTimes = (p.submissions || []).map(s => `${s.problemName}: ${s.submissionTime}`).join('; ') || 'N/A';

      lines.push([
        escapeCsv(contest.title),
        escapeCsv(contest.platform),
        escapeCsv(contest.contestDate || new Date(contest.startTime).toLocaleDateString()),
        escapeCsv(p.studentName),
        escapeCsv(p.registerNumber),
        escapeCsv(p.department || 'AI&DS'),
        escapeCsv(p.year || 'II'),
        escapeCsv(p.section || 'A'),
        escapeCsv(p.contestRank || p.currentRank || 1),
        escapeCsv(p.problemsAttempted ?? (p.problemsSolved ? p.problemsSolved : 0)),
        escapeCsv(p.problemsSolved ?? 0),
        escapeCsv(p.penalty || '00:00'),
        escapeCsv(p.score ?? (p.problemsSolved ? p.problemsSolved * 100 : 0)),
        escapeCsv(probTitles),
        escapeCsv(subTimes),
        escapeCsv(p.profileUrl || ''),
        escapeCsv(p.contestUrl || contest.url || '')
      ].join(','));
    });
  }

  const csvString = lines.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', csvFileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
