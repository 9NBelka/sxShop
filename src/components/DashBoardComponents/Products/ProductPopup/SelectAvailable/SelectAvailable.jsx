import styles from './SelectAvailable.module.scss';

const AVAILABILITY_OPTIONS = {
  AVAILABLE: 'В продаже',
  NOT_AVAILABLE: 'Не в продаже',
};

export default function SelectAvailable({ formData, handleChange }) {
  return (
    <label className={styles.selectLabel}>
      <select
        name='isAvailable'
        value={
          formData.isAvailable ? AVAILABILITY_OPTIONS.AVAILABLE : AVAILABILITY_OPTIONS.NOT_AVAILABLE
        }
        onChange={handleChange}
        className={styles.formInput}>
        <option value={AVAILABILITY_OPTIONS.AVAILABLE}>{AVAILABILITY_OPTIONS.AVAILABLE}</option>
        <option value={AVAILABILITY_OPTIONS.NOT_AVAILABLE}>
          {AVAILABILITY_OPTIONS.NOT_AVAILABLE}
        </option>
      </select>
    </label>
  );
}
