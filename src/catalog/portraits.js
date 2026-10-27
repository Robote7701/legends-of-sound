const LICENSES = new Set(['CC0-1.0', 'CC-BY-2.0', 'CC-BY-3.0', 'CC-BY-4.0', 'CC-BY-SA-2.0', 'CC-BY-SA-3.0', 'CC-BY-SA-4.0', 'Public-domain']);
export function validatePortrait(portrait) {
  if (portrait === null) return null;
  if (!portrait || typeof portrait !== 'object' || !LICENSES.has(portrait.license)) throw new Error('Licence du portrait non prise en charge.');
  for (const field of ['imageUrl', 'sourceUrl', 'licenseUrl']) {
    let url;
    try { url = new URL(portrait[field]); } catch { throw new Error('URL manquante : ' + field); }
    if (url.protocol !== 'https:') throw new Error('HTTPS obligatoire : ' + field);
    if (field === 'imageUrl' && url.hostname !== 'upload.wikimedia.org') throw new Error('Image Commons obligatoire.');
    if (field === 'sourceUrl' && url.hostname !== 'commons.wikimedia.org') throw new Error('Page Commons obligatoire.');
  }
  for (const field of ['photographer', 'modifications', 'identityVerification', 'rightsReview']) {
    if (typeof portrait[field] !== 'string' || !portrait[field].trim()) throw new Error('Revue manquante : ' + field);
  }
  for (const field of ['identityVerifiedAt', 'rightsReviewedAt']) {
    if (typeof portrait[field] !== 'string' || !Number.isFinite(Date.parse(portrait[field]))) throw new Error('Date de revue manquante : ' + field);
  }
  return portrait;
}
