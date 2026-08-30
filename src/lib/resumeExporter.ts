import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import { ResumeData } from '../types/resume';

/**
 * Generates an ATS-friendly text-selectable PDF document using jsPDF
 */
export function exportResumeToPDF(resume: ResumeData) {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4'
  });

  const margin = 40;
  let y = margin;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - (margin * 2);

  // Styling constants
  doc.setFont('helvetica', 'normal');

  // Helper for Section Heading
  const addSectionHeader = (title: string) => {
    y += 15;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(title.toUpperCase(), margin, y);
    y += 4;
    doc.setLineWidth(1);
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.line(margin, y, margin + contentWidth, y);
    y += 12;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
  };

  // Helper for Bullet Point
  const addBullet = (text: string) => {
    const splitLines = doc.splitTextToSize(`• ${text}`, contentWidth - 10);
    splitLines.forEach((line: string) => {
      if (y > 780) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin + 10, y);
      y += 12;
    });
  };

  // 1. Header (Name + Contact)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(resume.contact.fullName || 'Student Name', margin, y);
  y += 16;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);

  const contactParts = [
    resume.contact.email,
    resume.contact.phone,
    resume.contact.location,
    resume.contact.linkedin,
    resume.contact.github,
    resume.contact.portfolio
  ].filter(Boolean);

  const contactStr = contactParts.join('  |  ');
  const contactLines = doc.splitTextToSize(contactStr, contentWidth);
  contactLines.forEach((line: string) => {
    doc.text(line, margin, y);
    y += 12;
  });

  // 2. Summary
  if (resume.summary?.trim()) {
    addSectionHeader('Professional Summary');
    const summaryLines = doc.splitTextToSize(resume.summary.trim(), contentWidth);
    summaryLines.forEach((line: string) => {
      if (y > 780) { doc.addPage(); y = margin; }
      doc.text(line, margin, y);
      y += 12;
    });
  }

  // 3. Skills
  const allSkills: string[] = [
    resume.skills?.programmingLanguages?.length ? `Languages: ${resume.skills.programmingLanguages.join(', ')}` : '',
    resume.skills?.frameworks?.length ? `Frameworks/Libraries: ${resume.skills.frameworks.join(', ')}` : '',
    resume.skills?.databases?.length ? `Databases: ${resume.skills.databases.join(', ')}` : '',
    resume.skills?.tools?.length ? `Developer Tools: ${resume.skills.tools.join(', ')}` : '',
    resume.skills?.aiMlSkills?.length ? `AI/ML & Data Science: ${resume.skills.aiMlSkills.join(', ')}` : '',
    resume.skills?.cloudSkills?.length ? `Cloud & DevOps: ${resume.skills.cloudSkills.join(', ')}` : '',
    resume.skills?.otherSkills?.length ? `Other Competencies: ${resume.skills.otherSkills.join(', ')}` : ''
  ].filter(Boolean);

  if (allSkills.length > 0) {
    addSectionHeader('Technical Skills');
    allSkills.forEach(skillLine => {
      if (y > 780) { doc.addPage(); y = margin; }
      const lines = doc.splitTextToSize(skillLine, contentWidth);
      lines.forEach((l: string) => {
        doc.text(l, margin, y);
        y += 12;
      });
    });
  }

  // 4. Education
  if (resume.education?.college) {
    addSectionHeader('Education');
    doc.setFont('helvetica', 'bold');
    doc.text(`${resume.education.degree} in ${resume.education.department}`, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(resume.education.graduationYear ? `Expected Graduation: ${resume.education.graduationYear}` : '', margin + contentWidth - 120, y, { align: 'right' });
    y += 12;
    doc.text(`${resume.education.college}${resume.education.cgpa ? `  |  CGPA / Percentage: ${resume.education.cgpa}` : ''}`, margin, y);
    y += 14;
  }

  // 5. Projects
  if (resume.projects && resume.projects.length > 0) {
    addSectionHeader('Projects');
    resume.projects.forEach(p => {
      if (y > 760) { doc.addPage(); y = margin; }
      doc.setFont('helvetica', 'bold');
      doc.text(p.projectName, margin, y);
      doc.setFont('helvetica', 'normal');
      if (p.technologies?.length) {
        doc.text(`Tech: ${p.technologies.join(', ')}`, margin + contentWidth - 180, y, { align: 'right' });
      }
      y += 12;

      if (p.description) {
        p.description.split('\n').filter(Boolean).forEach(bullet => addBullet(bullet));
      }
      y += 4;
    });
  }

  // 6. Experience / Internships
  if (resume.experience && resume.experience.length > 0) {
    addSectionHeader('Professional Experience / Internships');
    resume.experience.forEach(exp => {
      if (y > 760) { doc.addPage(); y = margin; }
      doc.setFont('helvetica', 'bold');
      doc.text(`${exp.role}  |  ${exp.company}`, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(exp.duration || '', margin + contentWidth - 100, y, { align: 'right' });
      y += 12;

      if (exp.responsibilities) {
        exp.responsibilities.split('\n').filter(Boolean).forEach(b => addBullet(b));
      }
      y += 4;
    });
  }

  // 7. Certifications
  if (resume.certifications && resume.certifications.length > 0) {
    addSectionHeader('Certifications & Coursework');
    resume.certifications.forEach(cert => {
      if (y > 770) { doc.addPage(); y = margin; }
      const sidhTag = cert.isSidhVerified ? ' [SIDH Verified ✓]' : '';
      doc.text(`• ${cert.certificationName} — ${cert.issuingOrganization}${sidhTag} (${cert.date || 'Completed'})`, margin, y);
      y += 12;
    });
  }

  // 8. Achievements
  if (resume.achievements && resume.achievements.length > 0) {
    addSectionHeader('Key Achievements & Contests');
    resume.achievements.forEach(ach => {
      if (y > 770) { doc.addPage(); y = margin; }
      doc.text(`• ${ach.title}: ${ach.description}`, margin, y);
      y += 12;
    });
  }

  // 9. Coding Profiles
  const profiles = [
    resume.codingProfiles?.leetcode ? `LeetCode: ${resume.codingProfiles.leetcode}` : '',
    resume.codingProfiles?.codechef ? `CodeChef: ${resume.codingProfiles.codechef}` : '',
    resume.codingProfiles?.codeforces ? `Codeforces: ${resume.codingProfiles.codeforces}` : '',
    resume.codingProfiles?.hackerrank ? `HackerRank: ${resume.codingProfiles.hackerrank}` : ''
  ].filter(Boolean);

  if (profiles.length > 0) {
    addSectionHeader('Competitive Coding Profiles');
    doc.text(profiles.join('   |   '), margin, y);
  }

  const safeName = (resume.contact.fullName || 'Resume').replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`${safeName}_ATS_Resume.pdf`);
}

