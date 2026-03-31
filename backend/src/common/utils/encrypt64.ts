import { encrypt64 } from 'gx-twofish64';

export function verifyEncrypt64(
  plainPassword: string,
  hexKey: string,
  encryptedBase64: string,
): boolean {
  try {
    return encrypt64(plainPassword, hexKey) === encryptedBase64;
  } catch {
    return false;
  }
}
