import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, openPopup, deleteProduct } from '../../../store/slices/productsSlice';
import ProductCard from './ProductCard/ProductCard';
import ProductPopup from './ProductPopup/ProductPopup';
import ProductFilters from './ProductFilters/ProductFilters';
import styles from './Products.module.scss';
import { useEffect } from 'react';
import { toast } from 'react-toastify';

export default function Products() {
  const dispatch = useDispatch();
  const { items: products, status, error, isPopupOpen } = useSelector((state) => state.products);
  const { stockFilter, categoryFilter, searchTerm } = useSelector((state) => state.filters);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const handleAddProduct = () => dispatch(openPopup());
  const handleEditProduct = (product) => dispatch(openPopup(product));
  const handleDeleteProduct = (id) => {
    toast.success('Товар успешно удален!');
    dispatch(deleteProduct(id)).catch((error) => {
      console.error('Ошибка удаления:', error);
      toast.error('Не удалось удалить товар');
    });
  };

  // Фильтрация товаров с приведением к нижнему регистру
  const filteredItems = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesStock = true;
    if (stockFilter === 'нет') matchesStock = product.stockQuantity === '0';
    else if (stockFilter === 'меньше 10')
      matchesStock = product.stockQuantity > 0 && product.stockQuantity < 10;
    else if (stockFilter === 'больше 10') matchesStock = product.stockQuantity >= 10;

    const matchesCategory =
      categoryFilter === 'все' || product.category.toLowerCase() === categoryFilter;

    return matchesSearch && matchesStock && matchesCategory;
  });

  if (status === 'loading') return <p>Загрузка...</p>;
  if (status === 'failed') return <p>Ошибка: {error}</p>;

  return (
    <>
      <ProductFilters handleAddProduct={handleAddProduct} />
      <div className={styles.mainBlockProducts}>
        {filteredItems.length === 0 && status === 'succeeded' && (
          <p>Товары отсутствуют. Добавьте новый товар!</p>
        )}
        {filteredItems.map((product) => (
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
