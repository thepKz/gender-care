import { Avatar, Drawer, Dropdown, MenuProps } from "antd";
import { motion } from 'framer-motion';
import { CalendarEdit, CloseCircle, Logout, Menu, User } from "iconsax-react";
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './header.css';

const Header: React.FC = () => {
  const { user, token, handleLogout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      setScrollY(offset);
      
      if (offset > 80) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    // Đóng mobile menu khi chuyển trang
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const onLogout = async () => {
    await handleLogout();
    navigate('/login');
  };

  // Menu Dịch vụ dropdown
  const services: MenuProps["items"] = [
    {
      key: "1",
      label: "Tư vấn",
      onClick: () => navigate('/services/consulting'),
    },
    {
      key: "2",
      label: "Xét nghiệm STIs",
      onClick: () => navigate('/services/sti-test'),
    },
    {
      key: "3",
      label: "Bảng giá",
      onClick: () => navigate('/services/price-list'),
    },
  ];

  // Menu Đặt lịch dropdown cho khách vãng lai
  const bookingGuest: MenuProps["items"] = [
    {
      key: "1",
      label: "Tư vấn",
      onClick: () => navigate('/booking/consultation'),
    },
    {
      key: "2",
      label: "Xét nghiệm",
      onClick: () => navigate('/booking/test'),
    },
  ];

  // Menu Đặt lịch dropdown cho người dùng đã đăng nhập
  const bookingUser: MenuProps["items"] = [
    {
      key: "1",
      label: "Tư vấn",
      onClick: () => navigate('/booking/consultation'),
    },
    {
      key: "2",
      label: "Xét nghiệm",
      onClick: () => navigate('/booking/test'),
    },
    {
      key: "3",
      label: "Theo dõi chu kỳ",
      onClick: () => navigate('/cycle-tracking'),
    },
  ];

  // Menu Hồ sơ cá nhân dropdown
  const profile: MenuProps["items"] = [
    {
      key: "1",
      icon: <User size={20} className="profile-icon" />,
      label: "Thông tin cá nhân",
      onClick: () => navigate('/profile'),
    },
    {
      key: "2",
      label: "Lịch sử đặt lịch",
      onClick: () => navigate('/booking-history'),
    },
    {
      key: "3",
      label: "Feedback",
      onClick: () => navigate('/feedback'),
    },
    {
      type: "divider",
    },
    {
      key: "4",
      label: "Đăng xuất",
      icon: <Logout size={20} className="logout-icon" />,
      onClick: onLogout,
    },
  ];

  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : '';
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Tính toán opacity dựa trên scroll position
  const headerOpacity = Math.max(1 - scrollY / 500, 0.9);
  const headerStyle = {
    backgroundColor: `rgba(12, 60, 84, ${headerOpacity})`,
    backdropFilter: scrolled ? 'blur(8px)' : 'none',
  };

  // Dynamic sizing based on screen width
  const getHeaderHeight = () => {
    if (windowWidth >= 1280) return 'h-20'; // xl screens
    if (windowWidth >= 1024) return 'h-18'; // lg screens
    if (windowWidth >= 768) return 'h-16'; // md screens
    return 'h-14'; // sm and below
  };

  const getLogoSize = () => {
    if (windowWidth >= 1280) return 'h-14'; // xl screens
    if (windowWidth >= 1024) return 'h-11'; // lg screens
    if (windowWidth >= 768) return 'h-10'; // md screens
    return 'h-9'; // sm and below
  };

  const getButtonPadding = () => {
    if (windowWidth >= 1280) return 'px-6 py-2.5'; 
    if (windowWidth >= 1024) return 'px-5 py-2'; 
    if (windowWidth >= 768) return 'px-4 py-1.5'; 
    return 'px-3 py-1.5'; 
  };

  const getFontSize = () => {
    if (windowWidth >= 1024) return 'text-base';
    return 'text-sm';
  };

  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed z-50 w-full transition-all duration-300 ${scrolled ? 'shadow-lg' : ''} py-2 md:py-2.5 lg:py-3 pb-3 md:pb-3.5 lg:pb-4 ${getHeaderHeight()}`}
      style={headerStyle}
    >
      <div className="container mx-auto px-4 h-full">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center">
            <Link to="/" className="flex items-center transition-transform duration-300 hover:scale-110">
              <motion.img
                whileHover={{ rotate: [0, -5, 5, -5, 0] }}
                transition={{ duration: 0.5 }}
                src="/images/logo.jpg"
                alt="Logo"
                className={`${getLogoSize()} w-auto mr-2`}
              />
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center justify-center space-x-3 lg:space-x-5 xl:space-x-7 flex-1 px-2 lg:px-4">
            {/* Menu chính */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
            >
              <Link to="/" className={`nav-link ${getFontSize()} ${isActive('/')}`}>
                Trang chủ
              </Link>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Dropdown 
                menu={{ items: services }} 
                placement="bottomCenter" 
                className="custom-dropdown"
                trigger={['hover']}
                mouseEnterDelay={0.1}
                mouseLeaveDelay={0.2}
                dropdownRender={(menu) => (
                  <div className="custom-dropdown-container">
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {React.cloneElement(menu as React.ReactElement)}
                    </motion.div>
                  </div>
                )}
              >
                <div className="dropdown-trigger">
                  <span className={`nav-link ${getFontSize()} cursor-pointer ${isActive('/services')}`}>
                    Dịch vụ
                  </span>
                </div>
              </Dropdown>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              <Dropdown 
                menu={{ items: token ? bookingUser : bookingGuest }} 
                placement="bottomCenter"
                className="custom-dropdown"
                trigger={['hover']}
                mouseEnterDelay={0.1}
                mouseLeaveDelay={0.2}
                dropdownRender={(menu) => (
                  <div className="custom-dropdown-container">
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {React.cloneElement(menu as React.ReactElement)}
                    </motion.div>
                  </div>
                )}
              >
                <div className="dropdown-trigger">
                  <span className={`nav-link ${getFontSize()} cursor-pointer ${isActive('/booking')}`}>
                    Đặt lịch
                  </span>
                </div>
              </Dropdown>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Link to="/counselors" className={`nav-link ${getFontSize()} ${isActive('/counselors')}`}>
                Tư vấn viên
              </Link>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25 }}
            >
              <Link to="/about-gcc" className={`nav-link ${getFontSize()} ${isActive('/about-gcc')}`}>
                Về chúng tôi
              </Link>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Link to="/faq" className={`nav-link ${getFontSize()} ${isActive('/faq')}`}>
                Hỏi & Đáp
              </Link>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.35 }}
            >
              <Link to="/blog" className={`nav-link ${getFontSize()} ${isActive('/blog')}`}>
                Blog
              </Link>
            </motion.div>
          </nav>

          {/* Mobile menu button */}
          <div className="block md:hidden">
            <button 
              onClick={toggleMobileMenu}
              className="text-white p-2 focus:outline-none"
              aria-label="Menu"
            >
              <Menu size={windowWidth < 640 ? "24" : "28"} color="#fff" />
            </button>
          </div>

          <div className="hidden md:flex items-center justify-end ml-4 lg:ml-6">
            {!token ? (
              <div className="flex items-center space-x-3 lg:space-x-4">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link to="/login" className={`btn-auth text-white border border-white rounded-md ${getButtonPadding()} ${getFontSize()} font-medium`}>
                    Đăng nhập
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link to="/register" className={`btn-auth bg-white text-blue-primary rounded-md ${getButtonPadding()} ${getFontSize()} font-medium`}>
                    Đăng ký
                  </Link>
                </motion.div>
              </div>
            ) : (
              <div className="flex items-center gap-3 lg:gap-4">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Link
                    to="/booking"
                    className="btn-auth text-white p-2 rounded-full hover:bg-white/10"
                  >
                    <CalendarEdit
                      color="white"
                      size={windowWidth >= 1024 ? 26 : 24}
                      variant="Bold"
                    />
                  </Link>
                </motion.div>
                <Dropdown 
                  menu={{ items: profile }} 
                  placement="bottomRight"
                  className="profile-dropdown"
                  trigger={['hover']}
                  mouseEnterDelay={0.1}
                  mouseLeaveDelay={0.3}
                  dropdownRender={(menu) => (
                    <div className="profile-dropdown-container">
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {React.cloneElement(menu as React.ReactElement)}
                      </motion.div>
                    </div>
                  )}
                >
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Avatar
                      src={user?.avatar}
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                      icon={<User size={windowWidth >= 1024 ? 20 : 18} />}
                      size={windowWidth >= 1024 ? "large" : "default"}
                    />
                  </motion.div>
                </Dropdown>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <Drawer
        title={
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-blue-primary">Menu</span>
            <button onClick={() => setMobileMenuOpen(false)} className="focus:outline-none">
              <CloseCircle size="24" color="#0c3c54" />
            </button>
          </div>
        }
        placement="right"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        width={windowWidth < 640 ? 260 : 280}
        bodyStyle={{ padding: 0 }}
      >
        <div className="flex flex-col h-full">
          <div className="py-4 px-6 flex-1">
            <nav className="flex flex-col space-y-4">
              <Link to="/" className="py-2 border-b border-gray-100 text-blue-primary text-lg">
                Trang chủ
              </Link>
              
              <div className="py-2 border-b border-gray-100">
                <div className="flex justify-between items-center text-blue-primary text-lg">
                  <span>Dịch vụ</span>
                </div>
                <div className="mt-2 pl-4 flex flex-col space-y-2">
                  <Link to="/services/consulting" className="text-gray-600 text-base">
                    Tư vấn
                  </Link>
                  <Link to="/services/sti-test" className="text-gray-600 text-base">
                    Xét nghiệm STIs
                  </Link>
                  <Link to="/services/price-list" className="text-gray-600 text-base">
                    Bảng giá
                  </Link>
                </div>
              </div>
              
              <div className="py-2 border-b border-gray-100">
                <div className="flex justify-between items-center text-blue-primary text-lg">
                  <span>Đặt lịch</span>
                </div>
                <div className="mt-2 pl-4 flex flex-col space-y-2">
                  <Link to="/booking/consultation" className="text-gray-600 text-base">
                    Tư vấn
                  </Link>
                  <Link to="/booking/test" className="text-gray-600 text-base">
                    Xét nghiệm
                  </Link>
                  {token && (
                    <Link to="/cycle-tracking" className="text-gray-600 text-base">
                      Theo dõi chu kỳ
                    </Link>
                  )}
                </div>
              </div>
              
              <Link to="/counselors" className="py-2 border-b border-gray-100 text-blue-primary text-lg">
                Tư vấn viên
              </Link>
              
              <Link to="/about-gcc" className="py-2 border-b border-gray-100 text-blue-primary text-lg">
                Về chúng tôi
              </Link>
              
              <Link to="/faq" className="py-2 border-b border-gray-100 text-blue-primary text-lg">
                Hỏi & Đáp
              </Link>
              
              <Link to="/blog" className="py-2 border-b border-gray-100 text-blue-primary text-lg">
                Blog
              </Link>
            </nav>
          </div>
          
          <div className="p-4 border-t border-gray-200">
            {!token ? (
              <div className="flex flex-col space-y-3">
                <Link to="/login" className="w-full py-2.5 border border-blue-primary text-blue-primary rounded-md text-center text-base font-medium transition-colors hover:bg-blue-50">
                  Đăng nhập
                </Link>
                <Link to="/register" className="w-full py-2.5 bg-blue-primary text-white rounded-md text-center text-base font-medium transition-colors hover:bg-blue-primary/90">
                  Đăng ký
                </Link>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Avatar
                    src={user?.avatar}
                    icon={<User size={18} />}
                  />
                  <span className="text-gray-700 font-medium">
                    {user?.fullName || 'Người dùng'}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="text-red-500 flex items-center gap-1"
                >
                  <Logout size={18} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </Drawer>
    </motion.header>
  );
};

export default Header; 