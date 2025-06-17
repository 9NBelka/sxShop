import { BsXLg } from 'react-icons/bs';
import styles from './SelectCategory.module.scss';

export default function SelectCategory({
  showNewCategoryPopup,
  formData,
  handleChange,
  categories,
  handleNewCategoryOverlayClick,
  setShowNewCategoryPopup,
  setNewCategory,
  handleAddNewCategory,
  newCategory,
}) {
  return (
    <div className={styles.categoryContainer}>
      <select
        name='category'
        value={formData.category || ''}
        onChange={handleChange}
        required
        className={styles.formInput}>
        <option value='' disabled>
          Выберите категорию
        </option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.name}>
            {cat.name}
          </option>
        ))}
        <option value='create-new'>+ Добавить категорию</option>
      </select>
      {showNewCategoryPopup && (
        <div className={styles.newCategoryPopupOverlay} onClick={handleNewCategoryOverlayClick}>
          <div className={styles.newCategoryPopup}>
            <div className={styles.titleAndButtonClose}>
              <h3 className={styles.title}>Добавить категорию</h3>
              <button
                type='button'
                onClick={() => setShowNewCategoryPopup(false)}
                className={styles.buttonClose}>
                <BsXLg className={styles.icon} />
              </button>
            </div>
            <input
              type='text'
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder='Название категории'
              className={styles.formInput}
            />
            <button
              type='button'
              onClick={handleAddNewCategory}
              className={styles.addCategoryButton}>
              Добавить
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
