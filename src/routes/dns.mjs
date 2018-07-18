export default [
  ['POST', '/dns', ['m.admin', 'm.tracker("addDNS")', 'c.dns.add']],
  ['PATCH', '/dns/:id', ['m.admin', 'm.tracker("updateDNS")', 'c.dns.update']],
  ['GET', '/dns', ['m.admin', 'c.dns.list']],
  [
    'POST',
    '/dns/:id/hosts',
    ['m.admin', 'm.tracker("addHost")', 'c.dns.addHost'],
  ],
  [
    'DELETE',
    '/dns/:id/hosts',
    ['m.admin', 'm.tracker("removeHost")', 'c.dns.removeHost'],
  ],
];
