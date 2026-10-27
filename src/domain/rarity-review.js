// Evidence triage, never an objective score of talent or popularity.
export function rarityProposal(artist) {
  const musical=[...new Set((artist.awards||[]).filter(name=>/grammy|polar music|rock and roll hall|blues hall|jazz.*master|billboard.*icon|victoire.*musique|mercury prize/i.test(name)))];
  const career=musical.filter(name=>/couronnement|lifetime|legend|polar music|hall of fame|icon/i.test(name));
  const reviewed=artist.rarityReview?.status==='reviewed';
  const proposed=reviewed?artist.rarity:career.length>=2?'legendary':career.length||musical.length>=3?'epic':musical.length?'rare':null;
  return {id:artist.id,name:artist.displayName||artist.name,current:artist.rarity,proposed,
    status:artist.rarityReview?.status==='reviewed'?'reviewed':'to-review',
    reason:reviewed?artist.rarityReview.reason:proposed?'Distinctions musicales documentées à examiner ; proposition éditoriale, pas un classement automatique.':'Données insuffisantes pour proposer une promotion. Examiner influence et reconnaissance dans sa scène.',
    evidence:musical,sources:[artist.provenance.musicbrainz.url,artist.provenance.wikidata.url],evidenceSource:artist.careerEvidence?.source||null};
}
