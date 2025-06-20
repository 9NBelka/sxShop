import { useState, useCallback, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closePopup, updateProduct, addProduct } from '../../../../store/slices/productsSlice';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../../../../firebase';
import styles from './ProductPopup.module.scss';
import { BsPlusCircle, BsTrash, BsXLg } from 'react-icons/bs';
import clsx from 'clsx';
import { fetchCategories, addCategory } from '../../../../store/slices/categoriesSlice';
import SelectCategory from './SelectCategory/SelectCategory';
import SelectAvailable from './SelectAvailable/SelectAvailable';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagesToDelete, setImagesToDelete] = useState([]);

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
      setImagesToDelete([]); // Очищаем список удаляемых изображений
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
      try {
        await dispatch(addCategory(newCategory.trim())).unwrap();
        setFormData((prev) => ({ ...prev, category: newCategory.trim() }));
        setNewCategory('');
        setShowNewCategoryPopup(false);
        toast.success('Категория добавлена');
      } catch (error) {
        console.error('Ошибка добавления категории:', error);
        toast.error('Не удалось добавить категорию');
      }
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
    try {
      if (isExisting && editingProduct) {
        // Добавляем URL изображения в список на удаление
        const imageUrl = formData.images[index];
        setImagesToDelete((prev) => [...prev, imageUrl]);
        // Удаляем изображение из formData.images для интерфейса
        setFormData((prev) => ({
          ...prev,
          images: prev.images.filter((_, i) => i !== index),
        }));
        toast.success('Изображение удалено из предпросмотра');
      } else {
        // Для новых загруженных изображений удаляем из локального состояния
        setImageFiles((prev) => prev.filter((_, i) => i !== index));
        setUploadedImagePreviews((prev) => prev.filter((_, i) => i !== index));
        toast.success('Изображение удалено из предпросмотра');
      }
    } catch (error) {
      console.error('Ошибка удаления изображения:', error);
      toast.error('Не удалось удалить изображение');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrls = [...formData.images]; // Существующие изображения
      // Загрузка новых изображений
      if (imageFiles.length > 0) {
        for (const file of imageFiles) {
          const storageRef = ref(storage, `products/images/${formData.id}/${file.name}`);
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          imageUrls.push(url);
        }
      }

      // Удаление изображений из Firebase Storage
      if (imagesToDelete.length > 0) {
        for (const imageUrl of imagesToDelete) {
          const imageRef = ref(storage, imageUrl);
          await deleteObject(imageRef);
        }
      }

      const finalProductData = { ...formData, images: imageUrls };
      if (editingProduct) {
        await dispatch(updateProduct(finalProductData)).unwrap();
        toast.success('Товар отредактирован');
      } else {
        await dispatch(addProduct(finalProductData)).unwrap();
        toast.success('Товар добавлен');
      }
      dispatch(closePopup());
      setImageFiles([]);
      setUploadedImagePreviews([]);
      setImagesToDelete([]); // Очищаем список удаляемых изображений
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      toast.error(`Не удалось сохранить товар: ${error.message}`);
    } finally {
      setIsSubmitting(false);
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
                  <div className={styles.iconTrashBlock}>
                    <BsTrash
                      className={styles.addIcon}
                      onClick={() => handleRemoveImage(index, true)}
                    />
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
                <div className={styles.iconTrashBlock}>
                  <BsTrash
                    className={styles.addIcon}
                    onClick={() => handleRemoveImage(index, false)}
                  />
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
          <button type='submit' className={styles.buttonSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Сохраняется...' : 'Сохранить'}
          </button>
        </form>
      </div>
    </div>
  );
}
