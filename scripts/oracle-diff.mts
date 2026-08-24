// Streams line-delimited JSON cases from the independent Python oracle
// (scratchpad/oracle.py) on stdin, recomputes each one with the REAL
// shipped TypeScript engine, and reports only a summary + first N
// mismatches -- never materializes the full case set in memory or on disk
// twice. Run via: python3 oracle.py exhaustive | npx tsx scripts/oracle-diff.mts
import readline from "node:readline";
import { buildPrashnaKundali } from "../src/lib/engines/kundali";
import { calculateQuestion } from "../src/lib/engines/prediction";
import { computeTiming } from "../src/lib/engines/timing";
import type { AgamNirgam, FigurePattern } from "../src/lib/types";

interface OracleCase {
  draw: [number, number, number, number];
  house: number;
  type: AgamNirgam;
  guardStatus: string;
  sthanBali: boolean;
  resultFigure: string;
  status: string;
  timingNumber: number;
  timingMatches: number[] | false;
  totalDays: number;
  totalMonths: number;
  totalYears: number;
}

function patternToString(p: FigurePattern): string {
  return p.join("");
}

let total = 0;
let mismatches = 0;
const mismatchSamples: string[] = [];
const fieldMismatchCounts: Record<string, number> = {};

const rl = readline.createInterface({ input: process.stdin, terminal: false });

rl.on("line", (line) => {
  if (!line.trim()) return;
  total++;
  const oracle: OracleCase = JSON.parse(line);

  const { chart, status: guardStatus } = buildPrashnaKundali(oracle.draw);
  const judgement = calculateQuestion(oracle.house, oracle.type, chart);
  const timing = computeTiming(judgement.resultFigure, chart);

  const actual = {
    guardStatus,
    sthanBali: judgement.sthanBali,
    resultFigure: patternToString(judgement.resultFigure),
    status: judgement.status,
    timingNumber: timing.timingNumber,
    timingMatches: timing.matches.map((m) => m.place),
    totalDays: timing.totalDays,
    totalMonths: timing.totalMonths,
    totalYears: timing.totalYears,
  };

  const oracleTimingMatches = oracle.timingMatches === false ? [] : oracle.timingMatches;

  const diffs: string[] = [];
  if (actual.guardStatus !== oracle.guardStatus) diffs.push(`guardStatus: ${actual.guardStatus} != ${oracle.guardStatus}`);
  if (actual.sthanBali !== oracle.sthanBali) diffs.push(`sthanBali: ${actual.sthanBali} != ${oracle.sthanBali}`);
  if (actual.resultFigure !== oracle.resultFigure) diffs.push(`resultFigure: ${actual.resultFigure} != ${oracle.resultFigure}`);
  if (actual.status !== oracle.status) diffs.push(`status: ${actual.status} != ${oracle.status}`);
  if (actual.timingNumber !== oracle.timingNumber) diffs.push(`timingNumber: ${actual.timingNumber} != ${oracle.timingNumber}`);
  if (JSON.stringify(actual.timingMatches) !== JSON.stringify(oracleTimingMatches))
    diffs.push(`timingMatches: ${JSON.stringify(actual.timingMatches)} != ${JSON.stringify(oracleTimingMatches)}`);
  if (actual.totalDays !== oracle.totalDays) diffs.push(`totalDays: ${actual.totalDays} != ${oracle.totalDays}`);
  if (actual.totalMonths !== oracle.totalMonths) diffs.push(`totalMonths: ${actual.totalMonths} != ${oracle.totalMonths}`);
  if (actual.totalYears !== oracle.totalYears) diffs.push(`totalYears: ${actual.totalYears} != ${oracle.totalYears}`);

  if (diffs.length > 0) {
    mismatches++;
    for (const d of diffs) {
      const field = d.split(":")[0];
      fieldMismatchCounts[field] = (fieldMismatchCounts[field] ?? 0) + 1;
    }
    if (mismatchSamples.length < 20) {
      mismatchSamples.push(`draw=${JSON.stringify(oracle.draw)} house=${oracle.house} type=${oracle.type} :: ${diffs.join(" | ")}`);
    }
  }

  if (total % 250000 === 0) {
    process.stderr.write(`...${total} cases checked, ${mismatches} mismatches so far\n`);
  }
});

rl.on("close", () => {
  console.log(`\n=== Oracle cross-check complete ===`);
  console.log(`Total cases: ${total}`);
  console.log(`Mismatches: ${mismatches}`);
  if (mismatches > 0) {
    console.log(`Mismatch counts by field:`, fieldMismatchCounts);
    console.log(`First ${mismatchSamples.length} mismatch samples:`);
    for (const s of mismatchSamples) console.log("  " + s);
    process.exitCode = 1;
  } else {
    console.log("PASS -- every case agrees between the independent Python oracle and the shipped TypeScript engine.");
  }
});