/**
 * Generates an ATS-friendly native Word .docx file using docx package
 */
export async function exportResumeToDOCX(resume: ResumeData) {
  const children: Paragraph[] = [];

  // Helper for Section Heading in DOCX
  const createSectionHeader = (title: string) => {
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
      border: {
        bottom: { color: 'CBD5E1', space: 1, style: BorderStyle.SINGLE, size: 6 }
      },
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          size: 22,
          color: '1E293B',
          font: 'Arial'
        })
      ]
    });
  };

  // Helper for Bullet Point in DOCX
  const createBullet = (text: string) => {
    return new Paragraph({
      bullet: { level: 0 },
      spacing: { before: 40, after: 40 },
      children: [
        new TextRun({
          text,
          size: 20,
          color: '334155',
          font: 'Arial'
        })
      ]
    });
  };

  // 1. Title
  children.push(
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: resume.contact.fullName || 'Student Name',
          bold: true,
          size: 32,
          color: '0F172A',
          font: 'Arial'
        })
      ]
    })
  );

  // Contact Info Line
  const contactParts = [
    resume.contact.email,
    resume.contact.phone,
    resume.contact.location,
    resume.contact.linkedin,
    resume.contact.github,
    resume.contact.portfolio
  ].filter(Boolean);

  children.push(
    new Paragraph({
      spacing: { after: 160 },
      children: [
        new TextRun({
          text: contactParts.join('  |  '),
          size: 18,
          color: '475569',
          font: 'Arial'
        })
      ]
    })
  );

  // 2. Summary
  if (resume.summary?.trim()) {
    children.push(createSectionHeader('Professional Summary'));
    children.push(
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: resume.summary.trim(),
            size: 20,
            color: '334155',
            font: 'Arial'
          })
        ]
      })
    );
  }

  // 3. Skills
  const allSkills: string[] = [
    resume.skills?.programmingLanguages?.length ? `Languages: ${resume.skills.programmingLanguages.join(', ')}` : '',
    resume.skills?.frameworks?.length ? `Frameworks/Libraries: ${resume.skills.frameworks.join(', ')}` : '',
    resume.skills?.databases?.length ? `Databases: ${resume.skills.databases.join(', ')}` : '',
    resume.skills?.tools?.length ? `Tools: ${resume.skills.tools.join(', ')}` : '',
    resume.skills?.aiMlSkills?.length ? `AI/ML: ${resume.skills.aiMlSkills.join(', ')}` : '',
    resume.skills?.cloudSkills?.length ? `Cloud: ${resume.skills.cloudSkills.join(', ')}` : ''
  ].filter(Boolean);

  if (allSkills.length > 0) {
    children.push(createSectionHeader('Technical Skills'));
    allSkills.forEach(sk => children.push(createBullet(sk)));
  }

  // 4. Education
  if (resume.education?.college) {
    children.push(createSectionHeader('Education'));
    children.push(
      new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({ text: `${resume.education.degree} in ${resume.education.department}`, bold: true, size: 21, color: '0F172A', font: 'Arial' })
        ]
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({ text: `${resume.education.college} | CGPA: ${resume.education.cgpa || 'N/A'} | Graduation: ${resume.education.graduationYear || '2026'}`, size: 19, color: '475569', font: 'Arial' })
        ]
      })
    );
  }

  // 5. Projects
  if (resume.projects && resume.projects.length > 0) {
    children.push(createSectionHeader('Projects'));
    resume.projects.forEach(p => {
      children.push(
        new Paragraph({
          spacing: { before: 100, after: 40 },
          children: [
            new TextRun({ text: p.projectName, bold: true, size: 21, color: '0F172A', font: 'Arial' }),
            new TextRun({ text: p.technologies?.length ? ` (${p.technologies.join(', ')})` : '', italics: true, size: 18, color: '64748B', font: 'Arial' })
          ]
        })
      );

      if (p.description) {
        p.description.split('\n').filter(Boolean).forEach(b => children.push(createBullet(b)));
      }
    });
  }

  // 6. Experience
  if (resume.experience && resume.experience.length > 0) {
    children.push(createSectionHeader('Experience / Internships'));
    resume.experience.forEach(exp => {
      children.push(
        new Paragraph({
          spacing: { before: 100, after: 40 },
          children: [
            new TextRun({ text: `${exp.role} — ${exp.company}`, bold: true, size: 21, color: '0F172A', font: 'Arial' }),
            new TextRun({ text: exp.duration ? ` [${exp.duration}]` : '', size: 18, color: '64748B', font: 'Arial' })
          ]
        })
      );
      if (exp.responsibilities) {
        exp.responsibilities.split('\n').filter(Boolean).forEach(b => children.push(createBullet(b)));
      }
    });
  }

  // 7. Certifications
  if (resume.certifications && resume.certifications.length > 0) {
    children.push(createSectionHeader('Certifications & Coursework'));
    resume.certifications.forEach(c => {
      const tag = c.isSidhVerified ? ' [SIDH Verified ✓]' : '';
      children.push(createBullet(`${c.certificationName} — ${c.issuingOrganization}${tag}`));
    });
  }

  // 8. Achievements
  if (resume.achievements && resume.achievements.length > 0) {
    children.push(createSectionHeader('Achievements'));
    resume.achievements.forEach(a => {
      children.push(createBullet(`${a.title}: ${a.description}`));
    });
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 720, right: 720, bottom: 720, left: 720 } // 0.5 in margins
        }
      },
      children
    }]
  });

  const blob = await Packer.toBlob(doc);
  const safeName = (resume.contact.fullName || 'Resume').replace(/[^a-zA-Z0-9_-]/g, '_');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeName}_ATS_Resume.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
