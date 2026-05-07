import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.count();
  if (existing > 0) {
    console.log('Seed already run. Skipping.');
    return;
  }

  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  // ── Users ────────────────────────────────────────────────────────────────
  const [u1, u2, u3, u4, u5, u6, u7, u8] = await Promise.all([
    prisma.user.create({ data: { username: 'dr.chen', name: 'Dr. Sarah Chen', email: 'sarah.chen@genomic.lab', passwordHash: hash('password123') } }),
    prisma.user.create({ data: { username: 'dr.park', name: 'Dr. James Park', email: 'james.park@genomic.lab', passwordHash: hash('password123') } }),
    prisma.user.create({ data: { username: 'nurse.davis', name: 'Emily Davis', email: 'emily.davis@genomic.lab', passwordHash: hash('password123') } }),
    prisma.user.create({ data: { username: 'dr.torres', name: 'Dr. Michael Torres', email: 'michael.torres@genomic.lab', passwordHash: hash('password123') } }),
    prisma.user.create({ data: { username: 'dr.wong', name: 'Dr. Lisa Wong', email: 'lisa.wong@genomic.lab', passwordHash: hash('password123') } }),
    prisma.user.create({ data: { username: 'dr.adams', name: 'Dr. Robert Adams', email: 'robert.adams@genomic.lab', passwordHash: hash('password123') } }),
    prisma.user.create({ data: { username: 'dr.liu', name: 'Dr. Amy Liu', email: 'amy.liu@genomic.lab', passwordHash: hash('password123') } }),
    prisma.user.create({ data: { username: 'nurse.brown', name: 'Kevin Brown', email: 'kevin.brown@genomic.lab', passwordHash: hash('password123') } }),
  ]);

  // ── Teams ─────────────────────────────────────────────────────────────────
  const [oncTeam, rdTeam, cardTeam] = await Promise.all([
    prisma.team.create({ data: { name: 'Oncology', description: 'Cancer genomics and somatic variant analysis', ownerUserId: u1.id } }),
    prisma.team.create({ data: { name: 'Rare Disease', description: 'Rare and undiagnosed disease genomics', ownerUserId: u4.id } }),
    prisma.team.create({ data: { name: 'Cardiology', description: 'Inherited cardiac conditions genomics', ownerUserId: u6.id } }),
  ]);

  // ── Team memberships ──────────────────────────────────────────────────────
  await prisma.teamMember.createMany({
    data: [
      { teamId: oncTeam.id, userId: u1.id, role: 'ADMIN' },
      { teamId: oncTeam.id, userId: u2.id, role: 'EDITOR' },
      { teamId: oncTeam.id, userId: u3.id, role: 'VIEWER' },
      { teamId: oncTeam.id, userId: u5.id, role: 'VIEWER' },   // dr.wong also in onco
      { teamId: rdTeam.id, userId: u4.id, role: 'ADMIN' },
      { teamId: rdTeam.id, userId: u5.id, role: 'EDITOR' },
      { teamId: rdTeam.id, userId: u8.id, role: 'VIEWER' },
      { teamId: cardTeam.id, userId: u6.id, role: 'ADMIN' },
      { teamId: cardTeam.id, userId: u7.id, role: 'EDITOR' },
      { teamId: cardTeam.id, userId: u2.id, role: 'VIEWER' },  // dr.park also in cardio
    ],
  });

  // ── Patients ──────────────────────────────────────────────────────────────
  const patientData = [
    { patientCode: 'PAT-2024-001', firstName: 'Emma',    lastName: 'Wilson',   dob: '1978-03-14', gender: 'Female', ethnicity: 'European',        diagnosis: 'Breast Cancer (HER2+)',        teamId: oncTeam.id },
    { patientCode: 'PAT-2024-002', firstName: 'James',   lastName: 'Chen',     dob: '1965-07-22', gender: 'Male',   ethnicity: 'East Asian',       diagnosis: 'Colorectal Adenocarcinoma',    teamId: oncTeam.id },
    { patientCode: 'PAT-2024-003', firstName: 'Sarah',   lastName: 'Johnson',  dob: '1982-11-05', gender: 'Female', ethnicity: 'African American', diagnosis: 'Non-Small Cell Lung Cancer',   teamId: oncTeam.id },
    { patientCode: 'PAT-2024-004', firstName: 'Michael', lastName: 'Brown',    dob: '1955-01-30', gender: 'Male',   ethnicity: 'European',         diagnosis: 'Hypertrophic Cardiomyopathy',  teamId: cardTeam.id },
    { patientCode: 'PAT-2024-005', firstName: 'Lisa',    lastName: 'Garcia',   dob: '1990-08-17', gender: 'Female', ethnicity: 'Hispanic',         diagnosis: 'Marfan Syndrome',              teamId: rdTeam.id },
    { patientCode: 'PAT-2024-006', firstName: 'David',   lastName: 'Kim',      dob: '1973-04-09', gender: 'Male',   ethnicity: 'East Asian',       diagnosis: 'Cutaneous Melanoma',           teamId: oncTeam.id },
    { patientCode: 'PAT-2024-007', firstName: 'Anna',    lastName: 'Martinez', dob: '1969-12-28', gender: 'Female', ethnicity: 'Hispanic',         diagnosis: 'Lynch Syndrome',               teamId: rdTeam.id },
    { patientCode: 'PAT-2024-008', firstName: 'Robert',  lastName: 'Taylor',   dob: '1961-06-03', gender: 'Male',   ethnicity: 'European',         diagnosis: 'Papillary Thyroid Carcinoma',  teamId: oncTeam.id },
    { patientCode: 'PAT-2024-009', firstName: 'Jennifer',lastName: 'Lee',      dob: '1985-09-19', gender: 'Female', ethnicity: 'East Asian',       diagnosis: 'Li-Fraumeni Syndrome',         teamId: rdTeam.id },
    { patientCode: 'PAT-2024-010', firstName: 'Thomas',  lastName: 'Anderson', dob: '1977-02-11', gender: 'Male',   ethnicity: 'European',         diagnosis: 'Neurofibromatosis Type 1',     teamId: rdTeam.id },
  ];

  const patients = await Promise.all(
    patientData.map(p =>
      prisma.patient.create({
        data: {
          patientCode: p.patientCode,
          firstName: p.firstName,
          lastName: p.lastName,
          dateOfBirth: new Date(p.dob),
          gender: p.gender,
          ethnicity: p.ethnicity,
          diagnosis: p.diagnosis,
          ownerTeamId: p.teamId,
        },
      })
    )
  );

  // Shared patients (oncology patients shared with RD for cross-study)
  await prisma.patientTeam.createMany({
    data: [
      { patientId: patients[6].id, teamId: oncTeam.id },  // PAT-007 Lynch shared with Onco
      { patientId: patients[8].id, teamId: oncTeam.id },  // PAT-009 Li-Fraumeni shared with Onco
    ],
  });

  // ── Studies ───────────────────────────────────────────────────────────────
  const studyDefs = [
    // PAT-001 Emma Wilson (Breast Cancer)
    { pid: 0, name: 'WGS Primary Tumor 2023', type: 'WGS' as const, platform: 'Illumina NovaSeq 6000', date: '2023-02-10', status: 'COMPLETED' as const },
    { pid: 0, name: 'WES Germline Panel', type: 'WES' as const, platform: 'Illumina NextSeq 550', date: '2023-03-15', status: 'COMPLETED' as const },
    // PAT-002 James Chen (Colorectal)
    { pid: 1, name: 'WGS Tumor-Normal Pair', type: 'WGS' as const, platform: 'Illumina NovaSeq X', date: '2023-05-20', status: 'COMPLETED' as const },
    { pid: 1, name: 'RNA-Seq Transcriptome', type: 'RNA' as const, platform: 'Illumina NovaSeq 6000', date: '2023-06-01', status: 'COMPLETED' as const },
    // PAT-003 Sarah Johnson (Lung)
    { pid: 2, name: 'WES Somatic Panel', type: 'WES' as const, platform: 'Illumina NextSeq 2000', date: '2023-07-12', status: 'COMPLETED' as const },
    { pid: 2, name: 'ctDNA Liquid Biopsy', type: 'PANEL' as const, platform: 'Guardant360', date: '2023-09-05', status: 'COMPLETED' as const },
    // PAT-004 Michael Brown (Cardio)
    { pid: 3, name: 'Cardiac Gene Panel v3', type: 'PANEL' as const, platform: 'ThermoFisher Ion Torrent', date: '2022-11-08', status: 'COMPLETED' as const },
    { pid: 3, name: 'WES Trio Analysis', type: 'WES' as const, platform: 'Illumina NovaSeq 6000', date: '2023-01-20', status: 'COMPLETED' as const },
    // PAT-005 Lisa Garcia (Marfan)
    { pid: 4, name: 'Connective Tissue Panel', type: 'PANEL' as const, platform: 'Illumina MiSeq', date: '2023-04-03', status: 'COMPLETED' as const },
    // PAT-006 David Kim (Melanoma)
    { pid: 5, name: 'WGS Metastatic Tumor', type: 'WGS' as const, platform: 'Illumina NovaSeq X Plus', date: '2023-08-14', status: 'COMPLETED' as const },
    { pid: 5, name: 'TMB/MSI Panel', type: 'PANEL' as const, platform: 'Foundation Medicine', date: '2023-08-20', status: 'COMPLETED' as const },
    // PAT-007 Anna Martinez (Lynch)
    { pid: 6, name: 'MMR Gene Panel', type: 'PANEL' as const, platform: 'Illumina MiSeq', date: '2022-10-15', status: 'COMPLETED' as const },
    { pid: 6, name: 'WES Germline', type: 'WES' as const, platform: 'Illumina NextSeq 550', date: '2023-02-28', status: 'COMPLETED' as const },
    // PAT-008 Robert Taylor (Thyroid)
    { pid: 7, name: 'Thyroid Onco Panel', type: 'PANEL' as const, platform: 'ThermoFisher Oncomine', date: '2023-03-07', status: 'COMPLETED' as const },
    { pid: 7, name: 'WGS Follow-up', type: 'WGS' as const, platform: 'Illumina NovaSeq 6000', date: '2023-10-12', status: 'IN_PROGRESS' as const },
    // PAT-009 Jennifer Lee (Li-Fraumeni)
    { pid: 8, name: 'WGS Germline Comprehensive', type: 'WGS' as const, platform: 'Illumina NovaSeq X', date: '2023-06-22', status: 'COMPLETED' as const },
    { pid: 8, name: 'RNA Expression Panel', type: 'RNA' as const, platform: 'Illumina NovaSeq 6000', date: '2023-07-30', status: 'COMPLETED' as const },
    // PAT-010 Thomas Anderson (NF1)
    { pid: 9, name: 'NF1 Comprehensive Panel', type: 'PANEL' as const, platform: 'Illumina NextSeq 2000', date: '2023-05-15', status: 'COMPLETED' as const },
    { pid: 9, name: 'WES Confirmatory', type: 'WES' as const, platform: 'Illumina NextSeq 550', date: '2023-09-18', status: 'COMPLETED' as const },
  ];

  const studies = await Promise.all(
    studyDefs.map(s =>
      prisma.study.create({
        data: {
          patientId: patients[s.pid].id,
          studyName: s.name,
          studyType: s.type,
          sequencingPlatform: s.platform,
          dateConducted: new Date(s.date),
          status: s.status,
        },
      })
    )
  );

  // ── Variants ──────────────────────────────────────────────────────────────
  type VDef = {
    pid: number; sid: number;
    chr: string; pos: number; ref: string; alt: string;
    gene: string; rsId?: string;
    type: 'SNV' | 'INDEL' | 'CNV' | 'SV';
    zyg: 'HETEROZYGOUS' | 'HOMOZYGOUS' | 'HEMIZYGOUS';
    af: number; cadd: number;
    sig: 'PATHOGENIC' | 'LIKELY_PATHOGENIC' | 'VUS' | 'LIKELY_BENIGN' | 'BENIGN';
    cons: string; prot?: string; hgvsc?: string; gnomad: number;
    sift?: string; pph?: string;
  };

  const variantDefs: VDef[] = [
    // PAT-001 Emma Wilson — BRCA1/BRCA2/TP53
    { pid:0, sid:0, chr:'17', pos:41245466, ref:'A', alt:'G', gene:'BRCA1', rsId:'rs80356868', type:'SNV', zyg:'HETEROZYGOUS', af:0.0003, cadd:28.4, sig:'PATHOGENIC', cons:'missense_variant', prot:'p.Arg1699Trp', hgvsc:'c.5095C>T', gnomad:0.000003, sift:'deleterious', pph:'probably_damaging' },
    { pid:0, sid:0, chr:'17', pos:41209079, ref:'G', alt:'T', gene:'BRCA1', rsId:'rs28897696', type:'SNV', zyg:'HETEROZYGOUS', af:0.0001, cadd:32.1, sig:'PATHOGENIC', cons:'stop_gained', prot:'p.Gln1779Ter', hgvsc:'c.5335C>T', gnomad:0.000001, sift:'deleterious', pph:'probably_damaging' },
    { pid:0, sid:1, chr:'13', pos:32913055, ref:'C', alt:'T', gene:'BRCA2', rsId:'rs80359550', type:'SNV', zyg:'HETEROZYGOUS', af:0.0002, cadd:24.6, sig:'LIKELY_PATHOGENIC', cons:'missense_variant', prot:'p.Asp2723His', hgvsc:'c.8167G>C', gnomad:0.000012, sift:'deleterious', pph:'possibly_damaging' },
    { pid:0, sid:0, chr:'17', pos:7675088,  ref:'C', alt:'T', gene:'TP53',  rsId:'rs28934578', type:'SNV', zyg:'HETEROZYGOUS', af:0.0005, cadd:35.0, sig:'PATHOGENIC', cons:'missense_variant', prot:'p.Arg248Trp', hgvsc:'c.742C>T', gnomad:0.000005, sift:'deleterious', pph:'probably_damaging' },
    { pid:0, sid:1, chr:'17', pos:41243511, ref:'ATTT', alt:'A', gene:'BRCA1', type:'INDEL', zyg:'HETEROZYGOUS', af:0.0001, cadd:22.3, sig:'VUS', cons:'frameshift_variant', prot:'p.Asn1102fs', hgvsc:'c.3303delAAA', gnomad:0.000002, sift:undefined, pph:undefined },
    { pid:0, sid:0, chr:'17', pos:41246502, ref:'G', alt:'A', gene:'BRCA1', rsId:'rs397507247', type:'SNV', zyg:'HETEROZYGOUS', af:0.0008, cadd:18.2, sig:'LIKELY_BENIGN', cons:'synonymous_variant', prot:'p.Ser1040=', hgvsc:'c.3120C>T', gnomad:0.00045, sift:'tolerated', pph:'benign' },
    { pid:0, sid:1, chr:'13', pos:32972626, ref:'T', alt:'A', gene:'BRCA2', rsId:'rs11571833', type:'SNV', zyg:'HETEROZYGOUS', af:0.002, cadd:12.1, sig:'BENIGN', cons:'intron_variant', prot:undefined, hgvsc:'c.9976-11T>A', gnomad:0.0024, sift:'tolerated', pph:'benign' },
    { pid:0, sid:0, chr:'17', pos:7674872, ref:'G', alt:'C', gene:'TP53', rsId:'rs1042522', type:'SNV', zyg:'HOMOZYGOUS', af:0.45, cadd:9.8, sig:'BENIGN', cons:'missense_variant', prot:'p.Pro72Arg', hgvsc:'c.215C>G', gnomad:0.45, sift:'tolerated', pph:'benign' },

    // PAT-002 James Chen — APC/MLH1/KRAS
    { pid:1, sid:2, chr:'5',  pos:112175770, ref:'G', alt:'T', gene:'APC',  rsId:'rs587782511', type:'SNV', zyg:'HETEROZYGOUS', af:0.0001, cadd:38.0, sig:'PATHOGENIC', cons:'stop_gained', prot:'p.Arg1450Ter', hgvsc:'c.4348C>T', gnomad:0.0000008, sift:'deleterious', pph:'probably_damaging' },
    { pid:1, sid:2, chr:'3',  pos:37034946,  ref:'G', alt:'A', gene:'MLH1', rsId:'rs63750931',  type:'SNV', zyg:'HETEROZYGOUS', af:0.0002, cadd:29.5, sig:'PATHOGENIC', cons:'missense_variant', prot:'p.Arg217Cys', hgvsc:'c.649C>T', gnomad:0.000003, sift:'deleterious', pph:'probably_damaging' },
    { pid:1, sid:2, chr:'12', pos:25398284,  ref:'C', alt:'T', gene:'KRAS', rsId:'rs121913529',  type:'SNV', zyg:'HETEROZYGOUS', af:0.0003, cadd:26.8, sig:'PATHOGENIC', cons:'missense_variant', prot:'p.Gly12Asp', hgvsc:'c.35G>A', gnomad:0.0000012, sift:'deleterious', pph:'probably_damaging' },
    { pid:1, sid:3, chr:'5',  pos:112177822, ref:'GA', alt:'G', gene:'APC', type:'INDEL', zyg:'HETEROZYGOUS', af:0.0001, cadd:25.1, sig:'LIKELY_PATHOGENIC', cons:'frameshift_variant', prot:'p.Ile1503fs', hgvsc:'c.4508delA', gnomad:0.0000004, sift:undefined, pph:undefined },
    { pid:1, sid:2, chr:'3',  pos:37038134,  ref:'A', alt:'G', gene:'MLH1', rsId:'rs63750447',  type:'SNV', zyg:'HETEROZYGOUS', af:0.0004, cadd:18.7, sig:'VUS', cons:'missense_variant', prot:'p.Ile219Val', hgvsc:'c.655A>G', gnomad:0.000015, sift:'deleterious', pph:'possibly_damaging' },
    { pid:1, sid:2, chr:'18', pos:48604791,  ref:'G', alt:'A', gene:'SMAD4', rsId:'rs35350990', type:'SNV', zyg:'HETEROZYGOUS', af:0.0003, cadd:33.2, sig:'LIKELY_PATHOGENIC', cons:'missense_variant', prot:'p.Arg361Cys', hgvsc:'c.1081C>T', gnomad:0.000008, sift:'deleterious', pph:'probably_damaging' },
    { pid:1, sid:3, chr:'12', pos:25398285,  ref:'C', alt:'A', gene:'KRAS', rsId:'rs121913530',  type:'SNV', zyg:'HETEROZYGOUS', af:0.0002, cadd:24.3, sig:'LIKELY_PATHOGENIC', cons:'missense_variant', prot:'p.Gly12Val', hgvsc:'c.35G>T', gnomad:0.0000009, sift:'deleterious', pph:'probably_damaging' },
    { pid:1, sid:2, chr:'10', pos:89711697,  ref:'C', alt:'T', gene:'PTEN', rsId:'rs121909215',  type:'SNV', zyg:'HETEROZYGOUS', af:0.0001, cadd:28.9, sig:'LIKELY_PATHOGENIC', cons:'missense_variant', prot:'p.Arg173Cys', hgvsc:'c.517C>T', gnomad:0.000002, sift:'deleterious', pph:'probably_damaging' },

    // PAT-003 Sarah Johnson — EGFR/KRAS/STK11
    { pid:2, sid:4, chr:'7',  pos:55181378, ref:'G', alt:'A', gene:'EGFR', rsId:'rs121913375', type:'SNV', zyg:'HETEROZYGOUS', af:0.0003, cadd:31.0, sig:'PATHOGENIC', cons:'missense_variant', prot:'p.Leu858Arg', hgvsc:'c.2573T>G', gnomad:0.0000015, sift:'deleterious', pph:'probably_damaging' },
    { pid:2, sid:4, chr:'7',  pos:55242466, ref:'AATTAAGAGAAGCAACATCTCC', alt:'A', gene:'EGFR', type:'INDEL', zyg:'HETEROZYGOUS', af:0.0002, cadd:27.5, sig:'PATHOGENIC', cons:'inframe_deletion', prot:'p.Glu746_Ala750del', hgvsc:'c.2235_2249del15', gnomad:0.0000005, sift:undefined, pph:undefined },
    { pid:2, sid:5, chr:'19', pos:10484793, ref:'C', alt:'T', gene:'STK11', rsId:'rs121434592', type:'SNV', zyg:'HETEROZYGOUS', af:0.0001, cadd:34.5, sig:'PATHOGENIC', cons:'stop_gained', prot:'p.Gln37Ter', hgvsc:'c.109C>T', gnomad:0.000001, sift:'deleterious', pph:'probably_damaging' },
    { pid:2, sid:4, chr:'12', pos:25398281,  ref:'C', alt:'G', gene:'KRAS', rsId:'rs121913527', type:'SNV', zyg:'HETEROZYGOUS', af:0.0002, cadd:29.1, sig:'PATHOGENIC', cons:'missense_variant', prot:'p.Gly12Ala', hgvsc:'c.35G>C', gnomad:0.000001, sift:'deleterious', pph:'probably_damaging' },
    { pid:2, sid:4, chr:'3',  pos:178936082, ref:'G', alt:'A', gene:'PIK3CA', rsId:'rs121913273', type:'SNV', zyg:'HETEROZYGOUS', af:0.0004, cadd:26.4, sig:'LIKELY_PATHOGENIC', cons:'missense_variant', prot:'p.His1047Arg', hgvsc:'c.3140A>G', gnomad:0.0000013, sift:'deleterious', pph:'possibly_damaging' },
    { pid:2, sid:5, chr:'7',  pos:55196964, ref:'G', alt:'A', gene:'EGFR', rsId:'rs121913365', type:'SNV', zyg:'HETEROZYGOUS', af:0.0003, cadd:22.8, sig:'VUS', cons:'missense_variant', prot:'p.Ala289Val', hgvsc:'c.866C>T', gnomad:0.000018, sift:'deleterious', pph:'possibly_damaging' },
    { pid:2, sid:4, chr:'17', pos:7674220,  ref:'C', alt:'T', gene:'TP53', rsId:'rs28934574', type:'SNV', zyg:'HETEROZYGOUS', af:0.0003, cadd:31.5, sig:'PATHOGENIC', cons:'missense_variant', prot:'p.Arg175His', hgvsc:'c.524G>A', gnomad:0.0000008, sift:'deleterious', pph:'probably_damaging' },

    // PAT-004 Michael Brown — MYH7/MYBPC3
    { pid:3, sid:6, chr:'14', pos:23412028, ref:'G', alt:'A', gene:'MYH7',   rsId:'rs121913631', type:'SNV', zyg:'HETEROZYGOUS', af:0.0002, cadd:29.7, sig:'PATHOGENIC', cons:'missense_variant', prot:'p.Arg403Gln', hgvsc:'c.1208G>A', gnomad:0.000002, sift:'deleterious', pph:'probably_damaging' },
    { pid:3, sid:7, chr:'11', pos:47353320, ref:'C', alt:'T', gene:'MYBPC3', rsId:'rs36210737',  type:'SNV', zyg:'HETEROZYGOUS', af:0.0003, cadd:25.3, sig:'PATHOGENIC', cons:'splice_donor_variant', prot:undefined, hgvsc:'c.2827+1G>A', gnomad:0.000004, sift:'deleterious', pph:'probably_damaging' },
    { pid:3, sid:6, chr:'14', pos:23432728, ref:'C', alt:'G', gene:'MYH7',   rsId:'rs45573833',  type:'SNV', zyg:'HETEROZYGOUS', af:0.0004, cadd:22.1, sig:'LIKELY_PATHOGENIC', cons:'missense_variant', prot:'p.Glu930Lys', hgvsc:'c.2788G>A', gnomad:0.000008, sift:'deleterious', pph:'possibly_damaging' },
    { pid:3, sid:7, chr:'11', pos:47362541, ref:'G', alt:'A', gene:'MYBPC3', rsId:'rs199474813', type:'SNV', zyg:'HETEROZYGOUS', af:0.0002, cadd:18.9, sig:'VUS', cons:'missense_variant', prot:'p.Arg495Gln', hgvsc:'c.1484G>A', gnomad:0.000023, sift:'deleterious', pph:'possibly_damaging' },
    { pid:3, sid:6, chr:'3',  pos:38674335, ref:'C', alt:'T', gene:'SCN5A',  rsId:'rs199473545', type:'SNV', zyg:'HETEROZYGOUS', af:0.0001, cadd:28.4, sig:'LIKELY_PATHOGENIC', cons:'missense_variant', prot:'p.Arg1644His', hgvsc:'c.4931G>A', gnomad:0.000006, sift:'deleterious', pph:'probably_damaging' },
    { pid:3, sid:7, chr:'1',  pos:201328706, ref:'A', alt:'G', gene:'TNNT2', rsId:'rs104894568', type:'SNV', zyg:'HETEROZYGOUS', af:0.0002, cadd:26.8, sig:'PATHOGENIC', cons:'missense_variant', prot:'p.Arg92Trp', hgvsc:'c.274C>T', gnomad:0.000001, sift:'deleterious', pph:'probably_damaging' },

    // PAT-005 Lisa Garcia — FBN1/FBN2
    { pid:4, sid:8, chr:'15', pos:48779576, ref:'C', alt:'T', gene:'FBN1', rsId:'rs137853995', type:'SNV', zyg:'HETEROZYGOUS', af:0.0001, cadd:27.3, sig:'PATHOGENIC', cons:'missense_variant', prot:'p.Cys1117Tyr', hgvsc:'c.3350G>A', gnomad:0.000003, sift:'deleterious', pph:'probably_damaging' },
    { pid:4, sid:8, chr:'15', pos:48784500, ref:'G', alt:'A', gene:'FBN1', rsId:'rs397515506', type:'SNV', zyg:'HETEROZYGOUS', af:0.0001, cadd:24.8, sig:'LIKELY_PATHOGENIC', cons:'missense_variant', prot:'p.Arg2726Trp', hgvsc:'c.8176C>T', gnomad:0.000002, sift:'deleterious', pph:'possibly_damaging' },
    { pid:4, sid:8, chr:'5',  pos:127671559, ref:'A', alt:'G', gene:'FBN2', rsId:'rs201765750', type:'SNV', zyg:'HETEROZYGOUS', af:0.0003, cadd:16.4, sig:'VUS', cons:'missense_variant', prot:'p.Ile2585Val', hgvsc:'c.7753A>G', gnomad:0.000042, sift:'tolerated', pph:'possibly_damaging' },
    { pid:4, sid:8, chr:'15', pos:48703490, ref:'GCAG', alt:'G', gene:'FBN1', type:'INDEL', zyg:'HETEROZYGOUS', af:0.0001, cadd:23.1, sig:'LIKELY_PATHOGENIC', cons:'frameshift_variant', prot:'p.Glu588fs', hgvsc:'c.1762delCAG', gnomad:0.0000005, sift:undefined, pph:undefined },
    { pid:4, sid:8, chr:'9',  pos:107541614, ref:'C', alt:'T', gene:'TGFBR1', rsId:'rs121918393', type:'SNV', zyg:'HETEROZYGOUS', af:0.0002, cadd:29.5, sig:'LIKELY_PATHOGENIC', cons:'missense_variant', prot:'p.Arg487Trp', hgvsc:'c.1459C>T', gnomad:0.000004, sift:'deleterious', pph:'probably_damaging' },

    // PAT-006 David Kim — BRAF/CDKN2A/NRAS
    { pid:5, sid:9, chr:'7',  pos:140453136, ref:'A', alt:'T', gene:'BRAF',   rsId:'rs113488022', type:'SNV', zyg:'HETEROZYGOUS', af:0.0003, cadd:33.0, sig:'PATHOGENIC', cons:'missense_variant', prot:'p.Val600Glu', hgvsc:'c.1799T>A', gnomad:0.0000009, sift:'deleterious', pph:'probably_damaging' },
    { pid:5, sid:9, chr:'9',  pos:21971050,  ref:'C', alt:'T', gene:'CDKN2A', rsId:'rs11515',      type:'SNV', zyg:'HETEROZYGOUS', af:0.0002, cadd:29.4, sig:'PATHOGENIC', cons:'missense_variant', prot:'p.Arg24Pro', hgvsc:'c.71G>C', gnomad:0.000003, sift:'deleterious', pph:'probably_damaging' },
    { pid:5, sid:10,chr:'1',  pos:115256529, ref:'A', alt:'T', gene:'NRAS',   rsId:'rs121913237', type:'SNV', zyg:'HETEROZYGOUS', af:0.0002, cadd:30.1, sig:'PATHOGENIC', cons:'missense_variant', prot:'p.Gln61Lys', hgvsc:'c.181C>A', gnomad:0.0000007, sift:'deleterious', pph:'probably_damaging' },
    { pid:5, sid:9, chr:'9',  pos:21974822,  ref:'G', alt:'A', gene:'CDKN2A', rsId:'rs3088440',   type:'SNV', zyg:'HETEROZYGOUS', af:0.0003, cadd:22.5, sig:'LIKELY_PATHOGENIC', cons:'stop_gained', prot:'p.Arg87Ter', hgvsc:'c.259C>T', gnomad:0.000001, sift:'deleterious', pph:'probably_damaging' },
    { pid:5, sid:9, chr:'10', pos:89692905,  ref:'T', alt:'G', gene:'PTEN',   rsId:'rs587776624', type:'SNV', zyg:'HETEROZYGOUS', af:0.0001, cadd:27.8, sig:'LIKELY_PATHOGENIC', cons:'missense_variant', prot:'p.Lys289Glu', hgvsc:'c.865A>G', gnomad:0.000004, sift:'deleterious', pph:'probably_damaging' },
    { pid:5, sid:10,chr:'7',  pos:140478134, ref:'C', alt:'T', gene:'BRAF',   rsId:'rs121913364', type:'SNV', zyg:'HETEROZYGOUS', af:0.0002, cadd:21.3, sig:'VUS', cons:'missense_variant', prot:'p.Asp594Gly', hgvsc:'c.1781A>G', gnomad:0.000025, sift:'deleterious', pph:'possibly_damaging' },

    // PAT-007 Anna Martinez — MLH1/MSH2/MSH6
    { pid:6, sid:11, chr:'3',  pos:37025068,  ref:'C', alt:'T', gene:'MLH1', rsId:'rs63750271',  type:'SNV', zyg:'HETEROZYGOUS', af:0.0002, cadd:32.5, sig:'PATHOGENIC', cons:'nonsense_variant', prot:'p.Arg265Ter', hgvsc:'c.793C>T', gnomad:0.0000006, sift:'deleterious', pph:'probably_damaging' },
    { pid:6, sid:12, chr:'2',  pos:47806059,  ref:'G', alt:'A', gene:'MSH2', rsId:'rs63751273',  type:'SNV', zyg:'HETEROZYGOUS', af:0.0002, cadd:28.9, sig:'PATHOGENIC', cons:'missense_variant', prot:'p.Thr117Met', hgvsc:'c.350C>T', gnomad:0.000002, sift:'deleterious', pph:'probably_damaging' },
    { pid:6, sid:11, chr:'2',  pos:48010488,  ref:'A', alt:'G', gene:'MSH6', rsId:'rs63749869',  type:'SNV', zyg:'HETEROZYGOUS', af:0.0003, cadd:24.1, sig:'LIKELY_PATHOGENIC', cons:'missense_variant', prot:'p.Ile145Val', hgvsc:'c.433A>G', gnomad:0.000007, sift:'deleterious', pph:'possibly_damaging' },
    { pid:6, sid:12, chr:'7',  pos:6026775,   ref:'G', alt:'T', gene:'PMS2', rsId:'rs63749824',  type:'SNV', zyg:'HETEROZYGOUS', af:0.0001, cadd:27.6, sig:'LIKELY_PATHOGENIC', cons:'missense_variant', prot:'p.Pro470Ser', hgvsc:'c.1408C>A', gnomad:0.000003, sift:'deleterious', pph:'probably_damaging' },
    { pid:6, sid:12, chr:'3',  pos:37067945,  ref:'C', alt:'T', gene:'MLH1', rsId:'rs63750120',  type:'SNV', zyg:'HETEROZYGOUS', af:0.0003, cadd:18.2, sig:'VUS', cons:'missense_variant', prot:'p.His329Arg', hgvsc:'c.986A>G', gnomad:0.000019, sift:'deleterious', pph:'possibly_damaging' },
    { pid:6, sid:11, chr:'2',  pos:47702218,  ref:'AAAG', alt:'A', gene:'MSH2', type:'INDEL', zyg:'HETEROZYGOUS', af:0.0001, cadd:26.3, sig:'PATHOGENIC', cons:'frameshift_variant', prot:'p.Lys609fs', hgvsc:'c.1825_1827del', gnomad:0.0000002, sift:undefined, pph:undefined },

    // PAT-008 Robert Taylor — RET/BRAF/TERT
    { pid:7, sid:13, chr:'10', pos:43614033, ref:'C', alt:'A', gene:'RET',  rsId:'rs74799832',  type:'SNV', zyg:'HETEROZYGOUS', af:0.0002, cadd:34.1, sig:'PATHOGENIC', cons:'missense_variant', prot:'p.Cys634Phe', hgvsc:'c.1901G>T', gnomad:0.000001, sift:'deleterious', pph:'probably_damaging' },
    { pid:7, sid:13, chr:'7',  pos:140453136, ref:'A', alt:'T', gene:'BRAF', rsId:'rs113488022', type:'SNV', zyg:'HETEROZYGOUS', af:0.0003, cadd:33.0, sig:'PATHOGENIC', cons:'missense_variant', prot:'p.Val600Glu', hgvsc:'c.1799T>A', gnomad:0.0000009, sift:'deleterious', pph:'probably_damaging' },
    { pid:7, sid:14, chr:'5',  pos:1295250,   ref:'C', alt:'T', gene:'TERT', rsId:'rs1242535815', type:'SNV', zyg:'HETEROZYGOUS', af:0.0001, cadd:36.2, sig:'PATHOGENIC', cons:'regulatory_region_variant', prot:undefined, hgvsc:'c.-124C>T', gnomad:0.0000003, sift:undefined, pph:undefined },
    { pid:7, sid:13, chr:'10', pos:43599397, ref:'G', alt:'A', gene:'RET',  rsId:'rs79658334',  type:'SNV', zyg:'HETEROZYGOUS', af:0.0003, cadd:22.7, sig:'VUS', cons:'missense_variant', prot:'p.Gly533Ser', hgvsc:'c.1597G>A', gnomad:0.000021, sift:'deleterious', pph:'possibly_damaging' },
    { pid:7, sid:13, chr:'22', pos:24176637, ref:'C', alt:'G', gene:'NF2',  rsId:'rs28928898',  type:'SNV', zyg:'HETEROZYGOUS', af:0.0001, cadd:28.3, sig:'LIKELY_PATHOGENIC', cons:'missense_variant', prot:'p.Leu141Pro', hgvsc:'c.422T>C', gnomad:0.000005, sift:'deleterious', pph:'probably_damaging' },

    // PAT-009 Jennifer Lee — TP53/CHEK2/ATM
    { pid:8, sid:15, chr:'17', pos:7675088, ref:'C', alt:'T', gene:'TP53',  rsId:'rs28934578', type:'SNV', zyg:'HETEROZYGOUS', af:0.0005, cadd:35.0, sig:'PATHOGENIC', cons:'missense_variant', prot:'p.Arg248Trp', hgvsc:'c.742C>T', gnomad:0.000005, sift:'deleterious', pph:'probably_damaging' },
    { pid:8, sid:15, chr:'22', pos:29121087, ref:'G', alt:'A', gene:'CHEK2', rsId:'rs555607708', type:'SNV', zyg:'HETEROZYGOUS', af:0.0002, cadd:26.1, sig:'PATHOGENIC', cons:'stop_gained', prot:'p.Gln221Ter', hgvsc:'c.661C>T', gnomad:0.000002, sift:'deleterious', pph:'probably_damaging' },
    { pid:8, sid:16, chr:'11', pos:108122551, ref:'C', alt:'T', gene:'ATM',  rsId:'rs28904921', type:'SNV', zyg:'HETEROZYGOUS', af:0.0003, cadd:28.7, sig:'LIKELY_PATHOGENIC', cons:'missense_variant', prot:'p.Ser707Pro', hgvsc:'c.2119T>C', gnomad:0.000006, sift:'deleterious', pph:'probably_damaging' },
    { pid:8, sid:15, chr:'17', pos:7670715, ref:'G', alt:'A', gene:'TP53',  rsId:'rs28934574', type:'SNV', zyg:'HETEROZYGOUS', af:0.0004, cadd:31.2, sig:'PATHOGENIC', cons:'missense_variant', prot:'p.Gly245Ser', hgvsc:'c.733G>A', gnomad:0.000003, sift:'deleterious', pph:'probably_damaging' },
    { pid:8, sid:16, chr:'13', pos:32954021, ref:'A', alt:'G', gene:'BRCA2', rsId:'rs80358779', type:'SNV', zyg:'HETEROZYGOUS', af:0.0002, cadd:24.5, sig:'LIKELY_PATHOGENIC', cons:'missense_variant', prot:'p.Asn2665Ser', hgvsc:'c.7994A>G', gnomad:0.000008, sift:'deleterious', pph:'possibly_damaging' },
    { pid:8, sid:15, chr:'17', pos:7673800, ref:'C', alt:'A', gene:'TP53',  rsId:'rs28934576', type:'SNV', zyg:'HETEROZYGOUS', af:0.0003, cadd:29.8, sig:'PATHOGENIC', cons:'missense_variant', prot:'p.Arg273Cys', hgvsc:'c.817C>T', gnomad:0.000004, sift:'deleterious', pph:'probably_damaging' },

    // PAT-010 Thomas Anderson — NF1/SPRED1
    { pid:9, sid:17, chr:'17', pos:31094050, ref:'C', alt:'T', gene:'NF1',    rsId:'rs267607079', type:'SNV', zyg:'HETEROZYGOUS', af:0.0001, cadd:35.8, sig:'PATHOGENIC', cons:'stop_gained', prot:'p.Arg1947Ter', hgvsc:'c.5839C>T', gnomad:0.0000008, sift:'deleterious', pph:'probably_damaging' },
    { pid:9, sid:17, chr:'17', pos:31152000, ref:'G', alt:'A', gene:'NF1',    rsId:'rs180177104', type:'SNV', zyg:'HETEROZYGOUS', af:0.0002, cadd:28.4, sig:'PATHOGENIC', cons:'splice_acceptor_variant', prot:undefined, hgvsc:'c.2991-2A>G', gnomad:0.000002, sift:'deleterious', pph:'probably_damaging' },
    { pid:9, sid:18, chr:'15', pos:38394040, ref:'A', alt:'G', gene:'SPRED1', rsId:'rs267607191', type:'SNV', zyg:'HETEROZYGOUS', af:0.0001, cadd:24.6, sig:'LIKELY_PATHOGENIC', cons:'missense_variant', prot:'p.Asp261Gly', hgvsc:'c.782A>G', gnomad:0.000005, sift:'deleterious', pph:'probably_damaging' },
    { pid:9, sid:17, chr:'12', pos:25398284, ref:'C', alt:'T', gene:'KRAS',   rsId:'rs121913529', type:'SNV', zyg:'HETEROZYGOUS', af:0.0003, cadd:26.8, sig:'PATHOGENIC', cons:'missense_variant', prot:'p.Gly12Asp', hgvsc:'c.35G>A', gnomad:0.0000012, sift:'deleterious', pph:'probably_damaging' },
    { pid:9, sid:18, chr:'17', pos:31040079, ref:'C', alt:'T', gene:'NF1',    rsId:'rs267607090', type:'SNV', zyg:'HETEROZYGOUS', af:0.0002, cadd:22.1, sig:'VUS', cons:'missense_variant', prot:'p.Arg440Gln', hgvsc:'c.1319G>A', gnomad:0.000018, sift:'deleterious', pph:'possibly_damaging' },
    { pid:9, sid:17, chr:'17', pos:31206811, ref:'T', alt:'C', gene:'NF1',    rsId:'rs267607215', type:'SNV', zyg:'HETEROZYGOUS', af:0.0003, cadd:19.5, sig:'LIKELY_PATHOGENIC', cons:'missense_variant', prot:'p.Leu2543Pro', hgvsc:'c.7628T>C', gnomad:0.000009, sift:'deleterious', pph:'probably_damaging' },
  ];

  const variants = await Promise.all(
    variantDefs.map(v =>
      prisma.variant.create({
        data: {
          patientId: patients[v.pid].id,
          studyId: studies[v.sid].id,
          chromosome: v.chr,
          position: v.pos,
          refAllele: v.ref,
          altAllele: v.alt,
          geneName: v.gene,
          rsId: v.rsId,
          variantType: v.type,
          zygosity: v.zyg,
          alleleFrequency: v.af,
          caddScore: v.cadd,
          clinicalSignificance: v.sig,
          consequence: v.cons,
          proteinChange: v.prot,
          hgvsC: v.hgvsc,
          gnomadAf: v.gnomad,
          siftPrediction: v.sift,
          polyphenPrediction: v.pph,
        },
      })
    )
  );

  // ── Sample priorities ─────────────────────────────────────────────────────
  const oncAdminMembership = await prisma.teamMember.findFirst({ where: { userId: u1.id, teamId: oncTeam.id } });
  const rdAdminMembership  = await prisma.teamMember.findFirst({ where: { userId: u4.id, teamId: rdTeam.id } });
  const cardAdminMembership = await prisma.teamMember.findFirst({ where: { userId: u6.id, teamId: cardTeam.id } });

  // Mark some variants as IMPORTANT in oncology team
  const oncImportantIdxs = [0, 1, 3, 8, 9, 10, 16, 17, 19, 35, 36, 40, 41, 47, 48];
  for (const idx of oncImportantIdxs) {
    if (!variants[idx]) continue;
    await prisma.variantPriority.upsert({
      where: { variantId_teamId: { variantId: variants[idx].id, teamId: oncTeam.id } },
      update: {},
      create: { variantId: variants[idx].id, teamId: oncTeam.id, priority: 'IMPORTANT', setByUserId: u1.id },
    });
    await prisma.priorityAuditLog.create({
      data: { variantId: variants[idx].id, teamId: oncTeam.id, userId: u1.id, oldPriority: null, newPriority: 'IMPORTANT' },
    });
  }

  // Mark some as LOW in oncology
  const oncLowIdxs = [4, 11, 20];
  for (const idx of oncLowIdxs) {
    if (!variants[idx]) continue;
    await prisma.variantPriority.upsert({
      where: { variantId_teamId: { variantId: variants[idx].id, teamId: oncTeam.id } },
      update: {},
      create: { variantId: variants[idx].id, teamId: oncTeam.id, priority: 'LOW', setByUserId: u2.id },
    });
  }

  // RD team priorities
  const rdImportantIdxs = [22, 23, 27, 28, 32, 33, 42, 43, 44, 50, 51, 52, 55, 56];
  for (const idx of rdImportantIdxs) {
    if (!variants[idx]) continue;
    await prisma.variantPriority.upsert({
      where: { variantId_teamId: { variantId: variants[idx].id, teamId: rdTeam.id } },
      update: {},
      create: { variantId: variants[idx].id, teamId: rdTeam.id, priority: 'IMPORTANT', setByUserId: u4.id },
    });
    await prisma.priorityAuditLog.create({
      data: { variantId: variants[idx].id, teamId: rdTeam.id, userId: u4.id, oldPriority: null, newPriority: 'IMPORTANT' },
    });
  }

  // Cardio priorities
  const cardImportantIdxs = [24, 25, 26, 29, 30];
  for (const idx of cardImportantIdxs) {
    if (!variants[idx]) continue;
    await prisma.variantPriority.upsert({
      where: { variantId_teamId: { variantId: variants[idx].id, teamId: cardTeam.id } },
      update: {},
      create: { variantId: variants[idx].id, teamId: cardTeam.id, priority: 'IMPORTANT', setByUserId: u6.id },
    });
    await prisma.priorityAuditLog.create({
      data: { variantId: variants[idx].id, teamId: cardTeam.id, userId: u6.id, oldPriority: null, newPriority: 'IMPORTANT' },
    });
  }

  // ── Sample notes ──────────────────────────────────────────────────────────
  const noteData = [
    { idx: 0,  teamId: oncTeam.id, userId: u1.id, text: 'Confirmed pathogenic by Sanger sequencing. BRCA1 exon 17 variant. Recommend genetic counselling for family members.' },
    { idx: 1,  teamId: oncTeam.id, userId: u2.id, text: 'Stop-gain variant causes premature truncation. Functional assay pending.' },
    { idx: 3,  teamId: oncTeam.id, userId: u1.id, text: 'Classic hotspot mutation. High CADD score confirms deleteriousness. Neoadjuvant therapy response being monitored.' },
    { idx: 8,  teamId: oncTeam.id, userId: u2.id, text: 'APC truncation at codon 1450 — classic FAP-associated variant. Colonoscopy surveillance scheduled every 6 months.' },
    { idx: 9,  teamId: oncTeam.id, userId: u1.id, text: 'MLH1 variant co-segregating with disease in family. Two affected relatives identified.' },
    { idx: 16, teamId: oncTeam.id, userId: u2.id, text: 'EGFR L858R — first-line EGFR TKI (osimertinib) initiated. Response assessment at 8 weeks.' },
    { idx: 17, teamId: oncTeam.id, userId: u1.id, text: 'Exon 19 deletion confirmed by NGS and IHC. Standard of care osimertinib started.' },
    { idx: 24, teamId: cardTeam.id, userId: u6.id, text: 'MYH7 R403Q — one of the most severe HCM mutations. ICD implantation discussed with patient.' },
    { idx: 25, teamId: cardTeam.id, userId: u7.id, text: 'Splice site variant confirmed by RT-PCR. Exon skipping observed in cardiac tissue biopsy.' },
    { idx: 27, teamId: rdTeam.id,  userId: u4.id, text: 'FBN1 variant in calcium-binding EGF domain. Classic Marfan presentation — aortic root dilation confirmed on echo.' },
    { idx: 32, teamId: rdTeam.id,  userId: u5.id, text: 'MLH1 nonsense variant leading to NMD. Lynch syndrome confirmed. Annual colonoscopy and endometrial screening initiated.' },
    { idx: 42, teamId: oncTeam.id, userId: u1.id, text: 'BRAF V600E detected — eligible for vemurafenib/cobimetinib combination therapy. Trial enrolment being explored.' },
    { idx: 50, teamId: rdTeam.id,  userId: u4.id, text: 'TP53 R248W — de novo germline mutation confirmed. Li-Fraumeni protocol initiated: annual MRI, regular blood counts.' },
    { idx: 55, teamId: rdTeam.id,  userId: u5.id, text: 'NF1 stop-gain variant. Consistent with full NF1 phenotype including café-au-lait spots and Lisch nodules.' },
  ];

  for (const n of noteData) {
    if (!variants[n.idx]) continue;
    await prisma.variantNote.create({
      data: { variantId: variants[n.idx].id, teamId: n.teamId, userId: n.userId, noteText: n.text },
    });
  }

  console.log('Seed complete.');
  console.log('\n── Login credentials (all passwords: password123) ──');
  console.log('dr.chen      → Oncology Admin');
  console.log('dr.park      → Oncology Editor  /  Cardiology Viewer');
  console.log('nurse.davis  → Oncology Viewer');
  console.log('dr.torres    → Rare Disease Admin');
  console.log('dr.wong      → Rare Disease Editor  /  Oncology Viewer');
  console.log('dr.adams     → Cardiology Admin');
  console.log('dr.liu       → Cardiology Editor');
  console.log('nurse.brown  → Rare Disease Viewer');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
