import { X } from 'lucide-react';
import { useState } from 'react';

export default function ConditionImagesModal({ images, isOpen, onClose }) {
  const [selectedImage, setSelectedImage] = useState(null);

  if (!isOpen || !images) return null;

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `https://localhost:7108${url.startsWith('/') ? url : `/${url}`}`;
  };

  const imageList = [
    { label: 'Front View', url: images.frontImageUrl },
    { label: 'Rear View', url: images.rearImageUrl },
    { label: 'Left Side', url: images.leftSideImageUrl },
    { label: 'Right Side', url: images.rightSideImageUrl },
    { label: 'Interior', url: images.interiorImageUrl },
    { label: 'Odometer', url: images.odometerImageUrl }
  ].filter(img => img.url);

  if (imageList.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">Submitted Images</h3>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {imageList.map((img, idx) => (
              <div 
                key={idx} 
                className="group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer shadow-sm border border-gray-100"
                onClick={() => setSelectedImage(img)}
              >
                <img 
                  src={getImageUrl(img.url)} 
                  alt={img.label} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <span className="text-white font-bold text-sm">{img.label}</span>
                </div>
              </div>
            ))}
          </div>
          {images.managerRemarks && (
            <div className="mt-6 p-4 bg-orange-50 rounded-2xl border border-orange-100">
              <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-1">Manager Remarks</p>
              <p className="text-sm font-medium text-orange-900">{images.managerRemarks}</p>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Image Preview */}
      {selectedImage && (
        <div className="fixed inset-0 z-[110] bg-black flex flex-col items-center justify-center animate-in fade-in duration-200">
          <button 
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors backdrop-blur-md"
          >
            <X size={24} />
          </button>
          <img 
            src={getImageUrl(selectedImage.url)} 
            alt={selectedImage.label} 
            className="max-w-full max-h-[85vh] object-contain rounded-lg" 
          />
          <p className="text-white font-bold text-lg mt-6">{selectedImage.label}</p>
        </div>
      )}
    </div>
  );
}
