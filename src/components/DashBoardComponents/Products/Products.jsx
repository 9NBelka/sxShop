import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, openPopup, deleteProduct } from '../../../store/slices/productsSlice';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebase';
import ProductCard from './ProductCard/ProductCard';
import ProductPopup from './ProductPopup/ProductPopup';
import styles from './Products.module.scss';
import { BsPlusCircle } from 'react-icons/bs';

export default function Products() {
  const dispatch = useDispatch();
  const { items, status, error, isPopupOpen } = useSelector((state) => state.products);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const handleAddProduct = () => dispatch(openPopup());
  const handleEditProduct = (product) => dispatch(openPopup(product));
  const handleDeleteProduct = (id) => {
    dispatch(deleteProduct(id));
    deleteDoc(doc(db, 'products', id)).catch((error) => {
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
        {items.map((product) => (
          <ProductCard
            key={product.id}
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
