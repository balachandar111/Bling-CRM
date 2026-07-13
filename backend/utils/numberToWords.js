// ================= INDIAN NUMBER TO WORDS =================
// Converts a whole rupee amount into the Indian numbering system
// (lakhs / crores) words, e.g. 52437 -> "Fifty Two Thousand Four
// Hundred Thirty Seven". Used to print the
// "(Rupees ... Only)" line on generated payslips.

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];

const TENS = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
];

function twoDigits(n) {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return `${TENS[t]}${o ? " " + ONES[o] : ""}`.trim();
}

function threeDigits(n) {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  let out = "";
  if (h) out += `${ONES[h]} Hundred`;
  if (rest) out += `${out ? " " : ""}${twoDigits(rest)}`;
  return out;
}

// Converts a non-negative integer into Indian-system words.
function numberToWordsIndian(num) {
  num = Math.floor(Math.abs(Number(num) || 0));

  if (num === 0) return "Zero";

  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundred = num;

  const parts = [];
  if (crore) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh) parts.push(`${threeDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigits(thousand)} Thousand`);
  if (hundred) parts.push(threeDigits(hundred));

  return parts.join(" ").trim();
}

// Formats the full "(Rupees ... Only)" line used on the payslip.
function amountInWords(num) {
  const rounded = Math.round(Number(num) || 0);
  return `Rupees ${numberToWordsIndian(rounded)} Only`;
}

module.exports = {
  numberToWordsIndian,
  amountInWords,
};