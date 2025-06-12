export default function DashBoard({ handleLogout }) {
  return (
    <div className='p-4'>
      <h1 className='text-2xl font-bold mb-4'>DashBoard</h1>
      <button
        onClick={handleLogout}
        className='px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600'>
        Выйти
      </button>
    </div>
  );
}
