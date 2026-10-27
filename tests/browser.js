const frame = document.querySelector('iframe');
const output = document.querySelector('#results');
const checks = [];
const catalogArtists = await (await fetch('../data/artists.json')).json();
function assert(ok, text) { if (!ok) throw new Error(text); checks.push('OK — ' + text); }
async function until(predicate) {
  const deadline = Date.now() + 5000;
  while (!predicate()) { if (Date.now() > deadline) throw new Error('Délai dépassé'); await new Promise(r => setTimeout(r, 30)); }
}
try {
  await until(() => frame.contentDocument?.querySelectorAll('.pack').length === 10);
  const doc = frame.contentDocument;
  assert(doc.querySelectorAll('.quantity-button').length === 4 && doc.querySelector('.selected-booster h2').textContent === 'ALL STARS', 'Roulette : ALL STARS prioritaire et quatre quantités directes');
  const rap = [...doc.querySelectorAll('.booster-tab')].find(b=>b.textContent==='RAP'), hiphop=[...doc.querySelectorAll('.booster-tab')].find(b=>b.textContent==='HIP-HOP');
  rap.click(); assert(doc.querySelector('.selected-booster h2').textContent==='RAP', 'Booster RAP séparé');
  hiphop.click(); assert(doc.querySelector('.selected-booster h2').textContent==='HIP-HOP', 'Booster HIP-HOP séparé');
  assert(doc.querySelectorAll('.drop-rate').length===4 && !!doc.querySelector('.free-boosters progress'), 'Taux de drop et barre de recharge visibles');
  for (const route of ['collection', 'recycling', 'goals', 'statistics', 'debug', 'settings', 'credits', 'boosters']) {
    doc.querySelector('nav a[href="#' + route + '"]').click();
    await until(() => doc.querySelector('nav a[aria-current="page"]')?.hash === '#' + route);
    assert(!!doc.querySelector('main h1'), 'Navigation : ' + route);
  }
  doc.querySelector('nav a[href="#collection"]').click();
  await until(() => doc.querySelectorAll('.artist-card').length === 40);
  // Laisser finir le changement de rubrique et sa restitution de focus.
  await new Promise(resolve => setTimeout(resolve, 150));
  assert(doc.querySelectorAll('.artist-card').length === 40, 'Catalogue paginé : 40 cartes sur la première page');
  const search = doc.querySelector('input[type="search"]');
  search.value = 'Queen'; search.dispatchEvent(new Event('input', { bubbles: true }));
  assert(doc.querySelector('.artist-card strong')?.textContent === 'Queen', 'Recherche Queen : le nom exact précède les alias');
  doc.querySelector('.artist-card').click();
  const dialog = doc.querySelector('dialog[open]');
  assert(!!dialog && dialog.querySelector('h2').textContent === 'Queen', 'Fiche artiste accessible');
  assert([...dialog.querySelectorAll('a')].some(a => a.href === 'https://musicbrainz.org/artist/0383dadf-2a4e-4d10-a46a-e9e041da8eb3'), 'Lien MusicBrainz réel dans la fiche');
  assert(!dialog.textContent.includes('Non documenté') && !dialog.textContent.includes('Biographie non documentée'), 'Fiche allégée : champs vides masqués');
  assert(dialog.querySelector('.type-name')?.textContent === 'Queen' && !dialog.querySelector('img'), 'Fiche Queen typographique sans photographie');
  if (dialog.querySelector('.evidence-details')) {
    dialog.querySelector('.evidence-details summary').click();
    await until(() => !!dialog.querySelector('.evidence-details li'));
    assert(!!dialog.querySelector('.evidence-details a[href*="wikidata.org"]'), 'Références de carrière chargées à la demande');
  }
  dialog.querySelector('.close-dialog').click();
  await until(() => doc.activeElement.classList.contains('artist-card'));
  assert(doc.activeElement.classList.contains('artist-card'), 'Fermeture de fiche : focus restitué à la carte');
  search.value = 'beyonce'; search.dispatchEvent(new Event('input', { bubbles: true }));
  assert(doc.querySelectorAll('.artist-card').length === 1 && doc.querySelector('.artist-card strong').textContent === 'Beyoncé', 'Recherche sans accent');
  search.value = ''; search.dispatchEvent(new Event('input', { bubbles: true }));
  const selects = doc.querySelectorAll('.catalog-controls select');
  selects[3].value = 'asia-wave'; selects[3].dispatchEvent(new Event('change', { bubbles: true }));
  assert(doc.querySelector('.artist-card') && doc.querySelectorAll('.artist-card').length <= 40, 'Filtre ASIA WAVE et pagination');
  selects[3].value = ''; selects[3].dispatchEvent(new Event('change', { bubbles: true }));
  doc.querySelector('.pagination button:last-child').click();
  assert(doc.querySelector('.pagination span').textContent === '2 / ' + Math.ceil(catalogArtists.length / 40), 'Pagination du catalogue complet');
  selects[1].value = 'legendary'; selects[1].dispatchEvent(new Event('change', { bubbles: true }));
  assert(doc.querySelectorAll('.artist-card .type-art').length === 40, '40 compositions typographiques légendaires');
  assert(!doc.querySelector('.artist-card img'), 'Aucune image artiste chargée');
  doc.querySelector('.pagination button:last-child').click();
  assert(doc.querySelectorAll('.artist-card .type-art').length === Math.min(40, catalogArtists.filter(a=>a.rarity==='legendary').length - 40), 'Suite des légendaires typographiques');
  frame.style.width = '390px'; await new Promise(r => setTimeout(r, 100));
  assert(doc.documentElement.scrollWidth <= 390, 'Catalogue mobile : aucun débordement global');
  doc.querySelector('nav a[href="#boosters"]').click();
  await until(() => !!doc.querySelector('.pack'));
  doc.querySelector('.skip').click();
  assert(doc.activeElement.id === 'main' && !!doc.querySelector('.pack'), 'Accès clavier au contenu sans changement de rubrique');
  frame.style.width = '390px'; await new Promise(r => setTimeout(r, 100));
  assert(doc.documentElement.scrollWidth <= 390, 'Mobile 390 px : aucun débordement global');
  frame.style.width = '1100px'; await new Promise(r => setTimeout(r, 100));
  assert(doc.documentElement.scrollWidth <= 1100, 'Desktop 1100 px : aucun débordement global');
  output.textContent = checks.join('\n') + '\n' + checks.length + ' tests réussis.';
  output.dataset.status = 'passed';
} catch (e) { output.textContent = checks.join('\n') + '\nÉCHEC — ' + e.message; output.dataset.status = 'failed'; }
