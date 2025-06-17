import React from 'react';
import styles from './ProductCard.module.scss';
import clsx from 'clsx';
import { BsPencil, BsTrash } from 'react-icons/bs';

export default function ProductCard({ product, onEdit, onDelete }) {
  return (
    <div className={styles.productCard}>
      {product.images[0] ? (
        <img src={product.images[0]} alt={product.name} className={styles.imageProduct} />
      ) : (
        <p className={styles.noImageText}>Нет изображения</p>
      )}
      <div className={styles.descriptionProductBlock}>
        <p
          className={clsx(
            styles.categoryAndQuantityText,
            product.isAvailable ? styles.activeGreen : styles.noActiveRed,
          )}>
          {product.isAvailable ? 'Активно' : 'Неактивно'}
        </p>
        <h3 className={styles.nameProduct}>{product.name}</h3>
        <p className={styles.priceProduct}>{product.price}$</p>
        <p className={styles.categoryAndQuantityText}>Категория: {product.category}</p>
        <p className={styles.categoryAndQuantityText}>Остаток на складе: {product.stockQuantity}</p>
        <div className={styles.buttonsProductBlock}>
          <button onClick={() => onEdit(product)} className={styles.buttonProduct}>
            <BsPencil className={styles.buttonIcon} />
            Редактировать
          </button>
          <button onClick={() => onDelete(product.id)} className={styles.buttonProduct}>
            <BsTrash className={styles.buttonIcon} />
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
}
