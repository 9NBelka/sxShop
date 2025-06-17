import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, openPopup, deleteProduct } from '../../../store/slices/productsSlice';
import ProductCard from './ProductCard/ProductCard';
import ProductPopup from './ProductPopup/ProductPopup';
import styles from './Products.module.scss';
import { BsPlusCircle } from 'react-icons/bs';
import { useEffect } from 'react';

export default function Products() {
  const dispatch = useDispatch();
  const { items, status, error, isPopupOpen } = useSelector((state) => state.products);

  useEffect(() => {
    dispatch(fetchProducts());
  }, []);

  const handleAddProduct = () => dispatch(openPopup());
  const handleEditProduct = (product) => dispatch(openPopup(product));
  const handleDeleteProduct = (id) => {
    dispatch(deleteProduct(id)).catch((error) => {
      console.error('Ошибка удаления:', error);
      alert('Не удалось удалить товар');
    });
  };

  if (status === 'loading') return <p>Загрузка...</p>;
  if (status === 'failed') return <p>Ошибка: {error}</p>;

  return (
    <>
      <button onClick={handleAddProduct} className={styles.buttonAddProduct}>
        <BsPlusCircle className={styles.icon} />
        Добавить товар
      </button>
      <div className={styles.mainBlockProducts}>
        {items.length === 0 && status === 'succeeded' && (
          <p>Товары отсутствуют. Добавьте новый товар!</p>
        )}
        {items.map((product) => (
          <ProductCard
            key={product.id || `temp-${Math.random().toString(36).substr(2, 9)}`}
            product={product}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
          />
        ))}
      </div>
      {isPopupOpen && <ProductPopup />}
    </>
  );
}
