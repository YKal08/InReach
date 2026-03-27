/**
 * Bulgarian Uniform Civil Number (EGN) Validator
 *
 * Structure: YYMMDDSSSG
 * YY - Year (last two digits)
 * MM - Month (1-12 for 19xx, 21-32 for 18xx, 41-52 for 20xx)
 * DD - Day
 * SSS - Region specific
 * G - Gender (9th digit: even for male, odd for female)
 * C - Checksum (10th digit)
 */

export function isValidEGN(egn: string): boolean {
  if (!egn || egn.length !== 10 || !/^\d+$/.test(egn)) {
    return false;
  }

  const digits = egn.split("").map((d) => parseInt(d, 10));

  // 1. Validate Date
  let year = digits[0] * 10 + digits[1];
  let month = digits[2] * 10 + digits[3];
  let day = digits[4] * 10 + digits[5];

  if (month >= 1 && month <= 12) {
    year += 1900;
  } else if (month >= 21 && month <= 32) {
    year += 1800;
    month -= 20;
  } else if (month >= 41 && month <= 52) {
    year += 2000;
    month -= 40;
  } else {
    return false;
  }

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return false;
  }

  // 2. Validate Checksum
  const weights = [2, 4, 8, 5, 10, 9, 7, 3, 6];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * weights[i];
  }

  let checksum = sum % 11;
  if (checksum === 10) {
    checksum = 0;
  }

  if (checksum !== digits[9]) {
    return false;
  }

  return true;
}

export function getEGNDetails(egn: string) {
  if (!isValidEGN(egn)) return null;

  const digits = egn.split("").map((d) => parseInt(d, 10));
  let year = digits[0] * 10 + digits[1];
  let month = digits[2] * 10 + digits[3];
  let day = digits[4] * 10 + digits[5];

  if (month >= 21 && month <= 32) {
    year += 1800;
    month -= 20;
  } else if (month >= 41 && month <= 52) {
    year += 2000;
    month -= 40;
  } else {
    year += 1900;
  }

  const birthDate = new Date(year, month - 1, day);
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const m = now.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) {
    age--;
  }

  const gender = digits[8] % 2 === 0 ? "male" : "female";

  return {
    birthDate,
    age,
    gender,
  };
}
