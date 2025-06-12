import { useSignIn } from '../../hooks/useSignIn';
import styles from './SignIn.module.scss';

export default function SignIn() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    error,
    loading,
    handleSignIn,
    handleResetPassword,
  } = useSignIn();

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Вход</h2>
        <form onSubmit={handleSignIn} className={styles.form} noValidate>
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
            {loading ? <span className={styles.spinner}></span> : 'Войти'}
          </button>
        </form>

        {error && (
          <p id='error' className={styles.error} aria-live='polite'>
            {error}
          </p>
        )}

        <p className={styles.link}>
          <button
            onClick={handleResetPassword}
            className={styles.linkButton}
            aria-label='Сбросить пароль'>
            Забыли пароль?
          </button>
        </p>

        <p className={styles.link}>
          Нет аккаунта?{' '}
          <a href='/signup' className={styles.linkText} aria-label='Перейти к регистрации'>
            Зарегистрироваться
          </a>
        </p>
      </div>
    </div>
  );
}
