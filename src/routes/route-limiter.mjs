export default [
  ['GET', '/route-limits', 'm.noQuery & c.routeLimiter.list'],
  ['POST', '/route-limits', 'm.admin & c.routeLimiter.add'],
  ['DELETE', '/route-limits/:id', 'm.admin & c.routeLimiter.remove'],
  ['PATCH', '/route-limits/:id', 'm.admin & c.routeLimiter.update'],
];
