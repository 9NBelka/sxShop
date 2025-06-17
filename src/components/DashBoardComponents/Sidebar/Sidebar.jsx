import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { BsBoxSeam, BsClipboardCheck, BsColumnsGap, BsPeopleFill, BsTags } from 'react-icons/bs';
import styles from './Sidebar.module.scss';
import { PATHS } from '../../../constants';

export default function Sidebar({ handleLogout }) {
  const navItems = [
    {
      path: `${PATHS.DASHBOARD}/home`,
      label: 'Дашборд',
      icon: <BsColumnsGap className={styles.icon} />,
    },
    {
      path: `${PATHS.DASHBOARD}/orders`,
      label: 'Заказы',
      icon: <BsClipboardCheck className={styles.icon} />,
    },
    {
      path: `${PATHS.DASHBOARD}/products`,
      label: 'Товары',
      icon: <BsBoxSeam className={styles.icon} />,
    },
    {
      path: `${PATHS.DASHBOARD}/promocodes`,
      label: 'Промокоды',
      icon: <BsTags className={styles.icon} />,
    },
    {
      path: `${PATHS.DASHBOARD}/clients`,
      label: 'Клиенты',
      icon: <BsPeopleFill className={styles.icon} />,
    },
  ];

  return (
    <aside className={styles.sidebar}>
      <NavLink to={`${PATHS.DASHBOARD}/home`}>
        <div className={styles.sidebarHeader}>
          <h1 className={styles.title}>SXShop</h1>
          <h2 className={styles.subTitle}>Admin Panel</h2>
        </div>
      </NavLink>
      <nav className={styles.sidebarNav}>
        <ul>
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  clsx(styles.sidebarLink, { [styles.active]: isActive })
                }>
                <span>{item.icon}</span>
                <span className={styles.textLink}>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      {/* <button className={styles.logoutButton} onClick={handleLogout}>
        Выйти
      </button> */}
    </aside>
  );
}
