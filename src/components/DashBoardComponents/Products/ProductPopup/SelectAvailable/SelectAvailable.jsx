import styles from './SelectAvailable.module.scss';

export default function SelectAvailable({ formData, handleChange }) {
  return (
    <label className={styles.selectLabel}>
      <select
        name='isAvailable'
        value={formData.isAvailable ? 'В продаже' : 'Не в продаже'}
        onChange={handleChange}
        className={styles.formInput}>
        <option value='В продаже'>В продаже</option>
        <option value='Не в продаже'>Не в продаже</option>
      </select>
    </label>
  );
}
