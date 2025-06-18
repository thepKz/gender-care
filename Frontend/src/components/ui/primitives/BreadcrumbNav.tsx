import React from 'react';
import { ArrowRight2 } from 'iconsax-react';
import { Link } from 'react-router-dom';

interface Crumb {
  label: string;
  to?: string;
  onClick?: () => void;
}

interface BreadcrumbNavProps {
  items: Crumb[];
  className?: string;
}

/**
 * BreadcrumbNav – đơn giản, linh hoạt.
 */
const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({ items, className='' }) => {
  return (
    <nav className={`text-sm text-gray-600 ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center flex-wrap gap-2">
        {items.map((item, idx) => (
          <React.Fragment key={idx}>
            {idx !== 0 && <ArrowRight2 size={14} className="text-gray-400" />}
            {item.to ? (
              <Link to={item.to} onClick={item.onClick} className="hover:underline hover:text-[#0C3C54]">
                {item.label}
              </Link>
            ) : (
              <span>{item.label}</span>
            )}
          </React.Fragment>
        ))}
      </ol>
    </nav>
  );
};

export default BreadcrumbNav;
