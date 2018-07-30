import Register from '../views/register';
import Login from '../views/login';
import DNSSetting from '../views/dns-setting';
import AvailableDNS from '../views/available-dns';

export const Routes = {
  DNSSetting: 'dns-setting',
  AvailableDNS: 'available-dns',
  Register: 'register',
  Login: 'login',
};

export default [
  {
    name: Routes.DNSSetting,
    path: '/dns-setting',
    component: DNSSetting,
  },
  {
    name: Routes.AvailableDNS,
    path: '/available-dns',
    component: AvailableDNS,
  },
  {
    name: Routes.Register,
    path: '/register',
    component: Register,
  },
  {
    name: Routes.Login,
    path: '/login',
    component: Login,
  },
];
