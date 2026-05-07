import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';
import PdfPrinter from 'pdfmake';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const vfsFontsModule = require('pdfmake/build/vfs_fonts');
// pdfmake 0.2.x exports vfs directly in Node.js; 0.1.x exported { pdfMake: { vfs } }
const vfs = vfsFontsModule?.pdfMake?.vfs ?? vfsFontsModule;

const printer = new PdfPrinter({
  Roboto: {
    normal: Buffer.from(vfs['Roboto-Regular.ttf'], 'base64'),
    bold: Buffer.from(vfs['Roboto-Medium.ttf'], 'base64'),
    italics: Buffer.from(vfs['Roboto-Italic.ttf'], 'base64'),
    bolditalics: Buffer.from(vfs['Roboto-MediumItalic.ttf'], 'base64'),
  },
});

async function getImportantVariants(patientId: string, teamIds: string[]) {
  return prisma.variant.findMany({
    where: {
      patientId,
      priorities: { some: { priority: 'IMPORTANT', teamId: { in: teamIds } } },
    },
    include: {
      priorities: {
        where: { priority: 'IMPORTANT', teamId: { in: teamIds } },
        include: { setByUser: { select: { name: true } }, team: { select: { name: true } } },
      },
      notes: {
        where: { teamId: { in: teamIds } },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
}

function variantRows(variants: any[]) {
  const rows: any[][] = [];
  for (const v of variants) {
    rows.push([
      { text: v.geneName, bold: true, fontSize: 8 },
      { text: `Chr${v.chromosome}:${v.position}`, fontSize: 8 },
      { text: `${v.refAllele}>${v.altAllele}`, fontSize: 8 },
      { text: v.variantType, fontSize: 8 },
      { text: v.consequence.replace(/_/g, ' '), fontSize: 8 },
      { text: v.clinicalSignificance.replace(/_/g, ' '), fontSize: 8 },
      { text: v.caddScore?.toFixed(1) ?? '-', fontSize: 8 },
      { text: v.proteinChange ?? '-', fontSize: 8 },
    ]);
    if (v.notes.length > 0) {
      const noteText = v.notes
        .map((n: any) => `${n.user.name}: ${n.noteText}`)
        .join('\n');
      rows.push([
        {
          text: noteText,
          colSpan: 8,
          italics: true,
          color: '#555555',
          fontSize: 7,
          margin: [4, 2, 4, 2],
        },
        '', '', '', '', '', '', '',
      ]);
    }
  }
  return rows;
}

function patientSection(patient: any, variants: any[]) {
  if (!variants.length) return [];
  return [
    {
      text: `${patient.patientCode}  —  ${patient.firstName} ${patient.lastName}`,
      style: 'patientHeader',
      margin: [0, 14, 0, 4],
    },
    {
      columns: [
        { text: `Diagnosis: ${patient.diagnosis}`, fontSize: 8 },
        { text: `DOB: ${new Date(patient.dateOfBirth).toLocaleDateString()}`, fontSize: 8 },
        { text: `Gender: ${patient.gender}`, fontSize: 8 },
        { text: `Ethnicity: ${patient.ethnicity ?? 'N/A'}`, fontSize: 8 },
      ],
      margin: [0, 0, 0, 6],
    },
    {
      table: {
        headerRows: 1,
        widths: [50, 78, 44, 36, 82, 76, 28, '*'],
        body: [
          [
            { text: 'Gene', bold: true, fillColor: '#1a4a6e', color: 'white', fontSize: 8 },
            { text: 'Position', bold: true, fillColor: '#1a4a6e', color: 'white', fontSize: 8 },
            { text: 'Allele', bold: true, fillColor: '#1a4a6e', color: 'white', fontSize: 8 },
            { text: 'Type', bold: true, fillColor: '#1a4a6e', color: 'white', fontSize: 8 },
            { text: 'Consequence', bold: true, fillColor: '#1a4a6e', color: 'white', fontSize: 8 },
            { text: 'Significance', bold: true, fillColor: '#1a4a6e', color: 'white', fontSize: 8 },
            { text: 'CADD', bold: true, fillColor: '#1a4a6e', color: 'white', fontSize: 8 },
            { text: 'Protein Change', bold: true, fillColor: '#1a4a6e', color: 'white', fontSize: 8 },
          ],
          ...variantRows(variants),
        ],
      },
      layout: 'lightHorizontalLines',
    },
  ];
}

async function buildAndSendPdf(patients: any[], teamIds: string[], res: Response) {
  const content: any[] = [
    { text: 'Genomic Variant Priority Report', style: 'title' },
    {
      text: `Generated: ${new Date().toLocaleString()}   |   Important variants only`,
      fontSize: 8,
      color: '#666666',
      margin: [0, 2, 0, 16],
    },
  ];

  let hasData = false;
  for (const patient of patients) {
    const variants = await getImportantVariants(patient.id, teamIds);
    if (variants.length) {
      hasData = true;
      content.push(...patientSection(patient, variants));
    }
  }

  if (!hasData) {
    content.push({ text: 'No important variants found.', italics: true, color: '#888888' });
  }

  const doc = printer.createPdfKitDocument({
    content,
    styles: {
      title: { fontSize: 18, bold: true, color: '#1a4a6e', margin: [0, 0, 0, 2] },
      patientHeader: { fontSize: 11, bold: true, color: '#1a4a6e', decoration: 'underline' },
    },
    defaultStyle: { font: 'Roboto', fontSize: 9 },
    pageMargins: [30, 40, 30, 40],
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="variant-report.pdf"');
  doc.pipe(res);
  doc.end();
}

export async function downloadPatientPdf(req: AuthRequest, res: Response) {
  const memberships = await prisma.teamMember.findMany({ where: { userId: req.userId } });
  const teamIds = memberships.map((m) => m.teamId);

  const patient = await prisma.patient.findUnique({ where: { id: req.params.patientId } });
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  await buildAndSendPdf([patient], teamIds, res);
}

export async function downloadAllPdf(req: AuthRequest, res: Response) {
  const memberships = await prisma.teamMember.findMany({ where: { userId: req.userId } });
  const teamIds = memberships.map((m) => m.teamId);

  const owned = await prisma.patient.findMany({ where: { ownerTeamId: { in: teamIds } } });
  const shared = await prisma.patientTeam.findMany({
    where: { teamId: { in: teamIds } },
    include: { patient: true },
  });

  const map = new Map<string, any>();
  owned.forEach((p) => map.set(p.id, p));
  shared.forEach((s) => map.set(s.patientId, s.patient));

  await buildAndSendPdf([...map.values()], teamIds, res);
}
