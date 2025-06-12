import { useSignUp } from '../../hooks/useSignUp';
import styles from './SignUp.module.scss';

export default function SignUp() {
  const { name, setName, email, setEmail, password, setPassword, error, loading, handleSignUp } =
    useSignUp();

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Регистрация</h2>
        <form onSubmit={handleSignUp} className={styles.form} noValidate>
          <div className={styles.inputGroup}>
            <label htmlFor='name' className={styles.label}>
              Имя
            </label>
            <input
              id='name'
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Введите имя'
              required
              aria-label='Введите ваше имя'
              className={styles.input}
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor='email' className={styles.label}>
              Email
            </label>
            <input
              id='email'
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='Введите email'
              required
              aria-label='Введите ваш email'
              aria-describedby='email-error'
              className={styles.input}
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor='password' className={styles.label}>
              Пароль
            </label>
            <input
              id='password'
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='Введите пароль'
              required
              aria-label='Введите ваш пароль'
              aria-describedby='password-error'
              className={styles.input}
            />
          </div>
          <button
            type='submit'
            disabled={loading}
            className={`${styles.button} ${loading ? styles.loading : ''}`}
            aria-busy={loading}>
            {loading ? <span className={styles.spinner}></span> : 'Зарегистрироваться'}
          </button>
        </form>
        {error && (
          <p id='error' className={styles.error} aria-live='polite'>
            {error}
          </p>
        )}
        <p className={styles.link}>
          Уже есть аккаунт?{' '}
          <a href='/signin' className={styles.linkText} aria-label='Перейти к входу'>
            Войти
          </a>
        </p>
      </div>
    </div>
  );
}
