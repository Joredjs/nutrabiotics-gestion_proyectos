import { X } from 'lucide-react';
import { Sidebar } from './Sidebar';

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  return (
    <div className={`lg:hidden ${open ? 'block' : 'hidden'}`}>
      <div className="fixed inset-0 flex z-40">
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose} />

        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gray-800">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={onClose}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <Sidebar />
        </div>

        <div className="flex-shrink-0 w-14" />
      </div>
    </div>
  );
}
