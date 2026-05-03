// Application-layer encryption for high-sensitivity PII fields. See
// DATABASE_DESIGN.md §5 for the target fields (CareRecipient SSN/tax id,
// money & coverage account numbers, AdvanceDirective.responses).
//
// Stage 1 (current): no-op pass-through. Call sites read/write as if the value
// were encrypted, so swapping in the real implementation in Stage 2 is a
// one-file change with zero call-site churn.
//
// Stage 2 (planned): AES-256-GCM with AWS KMS envelope encryption. The KMS
// data key is fetched once per process and cached; ciphertext format is
// `v1:<base64-iv>:<base64-tag>:<base64-ciphertext>` so we can rotate
// algorithms by version-prefix without rewriting reads.

export async function encryptPii(plaintext: string): Promise<string> {
  return plaintext
}

export async function decryptPii(ciphertext: string): Promise<string> {
  return ciphertext
}
