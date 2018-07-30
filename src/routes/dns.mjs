export default [
  ['POST', '/dns', ['m.admin', 'm.tracker("addDNS")', 'c.dns.add']],
  ['PATCH', '/dns/:id', ['m.admin', 'm.tracker("updateDNS")', 'c.dns.update']],
  ['GET', '/dns', ['m.noQuery', 'm.admin', 'c.dns.list']],
  [
    'POST',
    '/dns/:id/hosts',
    ['m.admin', 'm.tracker("addHost")', 'c.dns.addHost'],
  ],
  [
    'DELETE',
    '/dns/:id/hosts/:host',
    ['m.admin', 'm.tracker("removeHost")', 'c.dns.removeHost'],
  ],
  ['GET', '/available-dns', ['m.noQuery', 'm.admin', 'c.dns.listAvailable']],
  [
    'DELETE',
    '/available-dns',
    ['m.admin', 'c.dns.removeAvailable'],
  ],
];
