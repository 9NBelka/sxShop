import styles from './Profile.module.scss';

export default function Profile() {
  return (
    <div className={styles.profileMainBlock}>
      <img
        src='/img/defaultImageForDashBoard.jpg'
        alt='defaultImageAccount'
        className={styles.profileImage}
      />
    </div>
  );
}
