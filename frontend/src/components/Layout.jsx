import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import NotificationToast from './NotificationToast';

function Layout() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <NotificationToast />
      <main className="flex-grow-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default Layout;
