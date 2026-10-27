// Taxonomie éditoriale du jeu. Les libellés d'origine restent dans careerEvidence.
export function normalizeGenre(label) {
  const name = label.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[-‐‑–]/g, ' ');
  if (/vocaloid/.test(name)) return ['vocaloid', 'electronic'];
  if (/\bk pop\b|korean pop/.test(name)) return ['k-pop', 'pop'];
  if (/\bj pop\b|japanese pop/.test(name)) return ['j-pop', 'pop'];
  if (/\bj rock\b|japanese rock/.test(name)) return ['j-rock', 'rock'];
  if (/cantopop/.test(name)) return ['cantopop', 'pop'];
  if (/mandopop/.test(name)) return ['mandopop', 'pop'];
  if (/rhythm and blues|r&b|\brnb\b/.test(name)) return ['rnb'];
  if (/afrobeats/.test(name)) return ['afrobeats', 'world'];
  if (/afrobeat/.test(name)) return ['afrobeat', 'funk', 'world'];
  if (/reggaeton/.test(name)) return ['reggaeton', 'latin'];
  if (/french hip hop|rap francais/.test(name)) return ['rap', 'hip-hop'];
  if (/\btrap\b/.test(name)) return ['trap', 'hip-hop'];
  if (/\brap\b|rapping/.test(name)) return ['rap', 'hip-hop'];
  if (/hip hop/.test(name)) return ['hip-hop'];
  if (/metal/.test(name)) return ['metal'];
  if (/post rock/.test(name)) return ['post-rock', 'rock'];
  if (/punk/.test(name)) return ['punk', 'rock'];
  if (/new wave/.test(name)) return ['rock', 'electronic'];
  if (/synth.?pop|electropop/.test(name)) return ['pop', 'electronic'];
  if (/rock|shoegaz|grunge|britpop/.test(name)) return ['rock'];
  if (/house/.test(name)) return ['house', 'electronic'];
  if (/techno/.test(name)) return ['techno', 'electronic'];
  if (/synthwave/.test(name)) return ['synthwave', 'electronic'];
  if (/ambient/.test(name)) return ['ambient', 'electronic'];
  if (/electro.?swing/.test(name)) return ['electro-swing', 'electronic'];
  if (/electro|drum and bass|dubstep|trance|breakbeat|big beat|garage|hardstyle|downtempo|trip hop|industrial|dance music/.test(name)) return ['electronic'];
  if (/jazz|bebop|swing music/.test(name)) return ['jazz'];
  if (/bossa nova/.test(name)) return ['bossa-nova', 'jazz', 'world'];
  if (/blues/.test(name)) return ['blues'];
  if (/soul/.test(name)) return ['soul'];
  if (/funk/.test(name)) return ['funk'];
  if (/reggae|dancehall|roots rock|\bdub\b/.test(name)) return ['reggae'];
  if (/\bska\b/.test(name)) return ['ska'];
  if (/disco/.test(name)) return ['disco'];
  if (/pop|eurodance|eurobeat|adult contemporary|variete/.test(name)) return ['pop'];
  if (/salsa|latin|bachata|merengue|cumbia|tango|ranchera|mariachi|banda music/.test(name)) return ['latin', 'world'];
  if (/samba/.test(name)) return ['samba', 'world'];
  if (/mpb|musica popular brasileira/.test(name)) return ['mpb', 'world'];
  if (/qawwali/.test(name)) return ['qawwali', 'world'];
  if (/chanson/.test(name)) return ['chanson'];
  if (/classical|orchestral|opera|baroque/.test(name)) return ['classical'];
  if (/filmi|bollywood/.test(name)) return ['filmi', 'world'];
  if (/folk|country|flamenco|world music|traditional|african|rai|rumba/.test(name)) return ['world'];
  return [];
}
export function normalizedGenres(evidence) {
  return [...new Set(evidence.genres.flatMap(g => normalizeGenre(g.name)))];
}
