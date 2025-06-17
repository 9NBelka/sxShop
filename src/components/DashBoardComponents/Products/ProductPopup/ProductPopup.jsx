import { useState, useCallback, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closePopup, updateProduct, addProduct } from '../../../../store/slices/productsSlice';
import { collection, addDoc, updateDoc, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../../../firebase';
import styles from './ProductPopup.module.scss';
import { BsPlusCircle, BsTrash, BsXLg } from 'react-icons/bs';
import clsx from 'clsx';
import { fetchCategories, addCategory } from '../../../../store/slices/categoriesSlice';
import SelectCategory from './SelectCategory/SelectCategory';
import SelectAvailable from './SelectAvailable/SelectAvailable';

export default function ProductPopup() {
  const dispatch = useDispatch();
  const { isPopupOpen, editingProduct } = useSelector((state) => state.products);
  const categories = useSelector((state) => state.categories.items);
  const categoriesStatus = useSelector((state) => state.categories.status);
  const [formData, setFormData] = useState(
    editingProduct || {
      id: '',
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
  const [uploadedImagePreviews, setUploadedImagePreviews] = useState([]); // Only for new uploads
  const fileInputRef = useRef(null);
  const [showNewCategoryPopup, setShowNewCategoryPopup] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    if (isPopupOpen && categoriesStatus === 'idle') {
      dispatch(fetchCategories());
    }
    if (editingProduct) {
      setFormData((prev) => ({ ...prev, ...editingProduct }));
      // Do not set uploadedImagePreviews here; it should only hold new previews
    }
  }, [dispatch, isPopupOpen, categoriesStatus, editingProduct]);

  useEffect(() => {
    return () => {
      uploadedImagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [uploadedImagePreviews]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }, []);

  const handleCategoryChange = useCallback((e) => {
    const { value } = e.target;
    if (value === 'create-new') {
      setShowNewCategoryPopup(true);
    } else {
      setFormData((prev) => ({ ...prev, category: value }));
    }
  }, []);

  const handleAvailabilityChange = useCallback((e) => {
    setFormData((prev) => ({
      ...prev,
      isAvailable: e.target.value === 'В продаже',
    }));
  }, []);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles((prev) => [...prev, ...files]);
    setUploadedImagePreviews((prev) => [
      ...prev,
      ...files.map((file) => URL.createObjectURL(file)),
    ]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImageBlockClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleAddNewCategory = async () => {
    if (newCategory.trim()) {
      await dispatch(addCategory(newCategory.trim()));
      setFormData((prev) => ({ ...prev, category: newCategory.trim() }));
      setNewCategory('');
      setShowNewCategoryPopup(false);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Название обязательно';
    if (!formData.category.trim()) return 'Категория обязательна';
    if (formData.stockQuantity < 0) return 'Остаток не может быть отрицательным';
    if (formData.price < 0 || isNaN(formData.price)) return 'Цена должна быть положительным числом';
    if (formData.price && !/^\d+(\.\d{1,2})?$/.test(formData.price))
      return 'Цена должна иметь не более двух знаков после запятой';
    if (imageFiles.length + formData.images.length > 5) return 'Максимум 5 изображений';
    return '';
  };

  const handleRemoveImage = async (index, isExisting) => {
    if (isExisting && editingProduct) {
      const imageUrl = formData.images[index];
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef).catch((error) => console.error('Error removing image:', error));
      setFormData((prev) => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
      }));
    } else {
      setImageFiles((prev) => prev.filter((_, i) => i !== index));
      setUploadedImagePreviews((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    try {
      let imageUrls = [...formData.images]; // Start with existing images
      if (imageFiles.length > 0) {
        for (const file of imageFiles) {
          const storageRef = ref(storage, `products/images/${formData.id}/${file.name}`);
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          imageUrls.push(url);
        }
      }

      const finalProductData = { ...formData, images: imageUrls };
      if (editingProduct) {
        await dispatch(updateProduct(finalProductData));
      } else {
        await dispatch(addProduct(finalProductData));
      }
      dispatch(closePopup());
      setImageFiles([]);
      setUploadedImagePreviews([]);
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert(`Не удалось сохранить товар: ${error.message}`);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      dispatch(closePopup());
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
              formData.images.length + uploadedImagePreviews.length >= 2 && styles.scrollImages,
            )}>
            {editingProduct &&
              formData.images.length > 0 &&
              formData.images.map((src, index) => (
                <div key={`existing-${index}`} className={styles.addImageBlock}>
                  <img
                    src={src}
                    alt={`Existing ${index}`}
                    className={clsx(
                      formData.images.length + uploadedImagePreviews.length >= 1 &&
                        styles.opacityImage,
                    )}
                  />
                  <div
                    className={styles.iconTrashBlock}
                    onClick={() => handleRemoveImage(index, true)}>
                    <BsTrash className={styles.addIcon} />
                  </div>
                </div>
              ))}
            {uploadedImagePreviews.map((src, index) => (
              <div key={`uploaded-${index}`} className={styles.addImageBlock}>
                <img
                  src={src}
                  alt={`Uploaded ${index}`}
                  className={clsx(
                    formData.images.length + uploadedImagePreviews.length >= 1 &&
                      styles.opacityImage,
                  )}
                />
                <div
                  className={styles.iconTrashBlock}
                  onClick={() => handleRemoveImage(index, false)}>
                  <BsTrash className={styles.addIcon} />
                </div>
              </div>
            ))}
            {formData.images.length + uploadedImagePreviews.length < 5 && (
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
            handleChange={handleCategoryChange}
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
          <SelectAvailable formData={formData} handleChange={handleAvailabilityChange} />
          <button type='submit' className={styles.buttonSubmit}>
            Сохранить
          </button>
        </form>
      </div>
    </div>
  );
}
