import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/DashBoardComponents/Sidebar/Sidebar';
import styles from './DashBoard.module.scss';

export default function DashBoard({ handleLogout }) {
  return (
    <div className={styles.dashboardContainer}>
      <aside className={styles.sidebar}>
        <Sidebar handleLogout={handleLogout} />
      </aside>
      <main className={styles.mainContentArea}>
        <Outlet />
      </main>
    </div>
  );
}
