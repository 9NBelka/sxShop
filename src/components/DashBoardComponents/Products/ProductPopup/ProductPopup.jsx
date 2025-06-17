import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closePopup, updateProduct, addProduct } from '../../../../store/slices/productsSlice';
import { collection, addDoc, updateDoc, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../../firebase';
import styles from './ProductPopup.module.scss';
import { BsPlusCircle, BsXLg } from 'react-icons/bs';
import clsx from 'clsx';
import { fetchCategories } from '../../../../store/slices/categoriesSlice';
import SelectCategory from './SelectCategory/SelectCategory';
import SelectAvailable from './SelectAvailable/SelectAvailable';

export default function ProductPopup() {
  const dispatch = useDispatch();
  const { isPopupOpen, editingProduct } = useSelector((state) => state.products);
  const categories = useSelector((state) => state.categories.items);
  const categoriesStatus = useSelector((state) => state.categories.status);
  const [formData, setFormData] = React.useState(
    editingProduct || {
      id: doc(collection(db, 'products')).id,
      name: '',
      description: '',
      createdAt: new Date().toISOString(),
      category: '',
      stockQuantity: '',
      images: [],
      isAvailable: true,
      price: '',
    },
  );
  const [imageFiles, setImageFiles] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const fileInputRef = useRef(null);
  const [showNewCategoryPopup, setShowNewCategoryPopup] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    if (isPopupOpen && categoriesStatus === 'idle') {
      dispatch(fetchCategories());
    }
    if (editingProduct && !formData.category && categories.length > 0) {
      setFormData((prev) => ({ ...prev, category: categories[0].name }));
    }
  }, [dispatch, isPopupOpen, categoriesStatus, editingProduct, categories, formData.category]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'isAvailable') {
      setFormData((prev) => ({
        ...prev,
        [name]: value === 'В продаже',
      }));
    } else if (name === 'category') {
      if (value === 'create-new') {
        setShowNewCategoryPopup(true);
      } else {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  }, []);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles((prev) => [...prev, ...files]);
    setUploadedImages((prev) => [...prev, ...files.map((file) => URL.createObjectURL(file))]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImageBlockClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleAddNewCategory = async () => {
    if (newCategory.trim()) {
      await addDoc(collection(db, 'productCategories'), { name: newCategory.trim() });
      dispatch(fetchCategories()); // Обновляем список категорий
      setFormData((prev) => ({ ...prev, category: newCategory.trim() }));
      setNewCategory('');
      setShowNewCategoryPopup(false);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Название обязательно';
    if (!formData.category.trim()) return 'Категория обязательна';
    if (formData.stockQuantity < 0) return 'Остаток не может быть отрицательным';
    if (formData.price < 0) return 'Цена не может быть отрицательной';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const productData = { ...formData, images: formData.images.filter(Boolean) };
    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    try {
      let imageUrls = [...formData.images];
      if (imageFiles.length > 0) {
        for (const file of imageFiles) {
          const storageRef = ref(storage, `products/images/${formData.id}/${file.name}`);
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          imageUrls.push(url);
        }
      }

      const finalProductData = { ...productData, images: imageUrls };
      if (editingProduct) {
        const productRef = doc(db, 'products', editingProduct.id);
        const docSnap = await getDoc(productRef);
        if (docSnap.exists()) {
          await updateDoc(productRef, finalProductData);
          dispatch(updateProduct(finalProductData));
        } else {
          throw new Error('Документ не найден');
        }
      } else {
        const docRef = await addDoc(collection(db, 'products'), finalProductData);
        dispatch(addProduct({ ...finalProductData, id: docRef.id }));
      }
      dispatch(closePopup());
      setImageFiles([]);
      setUploadedImages([]);
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert(`Не удалось сохранить товар: ${error.message}`);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      dispatch(closePopup());
      setShowNewCategoryPopup(false);
    }
  };

  const handleNewCategoryOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowNewCategoryPopup(false);
    }
  };

  if (!isPopupOpen) return null;

  return (
    <div className={styles.backgroundBlack} onClick={handleOverlayClick}>
      <div className={styles.mainPopUpBlock}>
        <div className={styles.titleAndCloseBlock}>
          <h2 className={styles.popUpTitle}>
            {editingProduct ? 'Редактировать товар' : 'Добавить товар'}
          </h2>
          <button
            type='button'
            onClick={() => dispatch(closePopup())}
            className={styles.buttonClose}>
            <BsXLg className={styles.icon} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className={styles.formBlock}>
          <div
            className={clsx(
              styles.addImageBlocks,
              uploadedImages.length >= 2 && styles.scrollImages,
            )}>
            {uploadedImages.map((src, index) => (
              <div key={index} className={styles.addImageBlock}>
                <img
                  src={src}
                  alt={`Uploaded ${index}`}
                  className={clsx(uploadedImages.length >= 2 && styles.opacityImage)}
                />
              </div>
            ))}
            {uploadedImages.length < 5 && (
              <div className={styles.addImageBlock} onClick={handleImageBlockClick}>
                <img src='/img/defaultImageForDashBoard.jpg' alt='defaultImageForDashBoard' />
                <div className={styles.iconAndTextBlock}>
                  <BsPlusCircle className={styles.addIcon} />
                  <p className={styles.addText}>Добавить фото</p>
                </div>
                <input
                  type='file'
                  multiple
                  accept='image/*'
                  onChange={handleImageUpload}
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                />
              </div>
            )}
          </div>
          <input
            name='name'
            value={formData.name}
            onChange={handleChange}
            placeholder='Название'
            required
            className={clsx(styles.formInput, styles.margTop)}
          />
          <SelectCategory
            showNewCategoryPopup={showNewCategoryPopup}
            formData={formData}
            handleChange={handleChange}
            categories={categories}
            handleNewCategoryOverlayClick={handleNewCategoryOverlayClick}
            setShowNewCategoryPopup={setShowNewCategoryPopup}
            setNewCategory={setNewCategory}
            handleAddNewCategory={handleAddNewCategory}
            newCategory={newCategory}
          />
          <input
            name='price'
            type='number'
            value={formData.price}
            onChange={handleChange}
            placeholder='Цена'
            step='0.01'
            required
            className={styles.formInput}
          />
          <textarea
            name='description'
            value={formData.description}
            onChange={handleChange}
            placeholder='Описание'
            className={clsx(styles.formInput, styles.descriptionFormInput)}
          />
          <input
            name='stockQuantity'
            type='number'
            value={formData.stockQuantity}
            onChange={handleChange}
            placeholder='Остаток'
            required
            className={styles.formInput}
          />

          <SelectAvailable formData={formData} handleChange={handleChange} />

          <button type='submit' className={styles.buttonSubmit}>
            Сохранить
          </button>
        </form>
      </div>
    </div>
  );
}
