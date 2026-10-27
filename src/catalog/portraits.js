const LICENSES = new Set(['CC0-1.0', 'CC-BY-2.0', 'CC-BY-3.0', 'CC-BY-4.0', 'CC-BY-SA-2.0', 'CC-BY-SA-2.5', 'CC-BY-SA-3.0', 'CC-BY-SA-3.0-NL', 'CC-BY-SA-4.0', 'Public-domain', 'CC-BY-NC-3.0']);
export function validatePortrait(portrait) {
  if (portrait === null) return null;
  if (!portrait || typeof portrait !== 'object' || !LICENSES.has(portrait.license)) throw new Error('Licence du portrait non prise en charge.');
  for (const field of ['imageUrl', 'sourceUrl', 'licenseUrl']) {
    let url;
    try { url = new URL(portrait[field]); } catch { throw new Error('URL manquante : ' + field); }
    if (url.protocol !== 'https:') throw new Error('HTTPS obligatoire : ' + field);
    const officialMiku = portrait.license === 'CC-BY-NC-3.0'
      && portrait.imageUrl === 'https://piapro.net/intl/images/popup_miku.jpg'
      && portrait.sourceUrl === 'https://piapro.net/intl/en_for_creators.html'
      && portrait.mediaType === 'illustration'
      && portrait.nonCommercialOnly === true;
    if (portrait.license === 'CC-BY-NC-3.0' && !officialMiku) throw new Error('La licence NC est réservée à l’illustration officielle Miku dans ce jeu non commercial.');
    if (field === 'imageUrl' && !['upload.wikimedia.org', 'thumb.wikimedia.org'].includes(url.hostname) && !officialMiku) throw new Error('Image Commons obligatoire.');
    if (field === 'sourceUrl' && url.hostname !== 'commons.wikimedia.org' && !officialMiku) throw new Error('Page Commons obligatoire.');
  }
  for (const field of ['photographer', 'modifications', 'identityVerification', 'rightsReview']) {
    if (typeof portrait[field] !== 'string' || !portrait[field].trim()) throw new Error('Revue manquante : ' + field);
  }
  for (const field of ['identityVerifiedAt', 'rightsReviewedAt']) {
    if (typeof portrait[field] !== 'string' || !Number.isFinite(Date.parse(portrait[field]))) throw new Error('Date de revue manquante : ' + field);
  }
  if (portrait.localPath !== undefined && !/^assets\/images\/artists\/los-[a-z0-9-]+\.(jpg|png|webp)$/.test(portrait.localPath)) throw new Error('Chemin local de portrait invalide.');
  return portrait;
}
