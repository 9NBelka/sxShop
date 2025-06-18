import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setStockFilter,
  setCategoryFilter,
  setSearchTerm,
} from '../../../../store/slices/filtersSlice';
import styles from './ProductFilters.module.scss';
import { fetchCategories } from '../../../../store/slices/categoriesSlice';
import { BsCaretDownFill, BsSearch } from 'react-icons/bs';
import ProductAddButton from '../ProductAddButton/ProductAddButton';
import Notification from '../../Notification/Notification';
import Profile from '../../Profile/Profile';

export default function ProductFilters({ handleAddProduct }) {
  const dispatch = useDispatch();
  const { stockFilter, categoryFilter, searchTerm } = useSelector((state) => state.filters);
  const { items: categories, status } = useSelector((state) => state.categories);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchCategories());
    }
  }, [dispatch, status]);

  // Приводим к нижнему регистру для согласованности
  const stockOptions = ['нет', 'меньше 10', 'больше 10', 'все'];
  const availableCategories =
    status === 'succeeded' ? ['все', ...categories.map((cat) => cat.name.toLowerCase())] : ['все'];

  const [isStockOpen, setIsStockOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const stockRef = useRef(null);
  const categoryRef = useRef(null);

  const handleSearchChange = (e) => {
    dispatch(setSearchTerm(e.target.value));
  };

  const handleStockChange = (value) => {
    dispatch(setStockFilter(value));
    setIsStockOpen(false);
  };

  const handleCategoryChange = (value) => {
    dispatch(setCategoryFilter(value));
    setIsCategoryOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (stockRef.current && !stockRef.current.contains(event.target)) {
        setIsStockOpen(false);
      }
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setIsCategoryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={styles.filtersMainBlock}>
      <div className={styles.filtersContainer}>
        <div className={styles.searchWrapper}>
          <input
            type='text'
            placeholder='Поиск'
            value={searchTerm}
            onChange={handleSearchChange}
            className={styles.searchInput}
          />
          <BsSearch className={styles.searchIcon} />
        </div>
        <div className={styles.selectWrapper} ref={stockRef}>
          <div className={styles.customSelect} onClick={() => setIsStockOpen(!isStockOpen)}>
            <span className={styles.customSelectText}>
              {!isStockOpen && stockFilter === 'все' ? 'Остаток' : stockFilter}
            </span>
            <span className={styles.customSelectArrow}>
              <BsCaretDownFill className={styles.icon} />
            </span>
          </div>
          {isStockOpen && (
            <div className={styles.dropdown}>
              {stockOptions.map((option) => (
                <div
                  key={option}
                  className={styles.option}
                  onClick={() => handleStockChange(option)}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className={styles.selectWrapper} ref={categoryRef}>
          <div className={styles.customSelect} onClick={() => setIsCategoryOpen(!isCategoryOpen)}>
            <span className={styles.customSelectText}>
              {!isCategoryOpen && categoryFilter === 'все' ? 'Категория' : categoryFilter}
            </span>
            <span className={styles.customSelectArrow}>
              <BsCaretDownFill className={styles.icon} />
            </span>
          </div>
          {isCategoryOpen && (
            <div className={styles.dropdown}>
              {availableCategories.map((category) => (
                <div
                  key={category}
                  className={styles.option}
                  onClick={() => handleCategoryChange(category)}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className={styles.buttonNotificationProfileBlock}>
        <ProductAddButton handleAddProduct={handleAddProduct} />
        <Notification />
        <Profile />
      </div>
    </div>
  );
}
