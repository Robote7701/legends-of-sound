const frame = document.querySelector('iframe');
const output = document.querySelector('#results');
const checks = [];
function assert(ok, text) { if (!ok) throw new Error(text); checks.push('OK — ' + text); }
async function until(predicate) {
  const deadline = Date.now() + 5000;
  while (!predicate()) { if (Date.now() > deadline) throw new Error('Délai dépassé'); await new Promise(r => setTimeout(r, 30)); }
}
try {
  await until(() => frame.contentDocument?.querySelectorAll('.pack').length === 9);
  const doc = frame.contentDocument;
  assert(doc.querySelectorAll('.pack button:disabled').length === 9, 'Neuf boosters indisponibles sans catalogue');
  for (const route of ['collection', 'recycling', 'statistics', 'settings', 'credits', 'boosters']) {
    doc.querySelector('nav a[href="#' + route + '"]').click();
    await until(() => doc.querySelector('nav a[aria-current="page"]')?.hash === '#' + route);
    assert(!!doc.querySelector('main h1'), 'Navigation : ' + route);
  }
  doc.querySelector('.skip').click();
  assert(doc.activeElement.id === 'main' && !!doc.querySelector('.pack'), 'Accès clavier au contenu sans changement de rubrique');
  frame.style.width = '390px'; await new Promise(r => setTimeout(r, 100));
  assert(doc.documentElement.scrollWidth <= 390, 'Mobile 390 px : aucun débordement global');
  frame.style.width = '1100px'; await new Promise(r => setTimeout(r, 100));
  assert(doc.documentElement.scrollWidth <= 1100, 'Desktop 1100 px : aucun débordement global');
  output.textContent = checks.join('\n') + '\n' + checks.length + ' tests réussis.';
  output.dataset.status = 'passed';
} catch (e) { output.textContent = checks.join('\n') + '\nÉCHEC — ' + e.message; output.dataset.status = 'failed'; }
