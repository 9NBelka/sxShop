import styles from './Notification.module.scss';
import { BsBell } from 'react-icons/bs';

export default function Notification() {
  return (
    <div className={styles.notificationMainBlock}>
      <BsBell className={styles.icon} />
    </div>
  );
}
