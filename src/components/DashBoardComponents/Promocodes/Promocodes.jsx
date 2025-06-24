import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styles from './Promocodes.module.scss';
import { toast } from 'react-toastify';
import {
  addPromocode,
  fetchPromocodes,
  togglePromocodeStatus,
  updatePromocode,
} from '../../../store/slices/promocodesSlice';
import clsx from 'clsx';
import { BsPencil, BsPlusCircle } from 'react-icons/bs';

export default function Promocodes() {
  const dispatch = useDispatch();
  const { items = [], status, error } = useSelector((state) => state.promocodes || { items: [] });
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [editingPromocode, setEditingPromocode] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    discountType: 'percentage',
    discountValue: '',
    type: 'permanent',
    startDate: '',
    endDate: '',
    usageCount: 0,
    isActive: true,
  });

  useEffect(() => {
    dispatch(fetchPromocodes());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(`Ошибка: ${error}`);
    }
  }, [error]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...formData };
    if (payload.type === 'permanent') {
      payload.startDate = '';
      payload.endDate = '';
    }
    console.log('Отправляемый payload:', payload); // Отладка
    if (editingPromocode) {
      dispatch(updatePromocode(payload));
      toast.success('Промокод обновлен');
    } else {
      dispatch(addPromocode(payload));
      toast.success('Промокод создан');
    }
    setIsPopupOpen(false);
    setFormData({
      id: '',
      name: '',
      discountType: 'percentage',
      discountValue: '',
      type: 'permanent',
      startDate: '',
      endDate: '',
      usageCount: 0,
      isActive: true,
    });
    setEditingPromocode(null);
  };

  const handleEdit = (promocode) => {
    setEditingPromocode(promocode.id);
    setFormData(promocode);
    setIsPopupOpen(true);
  };

  const handleToggle = (id) => {
    dispatch(togglePromocodeStatus(id))
      .unwrap()
      .then(({ isActive }) => {
        toast.success(`Промокод ${isActive ? 'включен' : 'выключен'}`);
      })
      .catch((error) => {
        toast.error('Ошибка при переключении статуса');
        console.error('Ошибка:', error);
      });
  };

  if (status === 'loading') return <div>Загрузка...</div>;

  return (
    <div className={styles.mainBlockPromocodes}>
      <div className={styles.promocodeList}>
        <button onClick={() => setIsPopupOpen(true)} className={styles.promocodeAddButton}>
          <BsPlusCircle className={styles.iconPlus} />
          Добавить промокод
        </button>
        {items.map((promocode, index) => (
          <div key={promocode.id || `promocode-${index}`} className={styles.promocodeCard}>
            <p className={styles.typePromocodeText}>
              {promocode.type === 'temporary' ? 'Временный промокод' : 'Промокод'}
            </p>
            <p className={styles.timesOrNoPromocodeText}>
              {promocode.type === 'temporary'
                ? `С ${promocode.startDate} по ${promocode.endDate}`
                : 'Бессрочный'}
            </p>
            <p className={styles.percentageAndNumbText}>
              {promocode.discountType === 'percentage'
                ? `${promocode.discountValue}%`
                : `${promocode.discountValue}$`}
            </p>
            <h2 className={styles.promocodeNameText}>{promocode.name}</h2>
            <div className={styles.usageCountAndActiveBlock}>
              <p className={clsx(styles.usageCountAndActiveText, styles.blueText)}>
                {promocode.usageCount} использований
              </p>
              <p
                className={clsx(
                  styles.usageCountAndActiveText,
                  promocode.isActive && styles.activeText,
                )}>
                {promocode.isActive ? 'Активен' : 'Неактивен'}
              </p>
            </div>

            <div className={styles.buttonsDeleteAndChange}>
              <button
                onClick={() => handleToggle(promocode.id)}
                className={clsx(
                  styles.activeButtonPromocode,
                  promocode.isActive && styles.buttonActive,
                )}>
                {promocode.isActive ? 'Деактивировать' : 'Активировать'}
              </button>
              <button onClick={() => handleEdit(promocode)} className={styles.editButtonPromocode}>
                <BsPencil className={styles.editIcon} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isPopupOpen && (
        <div className={styles.popup}>
          <div className={styles.popupContent}>
            <h2>{editingPromocode ? 'Редактировать промокод' : 'Создать промокод'}</h2>
            <form onSubmit={handleSubmit}>
              <input
                name='name'
                value={formData.name}
                onChange={handleChange}
                placeholder='Название промокода'
                required
              />
              <select name='discountType' value={formData.discountType} onChange={handleChange}>
                <option value='percentage'>Процент</option>
                <option value='amount'>Сумма</option>
              </select>
              {formData.discountType === 'percentage' ? (
                <input
                  name='discountValue'
                  type='number'
                  value={formData.discountValue}
                  onChange={handleChange}
                  placeholder={'Процент'}
                  required
                  min='0'
                  max='100'
                />
              ) : (
                <input
                  name='discountValue'
                  type='number'
                  value={formData.discountValue}
                  onChange={handleChange}
                  placeholder={'Сумма'}
                  required
                  min='0'
                />
              )}
              <select name='type' value={formData.type} onChange={handleChange}>
                <option value='permanent'>Постоянный</option>
                <option value='temporary'>Временный</option>
              </select>
              {formData.type === 'temporary' && (
                <>
                  <input
                    name='startDate'
                    type='date'
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                  />
                  <input
                    name='endDate'
                    type='date'
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                  />
                </>
              )}
              <button type='submit'>{editingPromocode ? 'Сохранить' : 'Создать'}</button>
              <button type='button' onClick={() => setIsPopupOpen(false)}>
                Закрыть
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
