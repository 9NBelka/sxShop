import styles from './ProductAddButton.module.scss';
import { BsPlusCircle } from 'react-icons/bs';

export default function ProductAddButton({ handleAddProduct }) {
  return (
    <button onClick={handleAddProduct} className={styles.buttonAddProduct}>
      <BsPlusCircle className={styles.icon} />
      Добавить товар
    </button>
  );
}
