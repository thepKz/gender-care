import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

// Đăng ký plugin ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

const Footer: React.FC = () => {
  const footerRef = useRef<HTMLDivElement>(null);
  const column1Ref = useRef<HTMLDivElement>(null);
  const column2Ref = useRef<HTMLDivElement>(null);
  const column3Ref = useRef<HTMLDivElement>(null);
  const column4Ref = useRef<HTMLDivElement>(null);
  const copyrightRef = useRef<HTMLDivElement>(null);
  const socialIconsRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLAnchorElement[]>([]);

  useEffect(() => {
    // Animation khi footer xuất hiện trong viewport
    const footerElement = footerRef.current;
    
    if (footerElement) {
      // Thiết lập animation cho các cột
      gsap.fromTo(
        column1Ref.current,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: footerElement,
            start: 'top 90%',
          },
        }
      );

      gsap.fromTo(
        column2Ref.current,
        { y: 50, opacity: 0 },
        {
          y: 0, 
          opacity: 1,
          duration: 0.7,
          delay: 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: footerElement,
            start: 'top 90%',
          },
        }
      );

      gsap.fromTo(
        column3Ref.current,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          delay: 0.2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: footerElement,
            start: 'top 90%',
          },
        }
      );

      gsap.fromTo(
        column4Ref.current,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          delay: 0.3,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: footerElement,
            start: 'top 90%',
          },
        }
      );

      gsap.fromTo(
        copyrightRef.current,
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          delay: 0.5,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: footerElement,
            start: 'top 85%',
          },
        }
      );
      
      // Animation cho social icons
      if (socialIconsRef.current) {
        const icons = socialIconsRef.current.querySelectorAll('a');
        gsap.fromTo(
          icons,
          { scale: 0, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.5,
            stagger: 0.1,
            delay: 0.4,
            ease: 'back.out(1.7)',
            scrollTrigger: {
              trigger: footerElement,
              start: 'top 90%',
            },
          }
        );
      }

      // Animation cho các link khi hover
      linksRef.current.forEach(link => {
        link.addEventListener('mouseenter', () => {
          gsap.to(link, {
            x: 5,
            duration: 0.3,
            ease: 'power1.out',
          });
        });
        
        link.addEventListener('mouseleave', () => {
          gsap.to(link, {
            x: 0,
            duration: 0.3,
            ease: 'power1.out',
          });
        });
      });
    }
    
    // Cleanup function
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      
      linksRef.current.forEach(link => {
        link.removeEventListener('mouseenter', () => {});
        link.removeEventListener('mouseleave', () => {});
      });
    };
  }, []);

  // Function để lưu reference của các link
  const addLinkRef = (el: HTMLAnchorElement | null) => {
    if (el && !linksRef.current.includes(el)) {
      linksRef.current.push(el);
    }
  };

  return (
    <footer ref={footerRef} className="relative z-20 bg-gradient-to-b from-[#0e314e] to-[#175670] text-white pt-12 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div ref={column1Ref}>
            <h3 className="text-xl font-bold mb-4">Gender Care Center</h3>
            <p className="text-gray-300 mb-4">
              Chăm sóc sức khỏe giới tính toàn diện và chuyên nghiệp.
            </p>
            <div ref={socialIconsRef} className="flex space-x-4">
              <a href="#" className="text-white hover:text-blue-400 transform transition-transform hover:scale-110">
                <span className="sr-only">Facebook</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-white hover:text-blue-400 transform transition-transform hover:scale-110">
                <span className="sr-only">Instagram</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-white hover:text-blue-400 transform transition-transform hover:scale-110">
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
            </div>
          </div>
          
          <div ref={column2Ref}>
            <h3 className="text-lg font-semibold mb-4">Dịch vụ</h3>
            <ul className="space-y-2">
              <li><Link ref={addLinkRef} to="/services/consultation" className="text-gray-300 hover:text-white">Tư vấn sức khỏe</Link></li>
              <li><Link ref={addLinkRef} to="/services/testing" className="text-gray-300 hover:text-white">Xét nghiệm STI</Link></li>
              <li><Link ref={addLinkRef} to="/services/education" className="text-gray-300 hover:text-white">Giáo dục giới tính</Link></li>
              <li><Link ref={addLinkRef} to="/services/mental-health" className="text-gray-300 hover:text-white">Sức khỏe tâm thần</Link></li>
            </ul>
          </div>
          
          <div ref={column3Ref}>
            <h3 className="text-lg font-semibold mb-4">Liên kết</h3>
            <ul className="space-y-2">
              <li><Link ref={addLinkRef} to="/about" className="text-gray-300 hover:text-white">Về chúng tôi</Link></li>
              <li><Link ref={addLinkRef} to="/contact" className="text-gray-300 hover:text-white">Liên hệ</Link></li>
              <li><Link ref={addLinkRef} to="/faq" className="text-gray-300 hover:text-white">FAQ</Link></li>
              <li><Link ref={addLinkRef} to="/privacy" className="text-gray-300 hover:text-white">Chính sách bảo mật</Link></li>
              <li><Link ref={addLinkRef} to="/terms" className="text-gray-300 hover:text-white">Điều khoản sử dụng</Link></li>
            </ul>
          </div>
          
          <div ref={column4Ref}>
            <h3 className="text-lg font-semibold mb-4">Liên hệ</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start">
                <svg className="h-6 w-6 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>123 Nguyễn Văn Linh, Quận 7, TP.HCM</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>0123 456 789</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>info@gendercare.vn</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div ref={copyrightRef} className="border-t border-gray-700 mt-10 pt-6">
          <p className="text-center text-gray-400">
            &copy; {new Date().getFullYear()} Gender Care Center. Đã đăng ký bản quyền.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 